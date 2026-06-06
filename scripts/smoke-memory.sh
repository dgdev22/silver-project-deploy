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

delete_json() {
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
    -X DELETE \
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
assert_contains "$public_body" "\"announcements\"" "Public memory API should include announcements"
assert_contains "$public_body" "\"familyMembers\"" "Public memory API should include familyMembers"
assert_contains "$public_body" "\"contentRevisions\"" "Public memory API should include contentRevisions"
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

life_event_body="$(post_json memory_life_event "${API_BASE_URL}/api/memory/memorials/${MEMORY_SLUG}/life-events" 201 "{\"eventYear\":\"점검\",\"title\":\"Smoke Test Timeline\",\"body\":\"운영 점검용 타임라인 ${timestamp}\",\"editorName\":\"운영 점검\"}")"
assert_contains "$life_event_body" "\"title\":\"Smoke Test Timeline\"" "Smoke life event should be created"
life_event_id="$(sed -n 's/.*"id":\([0-9][0-9]*\).*/\1/p' "$life_event_body" | head -n 1)"

if [ -z "$life_event_id" ]; then
  echo "FAIL: Could not find life event id in response" >&2
  sed -n '1,80p' "$life_event_body" >&2
  exit 1
fi

life_event_patch_body="$(patch_json memory_life_event_patch "${API_BASE_URL}/api/memory/life-events/${life_event_id}" 200 "{\"eventYear\":\"점검\",\"title\":\"Smoke Test Timeline Updated\",\"body\":\"운영 점검용 타임라인 수정 ${timestamp}\",\"editorName\":\"운영 점검\"}")"
assert_contains "$life_event_patch_body" "\"title\":\"Smoke Test Timeline Updated\"" "Smoke life event should be updated"
delete_json memory_life_event_delete "${API_BASE_URL}/api/memory/life-events/${life_event_id}" 204 "{\"editorName\":\"운영 점검\"}" >/dev/null
echo "PASS life event write/update/delete"

moment_body="$(post_json memory_moment "${API_BASE_URL}/api/memory/memorials/${MEMORY_SLUG}/moments" 201 "{\"title\":\"Smoke Test Moment\",\"tag\":\"운영 점검\",\"body\":\"운영 점검용 기억 카드 ${timestamp}\",\"editorName\":\"운영 점검\"}")"
assert_contains "$moment_body" "\"title\":\"Smoke Test Moment\"" "Smoke moment should be created"
moment_id="$(sed -n 's/.*"id":\([0-9][0-9]*\).*/\1/p' "$moment_body" | head -n 1)"

if [ -z "$moment_id" ]; then
  echo "FAIL: Could not find moment id in response" >&2
  sed -n '1,80p' "$moment_body" >&2
  exit 1
fi

moment_patch_body="$(patch_json memory_moment_patch "${API_BASE_URL}/api/memory/moments/${moment_id}" 200 "{\"title\":\"Smoke Test Moment Updated\",\"tag\":\"운영 점검\",\"body\":\"운영 점검용 기억 카드 수정 ${timestamp}\",\"editorName\":\"운영 점검\"}")"
assert_contains "$moment_patch_body" "\"title\":\"Smoke Test Moment Updated\"" "Smoke moment should be updated"
delete_json memory_moment_delete "${API_BASE_URL}/api/memory/moments/${moment_id}" 204 "{\"editorName\":\"운영 점검\"}" >/dev/null
echo "PASS moment write/update/delete"

announcement_body="$(post_json memory_announcement "${API_BASE_URL}/api/memory/memorials/${MEMORY_SLUG}/announcements" 201 "{\"title\":\"Smoke Test Notice\",\"body\":\"운영 점검용 공지 ${timestamp}\",\"announcementType\":\"notice\",\"pinned\":false,\"editorName\":\"운영 점검\"}")"
assert_contains "$announcement_body" "\"title\":\"Smoke Test Notice\"" "Smoke announcement should be created"
announcement_id="$(sed -n 's/.*"id":\([0-9][0-9]*\).*/\1/p' "$announcement_body" | head -n 1)"

if [ -z "$announcement_id" ]; then
  echo "FAIL: Could not find announcement id in response" >&2
  sed -n '1,80p' "$announcement_body" >&2
  exit 1
fi

announcement_patch_body="$(patch_json memory_announcement_patch "${API_BASE_URL}/api/memory/announcements/${announcement_id}" 200 "{\"title\":\"Smoke Test Notice Updated\",\"body\":\"운영 점검용 공지 수정 ${timestamp}\",\"announcementType\":\"update\",\"pinned\":true,\"editorName\":\"운영 점검\"}")"
assert_contains "$announcement_patch_body" "\"title\":\"Smoke Test Notice Updated\"" "Smoke announcement should be updated"
assert_contains "$announcement_patch_body" "\"announcementType\":\"update\"" "Smoke announcement type should be updated"
delete_json memory_announcement_delete "${API_BASE_URL}/api/memory/announcements/${announcement_id}" 204 "{\"editorName\":\"운영 점검\"}" >/dev/null
echo "PASS announcement write/update/delete"

echo "Memory smoke test complete."
