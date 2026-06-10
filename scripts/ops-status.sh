#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_DEPLOY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_DIR="${SILVER_DEPLOY_DIR:-$DEFAULT_DEPLOY_DIR}"
APP_DIR="${SILVER_APP_DIR:-$(cd "$DEPLOY_DIR/.." && pwd)}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.prod.yaml}"
ENV_FILE="${ENV_FILE:-.env.prod}"
ENV_PATH="$APP_DIR/$ENV_FILE"

read_env_value() {
  local key="$1"

  if [ ! -f "$ENV_PATH" ]; then
    return
  fi

  awk -F= -v key="$key" '
    $1 == key {
      value = substr($0, length($1) + 2)
      gsub(/^["'\'']|["'\'']$/, "", value)
      print value
      exit
    }
  ' "$ENV_PATH"
}

print_section() {
  echo
  echo "== $1 =="
}

repo_summary() {
  local label="$1"
  local path="$2"

  if [ ! -d "$path/.git" ]; then
    printf '%-22s %s\n' "$label" "missing"
    return
  fi

  local branch
  local sha
  local dirty_count
  branch="$(git -C "$path" branch --show-current 2>/dev/null || true)"
  sha="$(git -C "$path" rev-parse --short HEAD 2>/dev/null || true)"
  dirty_count="$(git -C "$path" status --short 2>/dev/null | wc -l | tr -d ' ')"

  if [ "$dirty_count" = "0" ]; then
    printf '%-22s %s %s clean\n' "$label" "${branch:-detached}" "$sha"
  else
    printf '%-22s %s %s dirty:%s\n' "$label" "${branch:-detached}" "$sha" "$dirty_count"
  fi
}

summarize_data_freshness() {
  local base_url="$1"
  local output
  output="$(mktemp)"

  if ! curl -fsSL "${base_url}/api/data-freshness" -o "$output"; then
    echo "WARN data freshness API is unavailable: ${base_url}/api/data-freshness"
    rm -f "$output"
    return
  fi

  python3 - "$output" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as handle:
    data = json.load(handle)

status = data.get("status", "unknown")
age = data.get("ageHours", "unknown")
active = data.get("activeItemCount", "unknown")
mappable = data.get("mappableItemCount", "unknown")
types = data.get("typeSummaries")
type_count = len(types) if isinstance(types, list) else "unknown"
latest = data.get("latestCollectedAt") or data.get("latestSeenAt") or "unknown"

print(
    f"status={status} ageHours={age} active={active} "
    f"mappable={mappable} types={type_count} latest={latest}"
)
PY

  rm -f "$output"
}

echo "Silver Project operations status"
echo "Generated at: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "App dir:      $APP_DIR"

print_section "Repositories"
repo_summary "deploy" "$DEPLOY_DIR"
repo_summary "silver-data-collector" "$APP_DIR/silver-data-collector"
repo_summary "backend" "$APP_DIR/backend"
repo_summary "silver-tour-app" "$APP_DIR/silver-tour-app"

print_section "Docker Compose"
if command -v docker >/dev/null 2>&1 && [ -f "$APP_DIR/$COMPOSE_FILE" ] && [ -f "$ENV_PATH" ]; then
  (
    cd "$APP_DIR"
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
  )
else
  echo "SKIP docker compose status. docker, $APP_DIR/$COMPOSE_FILE, or $ENV_PATH is unavailable."
fi

print_section "Data Freshness"
SITE_DOMAIN="${SITE_DOMAIN:-$(read_env_value SITE_DOMAIN)}"
BASE_URL="${SILVER_BASE_URL:-}"
if [ -z "$BASE_URL" ] && [ -n "$SITE_DOMAIN" ]; then
  BASE_URL="https://${SITE_DOMAIN}"
fi
BASE_URL="${BASE_URL:-https://silver.loopmateapp.com}"
BASE_URL="${BASE_URL%/}"
echo "Base URL: $BASE_URL"
summarize_data_freshness "$BASE_URL"

print_section "Backups"
if [ -x "$DEPLOY_DIR/scripts/check-backups.sh" ]; then
  if ! SILVER_APP_DIR="$APP_DIR" "$DEPLOY_DIR/scripts/check-backups.sh"; then
    echo "WARN backup freshness check failed"
  fi
else
  echo "SKIP backup freshness check. Missing $DEPLOY_DIR/scripts/check-backups.sh"
fi

print_section "Disk"
df -h "$APP_DIR" 2>/dev/null || df -h .
