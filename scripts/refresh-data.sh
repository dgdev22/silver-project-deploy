#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${SILVER_APP_DIR:-$HOME/apps/silverProject}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.prod.yaml}"
ENV_FILE="${ENV_FILE:-.env.prod}"
REGIONS="${SILVER_REFRESH_REGIONS:-${SILVER_REFRESH_REGION:-강릉}}"
LIMIT="${SILVER_REFRESH_LIMIT:-5}"
MODE="${SILVER_REFRESH_MODE:-full}"
MFDS_PAUSE_SECONDS="${SILVER_MFDS_PAUSE_SECONDS:-30}"
LOCK_FILE="${SILVER_REFRESH_LOCK_FILE:-/tmp/silver-data-refresh.lock}"
LOCK_WAIT_SECONDS="${SILVER_REFRESH_LOCK_WAIT_SECONDS:-900}"

validate_positive_integer() {
  local label="$1"
  local value="$2"

  if ! [[ "$value" =~ ^[1-9][0-9]*$ ]]; then
    echo "$label must be a positive integer: $value" >&2
    exit 1
  fi
}

validate_non_negative_integer() {
  local label="$1"
  local value="$2"

  if ! [[ "$value" =~ ^[0-9]+$ ]]; then
    echo "$label must be a non-negative integer: $value" >&2
    exit 1
  fi
}

validate_inputs() {
  case "$MODE" in
    education|core|food|full)
      ;;
    *)
      echo "Unknown SILVER_REFRESH_MODE: $MODE. Use education, core, food, or full." >&2
      exit 1
      ;;
  esac

  if [ -z "${REGIONS//[[:space:],]/}" ]; then
    echo "SILVER_REFRESH_REGIONS must include at least one region." >&2
    exit 1
  fi

  if [[ "$REGIONS" == *$'\n'* || "$REGIONS" == *$'\r'* ]]; then
    echo "SILVER_REFRESH_REGIONS must not include line breaks." >&2
    exit 1
  fi

  validate_positive_integer "SILVER_REFRESH_LIMIT" "$LIMIT"
  validate_non_negative_integer "SILVER_MFDS_PAUSE_SECONDS" "$MFDS_PAUSE_SECONDS"
  validate_positive_integer "SILVER_REFRESH_LOCK_WAIT_SECONDS" "$LOCK_WAIT_SECONDS"
}

validate_inputs

if [ "${SILVER_REFRESH_LOCKED:-0}" != "1" ]; then
  if command -v flock >/dev/null 2>&1; then
    export SILVER_REFRESH_LOCKED=1
    exec flock -w "$LOCK_WAIT_SECONDS" "$LOCK_FILE" "$0" "$@"
  fi

  echo "WARN flock is not available; continuing without refresh lock." >&2
fi

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

refresh_education() {
  IFS="," read -ra region_list <<< "$REGIONS"
  for region in "${region_list[@]}"; do
    region="${region#"${region%%[![:space:]]*}"}"
    region="${region%"${region##*[![:space:]]}"}"
    if [ -n "$region" ]; then
      echo "Refreshing education data for region: $region"
      run_collector silver-data-collector collect-education-experience --region "$region" --limit "$LIMIT"
    fi
  done
  run_collector silver-data-collector score-education-experience
}

case "$MODE" in
  education)
    refresh_education
    ;;
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
esac

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T backend \
  wget -qO- --post-data='' \
  "http://localhost:8080/internal/import/processed-json?directory=/data/processed"

echo "Data refresh complete. mode=$MODE regions=$REGIONS limit=$LIMIT"
