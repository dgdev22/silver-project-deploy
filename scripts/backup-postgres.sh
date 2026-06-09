#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${SILVER_APP_DIR:-$HOME/apps/silverProject}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.prod.yaml}"
ENV_FILE="${ENV_FILE:-.env.prod}"
BACKUP_DIR="${SILVER_BACKUP_DIR:-$APP_DIR/backups/postgres}"
RETENTION_DAYS="${SILVER_BACKUP_RETENTION_DAYS:-30}"
LOCK_FILE="${SILVER_BACKUP_LOCK_FILE:-/tmp/silver-postgres-backup.lock}"

if ! [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
  echo "SILVER_BACKUP_RETENTION_DAYS must be a non-negative integer." >&2
  exit 1
fi

cd "$APP_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $APP_DIR/$ENV_FILE" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

timestamp="$(date -u +"%Y%m%dT%H%M%SZ")"
backup_file="$BACKUP_DIR/silver-postgres-$timestamp.dump"
tmp_backup="$backup_file.tmp"
trap 'rm -f "$tmp_backup"' EXIT

run_backup() {
  rm -f "$tmp_backup"

  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
    sh -c 'pg_dump -U "${POSTGRES_USER:-silver}" -d "${POSTGRES_DB:-silver}" --format=custom --no-owner --no-acl' \
    > "$tmp_backup"

  mv "$tmp_backup" "$backup_file"
  chmod 600 "$backup_file"

  if [ "$RETENTION_DAYS" -gt 0 ]; then
    find "$BACKUP_DIR" \
      -type f \
      -name "silver-postgres-*.dump" \
      -mtime "+$RETENTION_DAYS" \
      -delete
  fi

  echo "PostgreSQL backup created: $backup_file"
}

if command -v flock >/dev/null 2>&1; then
  exec 9>"$LOCK_FILE"
  flock -w 300 9
  run_backup
else
  run_backup
fi
