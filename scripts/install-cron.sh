#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${SILVER_APP_DIR:-$HOME/apps/silverProject}"
LOG_DIR="${SILVER_LOG_DIR:-$APP_DIR/logs}"
BACKUP_RETENTION_DAYS="${SILVER_BACKUP_RETENTION_DAYS:-30}"
VOLUME_BACKUP_RETENTION_DAYS="${SILVER_VOLUME_BACKUP_RETENTION_DAYS:-30}"
REGIONS="${SILVER_REFRESH_REGIONS:-강릉}"
CORE_LIMIT="${SILVER_CORE_REFRESH_LIMIT:-20}"
GANGWON_CORE_REFRESH_ENABLED="${SILVER_GANGWON_CORE_REFRESH_ENABLED:-1}"
GANGWON_REGIONS="${SILVER_GANGWON_REFRESH_REGIONS:-강원}"
GANGWON_CORE_LIMIT="${SILVER_GANGWON_CORE_REFRESH_LIMIT:-50}"
FOOD_LIMIT="${SILVER_FOOD_REFRESH_LIMIT:-20}"
MFDS_PAUSE_SECONDS="${SILVER_MFDS_PAUSE_SECONDS:-30}"

mkdir -p "$LOG_DIR"

if ! [[ "$CORE_LIMIT" =~ ^[1-9][0-9]*$ ]]; then
  echo "SILVER_CORE_REFRESH_LIMIT must be a positive integer: $CORE_LIMIT" >&2
  exit 1
fi

if ! [[ "$GANGWON_CORE_LIMIT" =~ ^[1-9][0-9]*$ ]]; then
  echo "SILVER_GANGWON_CORE_REFRESH_LIMIT must be a positive integer: $GANGWON_CORE_LIMIT" >&2
  exit 1
fi

case "$GANGWON_CORE_REFRESH_ENABLED" in
  0|1)
    ;;
  *)
    echo "SILVER_GANGWON_CORE_REFRESH_ENABLED must be 0 or 1: $GANGWON_CORE_REFRESH_ENABLED" >&2
    exit 1
    ;;
esac

if [ "$GANGWON_CORE_REFRESH_ENABLED" = "1" ] && [ -z "${GANGWON_REGIONS//[[:space:],]/}" ]; then
  echo "SILVER_GANGWON_REFRESH_REGIONS must include at least one region when enabled." >&2
  exit 1
fi

tmp_cron="$(mktemp)"
crontab -l 2>/dev/null \
  | awk '
      /^# BEGIN Silver Project cron$/ { skip = 1; next }
      /^# END Silver Project cron$/ { skip = 0; next }
      skip { next }
      /silverProject\/deploy\/scripts\/refresh-data\.sh/ { next }
      /silverProject\/deploy\/scripts\/backup-postgres\.sh/ { next }
      /silverProject\/deploy\/scripts\/backup-volumes\.sh/ { next }
      /\.\/scripts\/refresh-data\.sh/ { next }
      /\.\/scripts\/backup-postgres\.sh/ { next }
      /\.\/scripts\/backup-volumes\.sh/ { next }
      { print }
    ' \
  > "$tmp_cron" || true

cat >> "$tmp_cron" <<CRON
# BEGIN Silver Project cron
# Silver Project: daily PostgreSQL backup before public data refresh
30 2 * * * cd $APP_DIR/deploy && SILVER_BACKUP_RETENTION_DAYS=$BACKUP_RETENTION_DAYS ./scripts/backup-postgres.sh >> $LOG_DIR/backup-postgres.log 2>&1

# Silver Project: daily Docker volume backup for uploads and collector data
40 2 * * * cd $APP_DIR/deploy && SILVER_VOLUME_BACKUP_RETENTION_DAYS=$VOLUME_BACKUP_RETENTION_DAYS ./scripts/backup-volumes.sh >> $LOG_DIR/backup-volumes.log 2>&1

# Silver Project: daily public data refresh
0 3 * * * cd $APP_DIR/deploy && SILVER_REFRESH_MODE=core SILVER_REFRESH_REGIONS="$REGIONS" SILVER_REFRESH_LIMIT=$CORE_LIMIT ./scripts/refresh-data.sh >> $LOG_DIR/refresh-core.log 2>&1

CRON

if [ "$GANGWON_CORE_REFRESH_ENABLED" = "1" ]; then
  cat >> "$tmp_cron" <<CRON
# Silver Project: weekly Gangwon-wide core refresh for maps that present Gangwon as a region
0 5 * * 0 cd $APP_DIR/deploy && SILVER_REFRESH_MODE=core SILVER_REFRESH_REGIONS="$GANGWON_REGIONS" SILVER_REFRESH_LIMIT=$GANGWON_CORE_LIMIT ./scripts/refresh-data.sh >> $LOG_DIR/refresh-gangwon.log 2>&1

CRON
fi

cat >> "$tmp_cron" <<CRON
# Silver Project: weekly FoodSafetyKorea refresh, kept separate because MFDS can throttle shared keys
30 4 * * 1 cd $APP_DIR/deploy && SILVER_REFRESH_MODE=food SILVER_REFRESH_REGIONS="$REGIONS" SILVER_REFRESH_LIMIT=$FOOD_LIMIT SILVER_MFDS_PAUSE_SECONDS=$MFDS_PAUSE_SECONDS ./scripts/refresh-data.sh >> $LOG_DIR/refresh-food.log 2>&1
# END Silver Project cron
CRON

crontab "$tmp_cron"
rm -f "$tmp_cron"

echo "Installed Silver Project cron jobs. gangwonCoreRefresh=$GANGWON_CORE_REFRESH_ENABLED"
crontab -l | grep -E "backup-postgres\\.sh|backup-volumes\\.sh|refresh-data\\.sh" || true
