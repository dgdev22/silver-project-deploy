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
SMOKE_RETRIES="${SILVER_SMOKE_RETRIES:-6}"
SMOKE_RETRY_SLEEP_SECONDS="${SILVER_SMOKE_RETRY_SLEEP_SECONDS:-2}"
SMOKE_MIN_TOTAL_COUNT="${SILVER_SMOKE_MIN_TOTAL_COUNT:-1}"
SMOKE_MIN_LAYER_COUNT="${SILVER_SMOKE_MIN_LAYER_COUNT:-1}"
SMOKE_ALLOWED_FRESHNESS_STATUSES="${SILVER_SMOKE_ALLOWED_FRESHNESS_STATUSES:-fresh,aging}"
SMOKE_MAX_DATA_AGE_HOURS="${SILVER_SMOKE_MAX_DATA_AGE_HOURS:-168}"

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
  for attempt in $(seq 1 "$SMOKE_RETRIES"); do
    status="$(curl -sS -L -o "$output" -w "%{http_code}" "$url" || printf '000')"

    if [ "$status" = "$expected_status" ]; then
      echo "$output"
      return
    fi

    if [ "$attempt" -lt "$SMOKE_RETRIES" ]; then
      sleep "$SMOKE_RETRY_SLEEP_SECONDS"
    fi
  done

  echo "FAIL $name: expected HTTP $expected_status but got $status" >&2
  echo "URL: $url" >&2
  sed -n '1,80p' "$output" >&2
  exit 1
}

curl_admin_body() {
  local name="$1"
  local url="$2"
  local expected_status="$3"
  local output="$TMP_DIR/${name}.body"
  local status
  local attempt

  : > "$output"
  for attempt in $(seq 1 "$SMOKE_RETRIES"); do
    status="$(curl -sS -L \
      -H "X-Silver-Admin-Token: ${SILVER_ADMIN_TOKEN:-}" \
      -o "$output" \
      -w "%{http_code}" \
      "$url" || printf '000')"

    if [ "$status" = "$expected_status" ]; then
      echo "$output"
      return
    fi

    if [ "$attempt" -lt "$SMOKE_RETRIES" ]; then
      sleep "$SMOKE_RETRY_SLEEP_SECONDS"
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
    sed -n '1,80p' "$file" >&2
    exit 1
  fi
}

assert_contest_static_meta() {
  local label="$1"
  local file="$2"
  local expected_title="$3"

  assert_contains "$file" "<title>${expected_title}</title>" "$label should include static contest title before JavaScript runs"
  assert_contains "$file" "property=\"og:title\"" "$label should include Open Graph title"
  assert_contains "$file" "$expected_title" "$label should include contest title text"
  echo "PASS $label static metadata"
}

assert_internal_route_protected() {
  local label="$1"
  local base_url="$2"

  curl_body "internal_${label}_collector_runs_denied" "${base_url}/internal/collector-runs" 404 >/dev/null
  echo "PASS $label internal route protection"
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

assert_total_count_at_least() {
  local label="$1"
  local file="$2"
  local min_count="$3"

  python3 - "$label" "$file" "$min_count" <<'PY'
import json
import sys

label = sys.argv[1]
path = sys.argv[2]
min_count = int(sys.argv[3])

with open(path, encoding="utf-8") as handle:
    data = json.load(handle)

if not isinstance(data, dict):
    print(f"FAIL {label}: expected object response with totalCount", file=sys.stderr)
    sys.exit(1)

total_count = data.get("totalCount")
if not isinstance(total_count, int):
    print(f"FAIL {label}: totalCount should be an integer, got {total_count!r}", file=sys.stderr)
    sys.exit(1)

if total_count < min_count:
    print(
        f"FAIL {label}: totalCount {total_count} is below minimum {min_count}",
        file=sys.stderr,
    )
    sys.exit(1)

print(f"PASS {label}: totalCount {total_count} >= {min_count}")
PY
}

assert_sitemap_routes() {
  local file="$1"
  shift

  python3 - "$file" "$@" <<'PY'
import sys
import xml.etree.ElementTree as ET
from urllib.parse import urlparse

path = sys.argv[1]
required_routes = sys.argv[2:]

try:
    root = ET.parse(path).getroot()
except Exception as exc:
    print(f"FAIL sitemap: invalid XML: {exc}", file=sys.stderr)
    sys.exit(1)

routes = set()
for element in root.iter():
    if not element.tag.endswith("loc") or not element.text:
        continue
    parsed = urlparse(element.text.strip())
    routes.add(parsed.path or "/")

missing_routes = [route for route in required_routes if route not in routes]
if missing_routes:
    print(
        "FAIL sitemap: missing routes " + ", ".join(missing_routes),
        file=sys.stderr,
    )
    sys.exit(1)

print(f"PASS sitemap: routes {len(required_routes)} required, {len(routes)} listed")
PY
}

assert_map_contract() {
  local label="$1"
  local file="$2"
  local min_layer_count="$3"

  python3 - "$label" "$file" "$min_layer_count" <<'PY'
import json
import sys

label = sys.argv[1]
path = sys.argv[2]
min_layer_count = int(sys.argv[3])

with open(path, encoding="utf-8") as handle:
    data = json.load(handle)

if not isinstance(data, dict):
    print(f"FAIL {label}: expected object response", file=sys.stderr)
    sys.exit(1)

layers = data.get("layers")
if not isinstance(layers, list):
    print(f"FAIL {label}: layers should be a list", file=sys.stderr)
    sys.exit(1)

if len(layers) < min_layer_count:
    print(
        f"FAIL {label}: layer count {len(layers)} is below minimum {min_layer_count}",
        file=sys.stderr,
    )
    sys.exit(1)

for index, layer in enumerate(layers):
    if not isinstance(layer, dict):
        print(f"FAIL {label}: layer #{index + 1} should be an object", file=sys.stderr)
        sys.exit(1)
    layer_items = None
    for item_key in ("services", "items", "places"):
        if item_key in layer:
            layer_items = layer.get(item_key)
            break
    if not isinstance(layer_items, list):
        print(
            f"FAIL {label}: layer #{index + 1} should include a services/items list",
            file=sys.stderr,
        )
        sys.exit(1)
    layer_count = layer.get("count")
    if layer_count is not None and (
        not isinstance(layer_count, int) or layer_count < 0
    ):
        print(
            f"FAIL {label}: layer #{index + 1} count should be a non-negative integer",
            file=sys.stderr,
        )
        sys.exit(1)

mappable_count = data.get("mappableCount")
if not isinstance(mappable_count, int) or mappable_count < 0:
    print(f"FAIL {label}: mappableCount should be a non-negative integer", file=sys.stderr)
    sys.exit(1)

score = data.get("score")
if not isinstance(score, dict):
    print(f"FAIL {label}: score should be an object", file=sys.stderr)
    sys.exit(1)

score_value = None
score_key = None
preferred_score_keys = (
    "totalScore",
    "laterLifePlaceScore",
    "seniorTourScore",
    "mobilityAccessScore",
    "healthSafetyScore",
    "educationExperienceScore",
)
for candidate_key in preferred_score_keys:
    candidate_value = score.get(candidate_key)
    if isinstance(candidate_value, (int, float)):
        score_key = candidate_key
        score_value = candidate_value
        break

if score_value is None:
    for candidate_key, candidate_value in score.items():
        if (
            candidate_key != "confidenceScore"
            and candidate_key.endswith("Score")
            and isinstance(candidate_value, (int, float))
        ):
            score_key = candidate_key
            score_value = candidate_value
            break

if not isinstance(score_value, (int, float)) or not 0 <= score_value <= 100:
    print(
        f"FAIL {label}: score should include a 0-100 main score field",
        file=sys.stderr,
    )
    sys.exit(1)

grade = score.get("grade")
if grade is not None and not isinstance(grade, str):
    print(f"FAIL {label}: score.grade should be a string when present", file=sys.stderr)
    sys.exit(1)

print(
    f"PASS {label}: layers {len(layers)}, mappableCount {mappable_count}, {score_key} {round(score_value)}"
)
PY
}

assert_data_freshness_contract() {
  local file="$1"
  local min_active_count="$2"
  local allowed_statuses="$3"
  local max_age_hours="$4"

  python3 - "$file" "$min_active_count" "$allowed_statuses" "$max_age_hours" <<'PY'
import json
import sys

path = sys.argv[1]
min_active_count = int(sys.argv[2])
allowed_statuses = {
    status.strip()
    for status in sys.argv[3].split(",")
    if status.strip()
}
if not allowed_statuses:
    print(
        "FAIL data freshness API: allowed freshness statuses should not be empty",
        file=sys.stderr,
    )
    sys.exit(1)
max_age_hours = None
if sys.argv[4].strip():
    try:
        max_age_hours = int(sys.argv[4])
    except ValueError:
        print(
            f"FAIL data freshness API: max age should be an integer hour value, got {sys.argv[4]!r}",
            file=sys.stderr,
        )
        sys.exit(1)

with open(path, encoding="utf-8") as handle:
    data = json.load(handle)

if not isinstance(data, dict):
    print("FAIL data freshness API: expected object response", file=sys.stderr)
    sys.exit(1)

status = data.get("status")
if status not in allowed_statuses:
    print(
        f"FAIL data freshness API: status {status!r} is not allowed. Allowed statuses: {sorted(allowed_statuses)}",
        file=sys.stderr,
    )
    sys.exit(1)

age_hours = data.get("ageHours")
if max_age_hours is not None:
    if not isinstance(age_hours, int):
        print(
            f"FAIL data freshness API: ageHours should be an integer when max age is enforced, got {age_hours!r}",
            file=sys.stderr,
        )
        sys.exit(1)
    if age_hours > max_age_hours:
        print(
            f"FAIL data freshness API: data age {age_hours}h is above maximum {max_age_hours}h",
            file=sys.stderr,
        )
        sys.exit(1)

active_item_count = data.get("activeItemCount")
if not isinstance(active_item_count, int) or active_item_count < min_active_count:
    print(
        f"FAIL data freshness API: activeItemCount {active_item_count!r} is below minimum {min_active_count}",
        file=sys.stderr,
    )
    sys.exit(1)

mappable_item_count = data.get("mappableItemCount")
if (
    not isinstance(mappable_item_count, int)
    or mappable_item_count < 0
    or mappable_item_count > active_item_count
):
    print(
        "FAIL data freshness API: mappableItemCount should be between 0 and activeItemCount",
        file=sys.stderr,
    )
    sys.exit(1)

type_summaries = data.get("typeSummaries")
if not isinstance(type_summaries, list) or not type_summaries:
    print("FAIL data freshness API: typeSummaries should be a non-empty list", file=sys.stderr)
    sys.exit(1)

for index, summary in enumerate(type_summaries):
    if not isinstance(summary, dict):
        print(f"FAIL data freshness API: type summary #{index + 1} should be an object", file=sys.stderr)
        sys.exit(1)
    if not isinstance(summary.get("type"), str) or not summary["type"].strip():
        print(f"FAIL data freshness API: type summary #{index + 1} should include type", file=sys.stderr)
        sys.exit(1)
    if not isinstance(summary.get("activeItemCount"), int) or summary["activeItemCount"] < 0:
        print(
            f"FAIL data freshness API: type summary #{index + 1} activeItemCount should be non-negative",
            file=sys.stderr,
        )
        sys.exit(1)

recent_runs = data.get("recentCollectorRuns")
if not isinstance(recent_runs, list):
    print("FAIL data freshness API: recentCollectorRuns should be a list", file=sys.stderr)
    sys.exit(1)

print(
    f"PASS data freshness API: status {status}, ageHours {age_hours}, activeItemCount {active_item_count}, types {len(type_summaries)}, recentRuns {len(recent_runs)}"
)
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
echo "Min total: $SMOKE_MIN_TOTAL_COUNT"
echo "Min layers: $SMOKE_MIN_LAYER_COUNT"
echo "Allowed freshness statuses: $SMOKE_ALLOWED_FRESHNESS_STATUSES"
echo "Max data age hours: $SMOKE_MAX_DATA_AGE_HOURS"

for path in "/" "/learning" "/tour" "/mobility" "/health" "/contest/education" "/contest/food" "/contest/mobility"; do
  page_name="$(echo "$path" | tr '/-' '__')"
  body="$(curl_body "page_${page_name}" "${BASE_URL}${path}" 200)"
  assert_contains "$body" "root\\|Silver\\|script" "Page $path should look like app HTML"
  echo "PASS page $path"
done

assert_internal_route_protected "frontend" "$BASE_URL"

if [ "$API_BASE_URL" != "$BASE_URL" ]; then
  assert_internal_route_protected "api" "$API_BASE_URL"
fi

contest_education_body="$(curl_body contest_education_static_meta "${BASE_URL}/contest/education" 200)"
assert_contest_static_meta \
  "contest education page" \
  "$contest_education_body" \
  "Silver Smile 공모전 제출용 | 2026 교육 공공데이터 활용대회"

contest_food_body="$(curl_body contest_food_static_meta "${BASE_URL}/contest/food" 200)"
assert_contest_static_meta \
  "contest food page" \
  "$contest_food_body" \
  "Silver Smile 공모전 제출용 | 2026 식의약 공공데이터·AI 분석·활용 경진대회"

contest_mobility_body="$(curl_body contest_mobility_static_meta "${BASE_URL}/contest/mobility" 200)"
assert_contest_static_meta \
  "contest mobility page" \
  "$contest_mobility_body" \
  "Silver Smile 공모전 제출용 | 2026 국토·교통 데이터 활용 경진대회"

robots_body="$(curl_body robots_txt "${BASE_URL}/robots.txt" 200)"
assert_contains "$robots_body" "Sitemap:.*sitemap.xml" "robots.txt should point to sitemap.xml"
echo "PASS robots.txt"

sitemap_body="$(curl_body sitemap_xml "${BASE_URL}/sitemap.xml" 200)"
assert_sitemap_routes \
  "$sitemap_body" \
  "/" \
  "/learning" \
  "/tour" \
  "/mobility" \
  "/health" \
  "/contest/education" \
  "/contest/food" \
  "/contest/mobility"

education_body="$(curl_body education_map "${API_BASE_URL}/api/education-experience-map?region=${ENCODED_REGION}&perCategoryLimit=1" 200)"
assert_json "$education_body" "education map API should return JSON"
print_json_summary "education map API" "$education_body"
assert_total_count_at_least "education map API" "$education_body" "$SMOKE_MIN_TOTAL_COUNT"
assert_map_contract "education map API" "$education_body" "$SMOKE_MIN_LAYER_COUNT"

tour_body="$(curl_body senior_tour_map "${API_BASE_URL}/api/senior-tour-map?region=${ENCODED_REGION}&perCategoryLimit=1" 200)"
assert_json "$tour_body" "tour map API should return JSON"
print_json_summary "tour map API" "$tour_body"
assert_total_count_at_least "tour map API" "$tour_body" "$SMOKE_MIN_TOTAL_COUNT"
assert_map_contract "tour map API" "$tour_body" "$SMOKE_MIN_LAYER_COUNT"

mobility_body="$(curl_body mobility_map "${API_BASE_URL}/api/mobility-access-map?region=${ENCODED_REGION}&perCategoryLimit=1" 200)"
assert_json "$mobility_body" "mobility map API should return JSON"
print_json_summary "mobility map API" "$mobility_body"
assert_total_count_at_least "mobility map API" "$mobility_body" "$SMOKE_MIN_TOTAL_COUNT"
assert_map_contract "mobility map API" "$mobility_body" "$SMOKE_MIN_LAYER_COUNT"

health_body="$(curl_body health_map "${API_BASE_URL}/api/health-safety-map?region=${ENCODED_REGION}&perCategoryLimit=1" 200)"
assert_json "$health_body" "health map API should return JSON"
print_json_summary "health map API" "$health_body"
assert_total_count_at_least "health map API" "$health_body" "$SMOKE_MIN_TOTAL_COUNT"
assert_map_contract "health map API" "$health_body" "$SMOKE_MIN_LAYER_COUNT"

data_freshness_body="$(curl_body data_freshness "${API_BASE_URL}/api/data-freshness" 200)"
assert_json "$data_freshness_body" "data freshness API should return JSON"
print_json_summary "data freshness API" "$data_freshness_body"
assert_data_freshness_contract \
  "$data_freshness_body" \
  "$SMOKE_MIN_TOTAL_COUNT" \
  "$SMOKE_ALLOWED_FRESHNESS_STATUSES" \
  "$SMOKE_MAX_DATA_AGE_HOURS"

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
