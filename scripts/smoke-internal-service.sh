#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${SILVER_APP_DIR:-$HOME/apps/silverProject}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.prod.yaml}"
ENV_FILE="${ENV_FILE:-.env.prod}"
BACKEND_URL="${SILVER_INTERNAL_BACKEND_URL:-http://localhost:8080}"

cd "$APP_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $APP_DIR/$ENV_FILE" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Missing required command: docker" >&2
  exit 1
fi

backend_http_status() {
  local path="$1"
  local use_admin_token="${2:-0}"
  local method="${3:-GET}"

  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T backend sh -c '
    url="${3%/}$1"
    method="$4"
    wget_args="-qSO /tmp/silver-internal-smoke.out"
    if [ "$method" = "POST" ]; then
      wget_args="$wget_args --post-data="
    fi

    if [ "$2" = "1" ]; then
      if [ -z "${SILVER_ADMIN_TOKEN:-}" ]; then
        echo "missing-token"
        exit 0
      fi
      headers="$(wget $wget_args --header "X-Silver-Admin-Token: ${SILVER_ADMIN_TOKEN}" "$url" 2>&1 >/dev/null || true)"
    else
      headers="$(wget $wget_args "$url" 2>&1 >/dev/null || true)"
    fi
    rm -f /tmp/silver-internal-smoke.out
    printf "%s\n" "$headers" | awk '"'"'/^  HTTP\// { code = $2 } END { print code }'"'"'
  ' sh "$path" "$use_admin_token" "$BACKEND_URL" "$method"
}

assert_status() {
  local label="$1"
  local actual="$2"
  local expected="$3"

  if [ "$actual" != "$expected" ]; then
    echo "FAIL $label: expected HTTP $expected but got ${actual:-empty}" >&2
    exit 1
  fi

  echo "PASS $label"
}

echo "Silver Smile internal service smoke test"

unauthorized_status="$(backend_http_status "/internal/collector-runs?limit=1" 0)"
assert_status "internal collector runs rejects missing token" "$unauthorized_status" "403"

authorized_status="$(backend_http_status "/internal/collector-runs?limit=1" 1)"
assert_status "internal collector runs accepts admin token" "$authorized_status" "200"

import_unauthorized_status="$(backend_http_status "/internal/import/processed-json?directory=/data/processed" 0 POST)"
assert_status "internal import rejects missing token before writes" "$import_unauthorized_status" "403"

echo "Internal service smoke test complete."
