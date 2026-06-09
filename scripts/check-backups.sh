#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${SILVER_APP_DIR:-$HOME/apps/silverProject}"
POSTGRES_BACKUP_DIR="${SILVER_BACKUP_DIR:-$APP_DIR/backups/postgres}"
VOLUME_BACKUP_DIR="${SILVER_VOLUME_BACKUP_DIR:-$APP_DIR/backups/volumes}"
POSTGRES_MAX_AGE_HOURS="${SILVER_BACKUP_MAX_AGE_HOURS:-48}"
VOLUME_MAX_AGE_HOURS="${SILVER_VOLUME_BACKUP_MAX_AGE_HOURS:-48}"
POSTGRES_MIN_BYTES="${SILVER_BACKUP_MIN_BYTES:-1024}"
VOLUME_MIN_BYTES="${SILVER_VOLUME_BACKUP_MIN_BYTES:-20}"
VOLUMES="${SILVER_VOLUME_BACKUP_VOLUMES:-memory-uploads collector-data}"

require_non_negative_integer() {
  local name="$1"
  local value="$2"

  if ! [[ "$value" =~ ^[0-9]+$ ]]; then
    echo "$name must be a non-negative integer." >&2
    exit 1
  fi
}

file_mtime_epoch() {
  local file="$1"

  if stat -c %Y "$file" >/dev/null 2>&1; then
    stat -c %Y "$file"
  else
    stat -f %m "$file"
  fi
}

file_size_bytes() {
  local file="$1"

  if stat -c %s "$file" >/dev/null 2>&1; then
    stat -c %s "$file"
  else
    stat -f %z "$file"
  fi
}

check_latest_backup() {
  local label="$1"
  local directory="$2"
  local name_pattern="$3"
  local max_age_hours="$4"
  local min_bytes="$5"
  local now_epoch="$6"
  local latest_file=""
  local latest_mtime=0
  local file
  local mtime
  local age_seconds
  local age_hours
  local size_bytes

  if [ ! -d "$directory" ]; then
    echo "FAIL $label backup: missing directory $directory" >&2
    exit 1
  fi

  while IFS= read -r -d '' file; do
    mtime="$(file_mtime_epoch "$file")"
    if [ "$mtime" -gt "$latest_mtime" ]; then
      latest_file="$file"
      latest_mtime="$mtime"
    fi
  done < <(find "$directory" -maxdepth 1 -type f -name "$name_pattern" -print0)

  if [ -z "$latest_file" ]; then
    echo "FAIL $label backup: no files matching $directory/$name_pattern" >&2
    exit 1
  fi

  size_bytes="$(file_size_bytes "$latest_file")"
  if [ "$size_bytes" -lt "$min_bytes" ]; then
    echo "FAIL $label backup: latest file is too small (${size_bytes}B < ${min_bytes}B): $latest_file" >&2
    exit 1
  fi

  age_seconds=$((now_epoch - latest_mtime))
  if [ "$age_seconds" -lt 0 ]; then
    age_seconds=0
  fi
  age_hours=$((age_seconds / 3600))

  if [ "$max_age_hours" -gt 0 ] && [ "$age_hours" -gt "$max_age_hours" ]; then
    echo "FAIL $label backup: latest file is ${age_hours}h old, above ${max_age_hours}h: $latest_file" >&2
    exit 1
  fi

  echo "PASS $label backup: $(basename "$latest_file"), ${size_bytes}B, ${age_hours}h old"
}

require_non_negative_integer SILVER_BACKUP_MAX_AGE_HOURS "$POSTGRES_MAX_AGE_HOURS"
require_non_negative_integer SILVER_VOLUME_BACKUP_MAX_AGE_HOURS "$VOLUME_MAX_AGE_HOURS"
require_non_negative_integer SILVER_BACKUP_MIN_BYTES "$POSTGRES_MIN_BYTES"
require_non_negative_integer SILVER_VOLUME_BACKUP_MIN_BYTES "$VOLUME_MIN_BYTES"

now_epoch="$(date +%s)"

echo "Checking Silver Project backups"
echo "PostgreSQL backup max age: ${POSTGRES_MAX_AGE_HOURS}h"
echo "Volume backup max age: ${VOLUME_MAX_AGE_HOURS}h"

check_latest_backup \
  "PostgreSQL" \
  "$POSTGRES_BACKUP_DIR" \
  "silver-postgres-*.dump" \
  "$POSTGRES_MAX_AGE_HOURS" \
  "$POSTGRES_MIN_BYTES" \
  "$now_epoch"

for volume in $VOLUMES; do
  if ! [[ "$volume" =~ ^[A-Za-z0-9_.-]+$ ]]; then
    echo "Invalid volume name: $volume" >&2
    exit 1
  fi

  check_latest_backup \
    "volume $volume" \
    "$VOLUME_BACKUP_DIR" \
    "silver-volume-$volume-*.tar.gz" \
    "$VOLUME_MAX_AGE_HOURS" \
    "$VOLUME_MIN_BYTES" \
    "$now_epoch"
done

echo "Backup freshness check complete."
