# Backup And Restore

Silver Smile 운영 서버의 PostgreSQL 데이터를 백업하고 복원하는 절차다.

이 문서에는 secret 값을 쓰지 않는다. 운영 값은 서버의 `.env.prod`와 Docker Compose 환경변수에서만 읽는다.

## Scope

현재 스크립트가 백업하는 대상:

- PostgreSQL DB: 공공데이터 import 결과, 수집 이력, Silver Memory DB 데이터
- `memory-uploads` Docker volume: Silver Memory 대표 사진/업로드 이미지
- `collector-data` Docker volume: collector raw/processed JSON

현재 스크립트가 백업하지 않는 대상:

- Caddy 인증서/cache volume

Caddy volume은 인증서 재발급이 가능하므로 기본 백업 대상에서 제외한다.

## Manual PostgreSQL Backup

서버에서 실행한다.

```bash
cd ~/apps/silverProject/deploy
chmod +x scripts/*.sh
./scripts/backup-postgres.sh
```

기본 저장 위치:

```text
~/apps/silverProject/backups/postgres/silver-postgres-YYYYMMDDTHHMMSSZ.dump
```

조정 가능한 환경변수:

| Variable | Default | Meaning |
|---|---|---|
| `SILVER_APP_DIR` | `$HOME/apps/silverProject` | 운영 앱 루트 |
| `ENV_FILE` | `.env.prod` | Docker Compose env file |
| `COMPOSE_FILE` | `compose.prod.yaml` | Docker Compose file |
| `SILVER_BACKUP_DIR` | `$SILVER_APP_DIR/backups/postgres` | 백업 파일 저장 위치 |
| `SILVER_BACKUP_RETENTION_DAYS` | `30` | 이 일수보다 오래된 dump 삭제. `0`이면 삭제 안 함 |
| `SILVER_BACKUP_LOCK_FILE` | `/tmp/silver-postgres-backup.lock` | 동시 실행 방지 lock |

## Manual Volume Backup

서버에서 실행한다.

```bash
cd ~/apps/silverProject/deploy
chmod +x scripts/*.sh
./scripts/backup-volumes.sh
```

기본 저장 위치:

```text
~/apps/silverProject/backups/volumes/silver-volume-memory-uploads-YYYYMMDDTHHMMSSZ.tar.gz
~/apps/silverProject/backups/volumes/silver-volume-collector-data-YYYYMMDDTHHMMSSZ.tar.gz
```

조정 가능한 환경변수:

| Variable | Default | Meaning |
|---|---|---|
| `SILVER_VOLUME_BACKUP_DIR` | `$SILVER_APP_DIR/backups/volumes` | volume 백업 파일 저장 위치 |
| `SILVER_VOLUME_BACKUP_RETENTION_DAYS` | `30` | 이 일수보다 오래된 archive 삭제. `0`이면 삭제 안 함 |
| `SILVER_VOLUME_BACKUP_LOCK_FILE` | `/tmp/silver-volume-backup.lock` | 동시 실행 방지 lock |
| `SILVER_VOLUME_BACKUP_IMAGE` | `postgres:17-alpine` | tar 실행에 사용할 로컬 Docker image |
| `SILVER_VOLUME_BACKUP_VOLUMES` | `memory-uploads collector-data` | 백업할 Compose logical volume 목록 |

## Scheduled Backup

`scripts/install-cron.sh`는 데이터 갱신 cron과 함께 매일 02:30 KST PostgreSQL 백업, 02:40 KST volume 백업 cron을 설치한다.

```bash
cd ~/apps/silverProject/deploy
./scripts/install-cron.sh
```

cron 로그 기본 위치:

```text
~/apps/silverProject/logs/backup-postgres.log
~/apps/silverProject/logs/backup-volumes.log
```

## Restore Drill

복원은 운영 DB를 덮어쓰는 작업이다. 실제 운영에서 실행하기 전에 최신 백업 파일을 별도 위치에 보관하고, 가능한 경우 새 서버나 임시 DB에서 먼저 검증한다.

예시 절차:

```bash
cd ~/apps/silverProject
BACKUP_FILE="$HOME/apps/silverProject/backups/postgres/silver-postgres-YYYYMMDDTHHMMSSZ.dump"

docker compose --env-file .env.prod -f compose.prod.yaml stop backend

docker compose --env-file .env.prod -f compose.prod.yaml exec -T postgres \
  sh -c 'dropdb -U "${POSTGRES_USER:-silver}" "${POSTGRES_DB:-silver}"'

docker compose --env-file .env.prod -f compose.prod.yaml exec -T postgres \
  sh -c 'createdb -U "${POSTGRES_USER:-silver}" "${POSTGRES_DB:-silver}"'

docker compose --env-file .env.prod -f compose.prod.yaml exec -T postgres \
  sh -c 'pg_restore -U "${POSTGRES_USER:-silver}" -d "${POSTGRES_DB:-silver}" --no-owner --no-acl' \
  < "$BACKUP_FILE"

docker compose --env-file .env.prod -f compose.prod.yaml up -d backend
deploy/scripts/smoke-after-deploy.sh
```

volume 복원 예시:

```bash
cd ~/apps/silverProject
UPLOADS_ARCHIVE="$HOME/apps/silverProject/backups/volumes/silver-volume-memory-uploads-YYYYMMDDTHHMMSSZ.tar.gz"
UPLOADS_VOLUME="$(docker volume ls -q --filter label=com.docker.compose.volume=memory-uploads | head -1)"

docker run --rm \
  -v "$UPLOADS_VOLUME:/target" \
  -v "$(dirname "$UPLOADS_ARCHIVE"):/backup:ro" \
  postgres:17-alpine \
  sh -c "cd /target && tar -xzf /backup/$(basename "$UPLOADS_ARCHIVE")"
```

## Operating Notes

- 백업 파일은 DB 내용을 포함하므로 public repo나 채팅에 올리지 않는다.
- 운영 서버 밖으로 복사할 때는 암호화된 저장소 또는 제한된 접근 권한을 사용한다.
- 복원 후에는 `/api/data-freshness`, Memory 공개 조회, 관리자 보호 상태를 smoke test로 확인한다.
- DB와 업로드 volume은 가까운 시간대의 백업 쌍을 함께 복원한다.
