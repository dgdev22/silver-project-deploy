#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${SILVER_APP_DIR:-$HOME/apps/silverProject}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.prod.yaml}"
ENV_FILE="${ENV_FILE:-.env.prod}"
BACKUP_DIR="${SILVER_VOLUME_BACKUP_DIR:-$APP_DIR/backups/volumes}"
RETENTION_DAYS="${SILVER_VOLUME_BACKUP_RETENTION_DAYS:-30}"
LOCK_FILE="${SILVER_VOLUME_BACKUP_LOCK_FILE:-/tmp/silver-volume-backup.lock}"
BACKUP_IMAGE="${SILVER_VOLUME_BACKUP_IMAGE:-postgres:17-alpine}"
VOLUMES="${SILVER_VOLUME_BACKUP_VOLUMES:-memory-uploads collector-data}"

if ! [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
  echo "SILVER_VOLUME_BACKUP_RETENTION_DAYS must be a non-negative integer." >&2
  exit 1
fi

cd "$APP_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $APP_DIR/$ENV_FILE" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

timestamp="$(date -u +"%Y%m%dT%H%M%SZ")"

resolve_volume_name() {
  local logical_name="$1"
  local matches
  local candidate

  matches="$(docker volume ls -q --filter "label=com.docker.compose.volume=$logical_name")"
  if [ "$(printf '%s\n' "$matches" | sed '/^$/d' | wc -l | tr -d ' ')" = "1" ]; then
    printf '%s\n' "$matches"
    return
  fi

  for candidate in \
    "${COMPOSE_PROJECT_NAME:-}_${logical_name}" \
    "$(basename "$APP_DIR")_${logical_name}" \
    "$(basename "$PWD")_${logical_name}" \
    "$logical_name"
  do
    if [ "$candidate" != "_${logical_name}" ] && docker volume inspect "$candidate" >/dev/null 2>&1; then
      printf '%s\n' "$candidate"
      return
    fi
  done

  echo "Could not find Docker volume for logical name: $logical_name" >&2
  return 1
}

backup_volume() {
  local logical_name="$1"
  local volume_name
  local archive_file
  local tmp_archive
  local tmp_basename

  if ! [[ "$logical_name" =~ ^[A-Za-z0-9_.-]+$ ]]; then
    echo "Invalid volume name: $logical_name" >&2
    exit 1
  fi

  volume_name="$(resolve_volume_name "$logical_name")"
  archive_file="$BACKUP_DIR/silver-volume-$logical_name-$timestamp.tar.gz"
  tmp_archive="$archive_file.tmp"
  tmp_basename="$(basename "$tmp_archive")"

  rm -f "$tmp_archive"

  docker run --rm \
    -v "$volume_name:/source:ro" \
    -v "$BACKUP_DIR:/backup" \
    "$BACKUP_IMAGE" \
    sh -c "cd /source && tar -czf /backup/$tmp_basename ."

  mv "$tmp_archive" "$archive_file"
  chmod 600 "$archive_file"
  echo "Volume backup created: $archive_file ($volume_name)"
}

run_backup() {
  local logical_name

  for logical_name in $VOLUMES; do
    backup_volume "$logical_name"
  done

  if [ "$RETENTION_DAYS" -gt 0 ]; then
    find "$BACKUP_DIR" \
      -type f \
      -name "silver-volume-*.tar.gz" \
      -mtime "+$RETENTION_DAYS" \
      -delete
  fi
}

if command -v flock >/dev/null 2>&1; then
  exec 9>"$LOCK_FILE"
  flock -w 300 9
  run_backup
else
  run_backup
fi
