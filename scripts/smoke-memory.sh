#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${SILVER_BASE_URL:-}}"

if [ -z "$BASE_URL" ] && [ -n "${SITE_DOMAIN:-}" ]; then
  BASE_URL="https://${SITE_DOMAIN}"
fi

BASE_URL="${BASE_URL:-https://silver.loopmateapp.com}"
BASE_URL="${BASE_URL%/}"

MEMORY_APP_URL="${SILVER_MEMORY_APP_URL:-${BASE_URL}/memory}"
API_BASE_URL="${SILVER_API_BASE_URL:-$BASE_URL}"
MEMORY_APP_URL="${MEMORY_APP_URL%/}"
API_BASE_URL="${API_BASE_URL%/}"
MEMORY_SLUG="${SILVER_MEMORY_SLUG:-kim-youngsu}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

curl_body() {
  local name="$1"
  local url="$2"
  local expected_status="$3"
  local output="$TMP_DIR/${name}.body"
  local status

  : > "$output"
  status="$(curl -sS -L -o "$output" -w "%{http_code}" "$url")"

  if [ "$status" != "$expected_status" ]; then
    echo "FAIL $name: expected HTTP $expected_status but got $status" >&2
    echo "URL: $url" >&2
    sed -n '1,40p' "$output" >&2
    exit 1
  fi

  echo "$output"
}

curl_editor_body() {
  local name="$1"
  local url="$2"
  local expected_status="$3"
  local output="$TMP_DIR/${name}.body"
  local status

  : > "$output"
  status="$(curl -sS -L \
    -H "X-Memory-Editor-Token: ${MEMORY_EDITOR_TOKEN:-}" \
    -o "$output" \
    -w "%{http_code}" \
    "$url")"

  if [ "$status" != "$expected_status" ]; then
    echo "FAIL $name: expected HTTP $expected_status but got $status" >&2
    echo "URL: $url" >&2
    sed -n '1,80p' "$output" >&2
    exit 1
  fi

  echo "$output"
}

assert_contains() {
  local file="$1"
  local pattern="$2"
  local message="$3"

  if ! grep -q "$pattern" "$file"; then
    echo "FAIL: $message" >&2
    sed -n '1,40p' "$file" >&2
    exit 1
  fi
}

post_json() {
  local name="$1"
  local url="$2"
  local expected_status="$3"
  local body="$4"
  local output="$TMP_DIR/${name}.body"
  local status

  : > "$output"
  status="$(curl -sS -L \
    -H "Content-Type: application/json" \
    -H "X-Memory-Editor-Token: ${MEMORY_EDITOR_TOKEN:-}" \
    -o "$output" \
    -w "%{http_code}" \
    -X POST \
    --data "$body" \
    "$url")"

  if [ "$status" != "$expected_status" ]; then
    echo "FAIL $name: expected HTTP $expected_status but got $status" >&2
    echo "URL: $url" >&2
    sed -n '1,80p' "$output" >&2
    exit 1
  fi

  echo "$output"
}

patch_json() {
  local name="$1"
  local url="$2"
  local expected_status="$3"
  local body="$4"
  local output="$TMP_DIR/${name}.body"
  local status

  : > "$output"
  status="$(curl -sS -L \
    -H "Content-Type: application/json" \
    -H "X-Memory-Editor-Token: ${MEMORY_EDITOR_TOKEN:-}" \
    -o "$output" \
    -w "%{http_code}" \
    -X PATCH \
    --data "$body" \
    "$url")"

  if [ "$status" != "$expected_status" ]; then
    echo "FAIL $name: expected HTTP $expected_status but got $status" >&2
    echo "URL: $url" >&2
    sed -n '1,80p' "$output" >&2
    exit 1
  fi

  echo "$output"
}

require_command curl
require_command grep

echo "Silver Memory smoke test"
echo "Memory app: $MEMORY_APP_URL"
echo "API base:   $API_BASE_URL"
echo "Slug:       $MEMORY_SLUG"

frontend_body="$(curl_body memory_frontend "${MEMORY_APP_URL}/" 200)"
assert_contains "$frontend_body" "Silver Memory" "Memory frontend HTML should include Silver Memory"
assert_contains "$frontend_body" "src/main.js" "Memory frontend should load src/main.js"
echo "PASS frontend"

public_body="$(curl_body memory_public "${API_BASE_URL}/api/memory/memorials/${MEMORY_SLUG}" 200)"
assert_contains "$public_body" "\"profile\"" "Public memory API should include profile"
assert_contains "$public_body" "\"guestbook\"" "Public memory API should include guestbook"
echo "PASS public API"

moderation_denied="$(curl_body memory_moderation_denied "${API_BASE_URL}/api/memory/memorials/${MEMORY_SLUG}?includeModeration=true" 403)"
assert_contains "$moderation_denied" "Invalid memory editor token\\|Forbidden\\|403" "Moderation API should reject missing editor token"
echo "PASS editor protection"

if [ "${SILVER_MEMORY_SMOKE_WRITE:-0}" != "1" ]; then
  echo "SKIP write checks. Set SILVER_MEMORY_SMOKE_WRITE=1 and MEMORY_EDITOR_TOKEN to test moderation writes."
  echo "Memory smoke test complete."
  exit 0
fi

if [ -z "${MEMORY_EDITOR_TOKEN:-}" ]; then
  echo "SILVER_MEMORY_SMOKE_WRITE=1 requires MEMORY_EDITOR_TOKEN." >&2
  exit 1
fi

moderation_body="$(curl_editor_body memory_moderation_allowed "${API_BASE_URL}/api/memory/memorials/${MEMORY_SLUG}?includeModeration=true" 200)"
assert_contains "$moderation_body" "\"editHistory\"" "Moderation API should include editHistory"
echo "PASS moderation API"

timestamp="$(date '+%Y-%m-%d %H:%M:%S')"
guestbook_body="$(post_json memory_guestbook "${API_BASE_URL}/api/memory/memorials/${MEMORY_SLUG}/guestbook" 201 "{\"author\":\"Smoke Test\",\"relation\":\"운영 점검\",\"message\":\"운영 점검 메시지 ${timestamp}\"}")"
assert_contains "$guestbook_body" "\"status\":\"pending\"" "New guestbook entry should start as pending"
guestbook_id="$(sed -n 's/.*"id":\([0-9][0-9]*\).*/\1/p' "$guestbook_body" | head -n 1)"

if [ -z "$guestbook_id" ]; then
  echo "FAIL: Could not find guestbook id in response" >&2
  sed -n '1,80p' "$guestbook_body" >&2
  exit 1
fi

patch_body="$(patch_json memory_guestbook_hide "${API_BASE_URL}/api/memory/guestbook/${guestbook_id}" 200 "{\"status\":\"hidden\",\"editorName\":\"운영 점검\"}")"
assert_contains "$patch_body" "\"status\":\"hidden\"" "Smoke guestbook entry should be hidden after moderation"
echo "PASS guestbook write/moderation"

echo "Memory smoke test complete."
