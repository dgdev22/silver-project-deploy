#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

for script in scripts/*.sh; do
  bash -n "$script"
done
echo "PASS shell script syntax"

if [ "${SILVER_SKIP_COMPOSE_CONFIG:-0}" = "1" ]; then
  echo "SKIP docker compose config. SILVER_SKIP_COMPOSE_CONFIG=1"
  exit 0
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "SKIP docker compose config. docker command is not available."
  exit 0
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "SKIP docker compose config. docker compose plugin is not available."
  exit 0
fi

tmp_env="$(mktemp)"
trap 'rm -f "$tmp_env"' EXIT

cat > "$tmp_env" <<'ENV'
SITE_DOMAIN=silver.example.com
ACME_EMAIL=ci@example.com

POSTGRES_DB=silver
POSTGRES_USER=silver
POSTGRES_PASSWORD=ci-postgres-password

JAVA_OPTS=-Xms256m -Xmx512m
MEMORY_UPLOAD_DIR=/app/uploads/memory
SILVER_ADMIN_TOKEN=ci-admin-token

DATA_GO_KR_SERVICE_KEY=ci-data-go-key
DISASTER_SAFETY_SERVICE_KEY=ci-disaster-key
MFDS_SERVICE_KEY=ci-mfds-key
CLIENT_SIDE_REGION_SCAN_PAGES=1
SENIOR_JOBS_PROJECT_YEAR=
ENV

compose_config_args=()
if docker compose config --help | grep -q -- "--no-path-resolution"; then
  compose_config_args+=(--no-path-resolution)
fi

docker compose --env-file "$tmp_env" -f compose.prod.yaml config "${compose_config_args[@]}" >/dev/null
echo "PASS docker compose config"
