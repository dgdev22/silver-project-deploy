#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${SILVER_APP_DIR:-$HOME/apps/silverProject}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.prod.yaml}"
ENV_FILE="${ENV_FILE:-.env.prod}"

cd "$APP_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $APP_DIR/$ENV_FILE" >&2
  exit 1
fi

pull_repo() {
  local path="$1"

  if [ ! -d "$path/.git" ]; then
    echo "Skipping $path: not a git repository"
    return
  fi

  echo "Updating $path"
  git -C "$path" fetch origin main
  git -C "$path" reset --hard origin/main
}

pull_repo deploy

cp deploy/compose.prod.yaml "$COMPOSE_FILE"
cp deploy/Caddyfile Caddyfile

if [ -d deploy/silver-memory-app ]; then
  echo "Syncing embedded silver-memory-app"
  mkdir -p silver-memory-app
  cp -R deploy/silver-memory-app/. silver-memory-app/
fi

if [ "${SILVER_SKIP_DEPLOY_VALIDATE:-0}" != "1" ]; then
  bash deploy/scripts/validate-deploy-config.sh
fi

pull_repo silver-data-collector
pull_repo backend
pull_repo silver-tour-app

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build backend
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build frontend
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build memory-frontend
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build collector
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d postgres backend frontend memory-frontend caddy
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" restart caddy

docker image prune -f

if [ "${SILVER_DEPLOY_SMOKE:-0}" = "1" ]; then
  deploy/scripts/smoke-after-deploy.sh
fi

echo "Deployment complete."
