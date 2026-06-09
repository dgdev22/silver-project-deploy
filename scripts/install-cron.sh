#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${SILVER_APP_DIR:-$HOME/apps/silverProject}"
LOG_DIR="${SILVER_LOG_DIR:-$APP_DIR/logs}"
BACKUP_RETENTION_DAYS="${SILVER_BACKUP_RETENTION_DAYS:-30}"
REGIONS="${SILVER_REFRESH_REGIONS:-강릉}"
CORE_LIMIT="${SILVER_CORE_REFRESH_LIMIT:-20}"
FOOD_LIMIT="${SILVER_FOOD_REFRESH_LIMIT:-20}"
MFDS_PAUSE_SECONDS="${SILVER_MFDS_PAUSE_SECONDS:-30}"

mkdir -p "$LOG_DIR"

tmp_cron="$(mktemp)"
crontab -l 2>/dev/null \
  | grep -v "silverProject/deploy/scripts/refresh-data.sh" \
  | grep -v "silverProject/deploy/scripts/backup-postgres.sh" \
  > "$tmp_cron" || true

cat >> "$tmp_cron" <<CRON
# Silver Project: daily PostgreSQL backup before public data refresh
30 2 * * * cd $APP_DIR/deploy && SILVER_BACKUP_RETENTION_DAYS=$BACKUP_RETENTION_DAYS ./scripts/backup-postgres.sh >> $LOG_DIR/backup-postgres.log 2>&1

# Silver Project: daily public data refresh
0 3 * * * cd $APP_DIR/deploy && SILVER_REFRESH_MODE=core SILVER_REFRESH_REGIONS="$REGIONS" SILVER_REFRESH_LIMIT=$CORE_LIMIT ./scripts/refresh-data.sh >> $LOG_DIR/refresh-core.log 2>&1

# Silver Project: weekly FoodSafetyKorea refresh, kept separate because MFDS can throttle shared keys
30 4 * * 1 cd $APP_DIR/deploy && SILVER_REFRESH_MODE=food SILVER_REFRESH_REGIONS="$REGIONS" SILVER_REFRESH_LIMIT=$FOOD_LIMIT SILVER_MFDS_PAUSE_SECONDS=$MFDS_PAUSE_SECONDS ./scripts/refresh-data.sh >> $LOG_DIR/refresh-food.log 2>&1
CRON

crontab "$tmp_cron"
rm -f "$tmp_cron"

echo "Installed Silver Project cron jobs."
crontab -l | grep "silverProject/deploy/scripts/refresh-data.sh" || true
crontab -l | grep "silverProject/deploy/scripts/backup-postgres.sh" || true
