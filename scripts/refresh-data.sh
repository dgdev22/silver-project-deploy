#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${SILVER_APP_DIR:-$HOME/apps/silverProject}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.prod.yaml}"
ENV_FILE="${ENV_FILE:-.env.prod}"
REGION="${SILVER_REFRESH_REGION:-강릉}"
LIMIT="${SILVER_REFRESH_LIMIT:-5}"

cd "$APP_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $APP_DIR/$ENV_FILE" >&2
  exit 1
fi

run_collector() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" run --rm collector "$@"
}

run_collector silver-data-collector collect-core --region "$REGION" --limit "$LIMIT"
run_collector silver-data-collector collect-education-experience --region "$REGION" --limit "$LIMIT"
run_collector silver-data-collector collect-parking-lots --region "$REGION" --limit "$LIMIT"
run_collector silver-data-collector collect-bus-stops --region "$REGION" --limit "$LIMIT"
run_collector silver-data-collector collect-food-safety --limit "$LIMIT"
run_collector silver-data-collector score-education-experience
run_collector silver-data-collector score-contest-menus

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T backend \
  wget -qO- --post-data='' \
  "http://localhost:8080/internal/import/processed-json?directory=/data/processed"

echo "Data refresh complete."
