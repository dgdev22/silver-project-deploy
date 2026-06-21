#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REFRESH_SCRIPT="$SCRIPT_DIR/refresh-data.sh"
TMP_DIR="$(mktemp -d)"
FAKE_BIN="$TMP_DIR/bin"
APP_DIR="$TMP_DIR/app"
DOCKER_LOG="$TMP_DIR/docker.log"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

mkdir -p "$FAKE_BIN" "$APP_DIR"
touch "$APP_DIR/.env.prod"

cat > "$FAKE_BIN/docker" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$SILVER_DOCKER_LOG"
EOF
chmod +x "$FAKE_BIN/docker"

run_refresh() {
  local mode="$1"
  local verify_package="${2:-1}"
  local verify_region_coverage="${3:-1}"

  : > "$DOCKER_LOG"
  PATH="$FAKE_BIN:$PATH" \
    SILVER_APP_DIR="$APP_DIR" \
    SILVER_DOCKER_LOG="$DOCKER_LOG" \
    SILVER_REFRESH_LOCKED=1 \
    SILVER_REFRESH_BUILD_COLLECTOR=0 \
    SILVER_REFRESH_MODE="$mode" \
    SILVER_REFRESH_REGIONS="강릉" \
    SILVER_REFRESH_LIMIT=1 \
    SILVER_MFDS_PAUSE_SECONDS=0 \
    SILVER_REFRESH_VERIFY_CONTEST_PACKAGE="$verify_package" \
    SILVER_REFRESH_VERIFY_CONTEST_REGION_COVERAGE="$verify_region_coverage" \
    SILVER_REFRESH_MAX_FILE_AGE_HOURS=48 \
    bash "$REFRESH_SCRIPT" >/dev/null
}

assert_contains() {
  local expected="$1"

  if ! grep -Fqx "$expected" "$DOCKER_LOG"; then
    echo "Expected Docker command was not run: $expected" >&2
    cat "$DOCKER_LOG" >&2
    exit 1
  fi
}

assert_not_contains() {
  local unexpected="$1"

  if grep -Fq "$unexpected" "$DOCKER_LOG"; then
    echo "Unexpected Docker command was run: $unexpected" >&2
    cat "$DOCKER_LOG" >&2
    exit 1
  fi
}

line_number() {
  grep -Fn "$1" "$DOCKER_LOG" | head -1 | cut -d: -f1
}

run_refresh core
core_gate='compose --env-file .env.prod -f compose.prod.yaml run --rm collector silver-data-collector check-contest-package --no-food-safety --max-file-age-hours 48 --json'
core_region_gate='compose --env-file .env.prod -f compose.prod.yaml run --rm collector silver-data-collector check-contest-region --region 강릉 --json'
backend_import='compose --env-file .env.prod -f compose.prod.yaml exec -T backend sh -c wget -qO- --header="X-Silver-Admin-Token: ${SILVER_ADMIN_TOKEN}" --post-data="" "http://localhost:8080/internal/import/processed-json?directory=/data/processed"'
assert_contains "$core_gate"
assert_contains "$core_region_gate"
assert_contains "$backend_import"

if [ "$(line_number "$core_gate")" -ge "$(line_number "$backend_import")" ]; then
  echo "Contest package gate must run before backend import." >&2
  cat "$DOCKER_LOG" >&2
  exit 1
fi

if [ "$(line_number "$core_region_gate")" -ge "$(line_number "$backend_import")" ]; then
  echo "Contest region coverage gate must run before backend import." >&2
  cat "$DOCKER_LOG" >&2
  exit 1
fi

run_refresh full
full_gate='compose --env-file .env.prod -f compose.prod.yaml run --rm collector silver-data-collector check-contest-package --max-file-age-hours 48 --json'
assert_contains "$full_gate"
assert_contains "$core_region_gate"
assert_not_contains 'check-contest-package --no-food-safety'

run_refresh food
assert_not_contains 'check-contest-package'
assert_contains "$backend_import"

run_refresh core 0 0
assert_not_contains 'check-contest-package'
assert_not_contains 'check-contest-region'
assert_contains "$backend_import"

if PATH="$FAKE_BIN:$PATH" \
  SILVER_APP_DIR="$APP_DIR" \
  SILVER_DOCKER_LOG="$DOCKER_LOG" \
  SILVER_REFRESH_LOCKED=1 \
  SILVER_REFRESH_VERIFY_CONTEST_PACKAGE=invalid \
  bash "$REFRESH_SCRIPT" >/dev/null 2>&1; then
  echo "Invalid contest package verification setting must fail." >&2
  exit 1
fi

if PATH="$FAKE_BIN:$PATH" \
  SILVER_APP_DIR="$APP_DIR" \
  SILVER_DOCKER_LOG="$DOCKER_LOG" \
  SILVER_REFRESH_LOCKED=1 \
  SILVER_REFRESH_VERIFY_CONTEST_REGION_COVERAGE=invalid \
  bash "$REFRESH_SCRIPT" >/dev/null 2>&1; then
  echo "Invalid contest region coverage verification setting must fail." >&2
  exit 1
fi

echo "refresh-data contest package and region coverage gates smoke passed."
