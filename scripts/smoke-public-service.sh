#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${SILVER_BASE_URL:-}}"

if [ -z "$BASE_URL" ] && [ -n "${SITE_DOMAIN:-}" ]; then
  BASE_URL="https://${SITE_DOMAIN}"
fi

BASE_URL="${BASE_URL:-https://silver.loopmateapp.com}"
BASE_URL="${BASE_URL%/}"
API_BASE_URL="${SILVER_API_BASE_URL:-$BASE_URL}"
API_BASE_URL="${API_BASE_URL%/}"
SMOKE_REGION="${SILVER_SMOKE_REGION:-강릉}"

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
    sed -n '1,80p' "$output" >&2
    exit 1
  fi

  echo "$output"
}

curl_admin_body() {
  local name="$1"
  local url="$2"
  local expected_status="$3"
  local output="$TMP_DIR/${name}.body"
  local status

  : > "$output"
  status="$(curl -sS -L \
    -H "X-Silver-Admin-Token: ${SILVER_ADMIN_TOKEN:-}" \
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
    sed -n '1,80p' "$file" >&2
    exit 1
  fi
}

assert_json() {
  local file="$1"
  local message="$2"

  python3 - "$file" "$message" <<'PY'
import json
import sys

path = sys.argv[1]
message = sys.argv[2]

try:
    with open(path, encoding="utf-8") as handle:
        json.load(handle)
except Exception as exc:
    print(f"FAIL: {message}: {exc}", file=sys.stderr)
    with open(path, encoding="utf-8", errors="replace") as handle:
        print(handle.read(800), file=sys.stderr)
    sys.exit(1)
PY
}

print_json_summary() {
  local label="$1"
  local file="$2"

  python3 - "$label" "$file" <<'PY'
import json
import sys

label = sys.argv[1]
path = sys.argv[2]

with open(path, encoding="utf-8") as handle:
    data = json.load(handle)

if isinstance(data, dict):
    keys = ", ".join(sorted(data.keys())[:8])
    print(f"PASS {label}: object keys [{keys}]")
elif isinstance(data, list):
    print(f"PASS {label}: list length {len(data)}")
else:
    print(f"PASS {label}: {type(data).__name__}")
PY
}

extract_backend_id() {
  local file="$1"

  python3 - "$file" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as handle:
    data = json.load(handle)

def walk(value):
    if isinstance(value, dict):
        backend_id = value.get("backendId")
        if isinstance(backend_id, int):
            print(backend_id)
            raise SystemExit
        item_id = value.get("id")
        if (
            isinstance(item_id, int)
            and "title" in value
            and (
                "recommendationScore" in value
                or "sourceName" in value
                or "detailPath" in value
            )
        ):
            print(item_id)
            raise SystemExit
        for child in value.values():
            walk(child)
    elif isinstance(value, list):
        for child in value:
            walk(child)

walk(data)
PY
}

require_command curl
require_command grep
require_command python3

ENCODED_REGION="$(python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$SMOKE_REGION")"

echo "Silver Smile public service smoke test"
echo "Frontend: $BASE_URL"
echo "API base: $API_BASE_URL"
echo "Region:   $SMOKE_REGION"

for path in "/" "/learning" "/tour" "/mobility" "/health" "/contest/food" "/contest/mobility"; do
  page_name="$(echo "$path" | tr '/-' '__')"
  body="$(curl_body "page_${page_name}" "${BASE_URL}${path}" 200)"
  assert_contains "$body" "root\\|Silver\\|script" "Page $path should look like app HTML"
  echo "PASS page $path"
done

education_body="$(curl_body education_map "${API_BASE_URL}/api/education-experience-map?region=${ENCODED_REGION}&perCategoryLimit=1" 200)"
assert_json "$education_body" "education map API should return JSON"
print_json_summary "education map API" "$education_body"

tour_body="$(curl_body senior_tour_map "${API_BASE_URL}/api/senior-tour-map?region=${ENCODED_REGION}&perCategoryLimit=1" 200)"
assert_json "$tour_body" "tour map API should return JSON"
print_json_summary "tour map API" "$tour_body"

mobility_body="$(curl_body mobility_map "${API_BASE_URL}/api/mobility-access-map?region=${ENCODED_REGION}&perCategoryLimit=1" 200)"
assert_json "$mobility_body" "mobility map API should return JSON"
print_json_summary "mobility map API" "$mobility_body"

health_body="$(curl_body health_map "${API_BASE_URL}/api/health-safety-map?region=${ENCODED_REGION}&perCategoryLimit=1" 200)"
assert_json "$health_body" "health map API should return JSON"
print_json_summary "health map API" "$health_body"

admin_denied="$(curl_body admin_dashboard_denied "${API_BASE_URL}/api/admin/dashboard" 403)"
assert_contains "$admin_denied" "Invalid admin token\\|Forbidden\\|403" "Admin dashboard should reject missing token"
echo "PASS admin token protection"

if [ -n "${SILVER_ADMIN_TOKEN:-}" ]; then
  admin_body="$(curl_admin_body admin_dashboard_allowed "${API_BASE_URL}/api/admin/dashboard" 200)"
  assert_json "$admin_body" "admin dashboard should return JSON with token"
  assert_contains "$admin_body" "\"visitReviewCount\"" "Admin dashboard should include visit review summary"
  echo "PASS admin dashboard summary"
else
  echo "SKIP admin dashboard token check. Set SILVER_ADMIN_TOKEN to verify protected summary fields."
fi

tour_backend_id="$(extract_backend_id "$tour_body" || true)"
if [ -n "$tour_backend_id" ]; then
  review_body="$(curl_body visit_review_overview "${API_BASE_URL}/api/life-info/items/${tour_backend_id}/visit-reviews?limit=5" 200)"
  assert_json "$review_body" "visit review overview should return JSON"
  assert_contains "$review_body" "\"reviewCount\"" "Visit review overview should include reviewCount"
  assert_contains "$review_body" "\"matchLevel\"" "Visit review overview should include matchLevel"
  echo "PASS visit review read API for item $tour_backend_id"
else
  echo "SKIP visit review read API. No backendId found in tour map response."
fi

echo "Public service smoke test complete."
