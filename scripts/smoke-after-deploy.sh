#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${SILVER_APP_DIR:-$HOME/apps/silverProject}"
DEPLOY_DIR="${SILVER_DEPLOY_DIR:-$APP_DIR/deploy}"
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

if [ ! -d "$DEPLOY_DIR" ]; then
  echo "Missing deploy directory: $DEPLOY_DIR" >&2
  exit 1
fi

SITE_DOMAIN="${SITE_DOMAIN:-$(read_env_value SITE_DOMAIN)}"
BASE_URL="${SILVER_BASE_URL:-}"

if [ -z "$BASE_URL" ] && [ -n "$SITE_DOMAIN" ]; then
  BASE_URL="https://${SITE_DOMAIN}"
fi

BASE_URL="${BASE_URL:-https://silver.loopmateapp.com}"
BASE_URL="${BASE_URL%/}"

SILVER_ADMIN_TOKEN="${SILVER_ADMIN_TOKEN:-$(read_env_value SILVER_ADMIN_TOKEN)}"
export SILVER_ADMIN_TOKEN

echo "Running post-deploy smoke tests for $BASE_URL"

"$DEPLOY_DIR/scripts/smoke-public-service.sh" "$BASE_URL"

if [ "${SILVER_SKIP_INTERNAL_SMOKE:-0}" = "1" ]; then
  echo "SKIP internal smoke test. SILVER_SKIP_INTERNAL_SMOKE=1"
else
  "$DEPLOY_DIR/scripts/smoke-internal-service.sh"
fi

if [ "${SILVER_SKIP_MEMORY_SMOKE:-0}" = "1" ]; then
  echo "SKIP memory smoke test. SILVER_SKIP_MEMORY_SMOKE=1"
else
  "$DEPLOY_DIR/scripts/smoke-memory.sh" "$BASE_URL"
fi

if [ "${SILVER_SKIP_BACKUP_CHECK:-0}" = "1" ]; then
  echo "SKIP backup freshness check. SILVER_SKIP_BACKUP_CHECK=1"
else
  "$DEPLOY_DIR/scripts/check-backups.sh"
fi

echo "Post-deploy smoke tests complete."
