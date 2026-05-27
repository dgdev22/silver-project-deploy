#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${SILVER_APP_DIR:-$HOME/apps/silverProject}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.prod.yaml}"
ENV_FILE="${ENV_FILE:-.env.prod}"
REGIONS="${SILVER_REFRESH_REGIONS:-${SILVER_REFRESH_REGION:-강릉}}"
LIMIT="${SILVER_REFRESH_LIMIT:-5}"
MODE="${SILVER_REFRESH_MODE:-full}"
MFDS_PAUSE_SECONDS="${SILVER_MFDS_PAUSE_SECONDS:-30}"

cd "$APP_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $APP_DIR/$ENV_FILE" >&2
  exit 1
fi

run_collector() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" run --rm collector "$@"
}

first_region() {
  local region="${REGIONS%%,*}"
  region="${region#"${region%%[![:space:]]*}"}"
  region="${region%"${region##*[![:space:]]}"}"
  echo "$region"
}

refresh_region() {
  local region="$1"

  echo "Refreshing region: $region"
  run_collector silver-data-collector collect-core --region "$region" --limit "$LIMIT"
  run_collector silver-data-collector collect-education-experience --region "$region" --limit "$LIMIT"
  run_collector silver-data-collector collect-parking-lots --region "$region" --limit "$LIMIT"
  run_collector silver-data-collector collect-bus-stops --region "$region" --limit "$LIMIT"
}

refresh_food_safety() {
  local region
  region="$(first_region)"

  echo "Refreshing FoodSafetyKorea data for restaurants in: $region"
  run_collector silver-data-collector collect-food-safety --region "$region" --limit "$LIMIT" --pause-seconds "$MFDS_PAUSE_SECONDS"
}

case "$MODE" in
  core)
    IFS="," read -ra region_list <<< "$REGIONS"
    for region in "${region_list[@]}"; do
      region="${region#"${region%%[![:space:]]*}"}"
      region="${region%"${region##*[![:space:]]}"}"
      [ -n "$region" ] && refresh_region "$region"
    done
    run_collector silver-data-collector score-education-experience
    run_collector silver-data-collector score-contest-menus
    ;;
  food)
    refresh_food_safety
    run_collector silver-data-collector score-contest-menus
    ;;
  full)
    IFS="," read -ra region_list <<< "$REGIONS"
    for region in "${region_list[@]}"; do
      region="${region#"${region%%[![:space:]]*}"}"
      region="${region%"${region##*[![:space:]]}"}"
      [ -n "$region" ] && refresh_region "$region"
    done
    refresh_food_safety
    run_collector silver-data-collector score-education-experience
    run_collector silver-data-collector score-contest-menus
    ;;
  *)
    echo "Unknown SILVER_REFRESH_MODE: $MODE. Use core, food, or full." >&2
    exit 1
    ;;
esac

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T backend \
  wget -qO- --post-data='' \
  "http://localhost:8080/internal/import/processed-json?directory=/data/processed"

echo "Data refresh complete. mode=$MODE regions=$REGIONS limit=$LIMIT"
