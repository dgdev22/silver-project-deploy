# Backup And Restore

Silver Smile 운영 서버의 PostgreSQL 데이터를 백업하고 복원하는 절차다.

이 문서에는 secret 값을 쓰지 않는다. 운영 값은 서버의 `.env.prod`와 Docker Compose 환경변수에서만 읽는다.

## Scope

현재 스크립트가 백업하는 대상:

- PostgreSQL DB: 공공데이터 import 결과, 수집 이력, Silver Memory DB 데이터

현재 스크립트가 백업하지 않는 대상:

- `memory-uploads` Docker volume의 업로드 이미지
- Caddy 인증서/cache volume
- collector raw/processed volume

운영 베타 전에는 업로드 이미지 volume 백업을 별도 스크립트로 추가해야 한다.

## Manual Backup

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

## Scheduled Backup

`scripts/install-cron.sh`는 데이터 갱신 cron과 함께 매일 02:30 KST PostgreSQL 백업 cron을 설치한다.

```bash
cd ~/apps/silverProject/deploy
./scripts/install-cron.sh
```

cron 로그 기본 위치:

```text
~/apps/silverProject/logs/backup-postgres.log
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

## Operating Notes

- 백업 파일은 DB 내용을 포함하므로 public repo나 채팅에 올리지 않는다.
- 운영 서버 밖으로 복사할 때는 암호화된 저장소 또는 제한된 접근 권한을 사용한다.
- 복원 후에는 `/api/data-freshness`, Memory 공개 조회, 관리자 보호 상태를 smoke test로 확인한다.
- 업로드 이미지 volume 백업이 없으면 Memory 대표 사진 등 파일 URL은 DB 복원 후에도 깨질 수 있다.
