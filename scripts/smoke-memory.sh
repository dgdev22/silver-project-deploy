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
MEMORY_SMOKE_RETRIES="${SILVER_MEMORY_SMOKE_RETRIES:-6}"
MEMORY_SMOKE_RETRY_SLEEP_SECONDS="${SILVER_MEMORY_SMOKE_RETRY_SLEEP_SECONDS:-2}"

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
  local attempt

  : > "$output"
  for attempt in $(seq 1 "$MEMORY_SMOKE_RETRIES"); do
    status="$(curl -sS -L -o "$output" -w "%{http_code}" "$url" || printf '000')"

    if [ "$status" = "$expected_status" ]; then
      echo "$output"
      return
    fi

    if [ "$attempt" -lt "$MEMORY_SMOKE_RETRIES" ]; then
      sleep "$MEMORY_SMOKE_RETRY_SLEEP_SECONDS"
    fi
  done

  echo "FAIL $name: expected HTTP $expected_status but got $status" >&2
  echo "URL: $url" >&2
  sed -n '1,40p' "$output" >&2
  exit 1
}

curl_editor_body() {
  local name="$1"
  local url="$2"
  local expected_status="$3"
  local output="$TMP_DIR/${name}.body"
  local status
  local attempt

  : > "$output"
  for attempt in $(seq 1 "$MEMORY_SMOKE_RETRIES"); do
    status="$(curl -sS -L \
      -H "X-Memory-Editor-Token: ${MEMORY_EDITOR_TOKEN:-}" \
      -o "$output" \
      -w "%{http_code}" \
      "$url" || printf '000')"

    if [ "$status" = "$expected_status" ]; then
      echo "$output"
      return
    fi

    if [ "$attempt" -lt "$MEMORY_SMOKE_RETRIES" ]; then
      sleep "$MEMORY_SMOKE_RETRY_SLEEP_SECONDS"
    fi
  done

  echo "FAIL $name: expected HTTP $expected_status but got $status" >&2
  echo "URL: $url" >&2
  sed -n '1,80p' "$output" >&2
  exit 1
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

assert_html_assets_reachable() {
  local label="$1"
  local file="$2"
  local base_url="$3"
  local urls_file="$TMP_DIR/${label}_assets.urls"
  local asset_url
  local count=0

  python3 - "$file" "$base_url" > "$urls_file" <<'PY'
import sys
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse

path = sys.argv[1]
base_url = sys.argv[2]
base_origin = urlparse(base_url)
asset_urls = []


class AssetParser(HTMLParser):
    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)

        if tag == "script" and attributes.get("src"):
            asset_urls.append(attributes["src"])
            return

        if tag != "link" or not attributes.get("href"):
            return

        rel = set((attributes.get("rel") or "").lower().split())
        if rel & {
            "stylesheet",
            "preload",
            "modulepreload",
            "icon",
            "apple-touch-icon",
            "manifest",
        }:
            asset_urls.append(attributes["href"])


with open(path, encoding="utf-8", errors="replace") as handle:
    parser = AssetParser()
    parser.feed(handle.read())

seen = set()
for value in asset_urls:
    parsed_value = urlparse(value)
    if parsed_value.scheme in {"data", "mailto", "tel"}:
        continue

    url = urljoin(base_url + "/", value)
    parsed_url = urlparse(url)
    if (parsed_url.scheme, parsed_url.netloc) != (base_origin.scheme, base_origin.netloc):
        continue

    if url not in seen:
        seen.add(url)
        print(url)
PY

  while IFS= read -r asset_url; do
    [ -n "$asset_url" ] || continue
    count=$((count + 1))
    curl_body "${label}_asset_${count}" "$asset_url" 200 >/dev/null
  done < "$urls_file"

  if [ "$count" -eq 0 ]; then
    echo "FAIL $label: no static assets found in page HTML" >&2
    sed -n '1,80p' "$file" >&2
    exit 1
  fi

  echo "PASS $label static assets: $count reachable"
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

post_upload() {
  local name="$1"
  local url="$2"
  local expected_status="$3"
  local file="$4"
  local output="$TMP_DIR/${name}.body"
  local status

  : > "$output"
  status="$(curl -sS -L \
    -H "X-Memory-Editor-Token: ${MEMORY_EDITOR_TOKEN:-}" \
    -o "$output" \
    -w "%{http_code}" \
    -X POST \
    -F "file=@${file};type=image/png" \
    "$url")"

  if [ "$status" != "$expected_status" ]; then
    echo "FAIL $name: expected HTTP $expected_status but got $status" >&2
    echo "URL: $url" >&2
    sed -n '1,80p' "$output" >&2
    exit 1
  fi

  echo "$output"
}

download_file() {
  local name="$1"
  local url="$2"
  local expected_status="$3"
  local output="$TMP_DIR/${name}.body"
  local status
  local attempt

  : > "$output"
  for attempt in $(seq 1 "$MEMORY_SMOKE_RETRIES"); do
    status="$(curl -sS -L -o "$output" -w "%{http_code}" "$url" || printf '000')"

    if [ "$status" = "$expected_status" ]; then
      if [ ! -s "$output" ]; then
        echo "FAIL $name: downloaded file is empty" >&2
        echo "URL: $url" >&2
        exit 1
      fi

      echo "$output"
      return
    fi

    if [ "$attempt" -lt "$MEMORY_SMOKE_RETRIES" ]; then
      sleep "$MEMORY_SMOKE_RETRY_SLEEP_SECONDS"
    fi
  done

  echo "FAIL $name: expected HTTP $expected_status but got $status" >&2
  echo "URL: $url" >&2
  exit 1
}

create_smoke_png() {
  local output="$1"
  local png_base64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII="

  if printf '%s' "$png_base64" | base64 --decode > "$output" 2>/dev/null; then
    return
  fi

  printf '%s' "$png_base64" | base64 -D > "$output"
}

absolute_url() {
  local path="$1"

  case "$path" in
    http://*|https://*)
      printf '%s\n' "$path"
      ;;
    /*)
      printf '%s\n' "${API_BASE_URL}${path}"
      ;;
    *)
      printf '%s\n' "${API_BASE_URL}/${path}"
      ;;
  esac
}

assert_png_signature() {
  local file="$1"
  local signature

  signature="$(head -c 8 "$file" | base64 | tr -d '\n')"

  if [ "$signature" != "iVBORw0KGgo=" ]; then
    echo "FAIL: uploaded image should be served as PNG content" >&2
    exit 1
  fi
}

require_command curl
require_command grep
require_command python3

echo "Silver Memory smoke test"
echo "Memory app: $MEMORY_APP_URL"
echo "API base:   $API_BASE_URL"
echo "Slug:       $MEMORY_SLUG"
echo "Retries:    $MEMORY_SMOKE_RETRIES"

frontend_body="$(curl_body memory_frontend "${MEMORY_APP_URL}/" 200)"
assert_contains "$frontend_body" "Silver Memory" "Memory frontend HTML should include Silver Memory"
assert_contains "$frontend_body" "src/main.js" "Memory frontend should load src/main.js"
assert_html_assets_reachable memory_frontend "$frontend_body" "$MEMORY_APP_URL"
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

if [ "${SILVER_MEMORY_SMOKE_WRITE:-0}" != "1" ] && [ "${SILVER_MEMORY_SMOKE_UPLOAD:-0}" != "1" ]; then
  echo "SKIP write/upload checks. Set SILVER_MEMORY_SMOKE_WRITE=1 for content writes or SILVER_MEMORY_SMOKE_UPLOAD=1 for image upload verification."
  echo "Memory smoke test complete."
  exit 0
fi

if [ -z "${MEMORY_EDITOR_TOKEN:-}" ]; then
  echo "SILVER_MEMORY_SMOKE_WRITE=1 or SILVER_MEMORY_SMOKE_UPLOAD=1 requires MEMORY_EDITOR_TOKEN." >&2
  exit 1
fi

moderation_body="$(curl_editor_body memory_moderation_allowed "${API_BASE_URL}/api/memory/memorials/${MEMORY_SLUG}?includeModeration=true" 200)"
assert_contains "$moderation_body" "\"editHistory\"" "Moderation API should include editHistory"
echo "PASS moderation API"

if [ "${SILVER_MEMORY_SMOKE_UPLOAD:-0}" = "1" ]; then
  require_command base64

  smoke_png="$TMP_DIR/memory-smoke.png"
  create_smoke_png "$smoke_png"

  upload_body="$(post_upload memory_upload "${API_BASE_URL}/api/memory/memorials/${MEMORY_SLUG}/uploads" 201 "$smoke_png")"
  assert_contains "$upload_body" "\"contentType\":\"image/png\"" "Upload response should preserve image/png content type"

  upload_url="$(sed -n 's/.*"url":"\([^"]*\)".*/\1/p' "$upload_body" | head -n 1)"

  if [ -z "$upload_url" ]; then
    echo "FAIL: Could not find upload url in response" >&2
    sed -n '1,80p' "$upload_body" >&2
    exit 1
  fi

  uploaded_file_body="$(download_file memory_upload_file "$(absolute_url "$upload_url")" 200)"
  assert_png_signature "$uploaded_file_body"
  echo "PASS image upload/retrieval"
else
  echo "SKIP upload check. Set SILVER_MEMORY_SMOKE_UPLOAD=1 to upload a tiny PNG and verify /uploads/memory."
fi

if [ "${SILVER_MEMORY_SMOKE_WRITE:-0}" != "1" ]; then
  echo "SKIP content write checks. Set SILVER_MEMORY_SMOKE_WRITE=1 to test guestbook, timeline, moments, and announcements."
  echo "Memory smoke test complete."
  exit 0
fi

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
