# Silver Project Deploy

Lightsail 운영 배포용 파일 모음입니다.

이 저장소에는 secret을 넣지 않습니다. 실제 운영 값은 서버에서 `.env.prod`로만 관리합니다.

## Files

- `compose.prod.yaml`: frontend, memory frontend, backend, PostgreSQL, Caddy, collector job 구성
- `Caddyfile`: HTTPS와 `/api` reverse proxy 설정
- `.env.prod.example`: 운영 환경변수 템플릿
- `silver-memory-app/`: `https://도메인/memory/`로 노출되는 Silver Memory 정적 프론트
- `docs/lightsail-deployment.md`: Lightsail step-by-step runbook
- `docs/deployment.md`: 배포 전략 요약
- `docs/backup-restore.md`: PostgreSQL 백업/복원 runbook

## Quick Start On Server

```bash
cp .env.prod.example .env.prod
nano .env.prod
docker compose --env-file .env.prod -f compose.prod.yaml build
docker compose --env-file .env.prod -f compose.prod.yaml up -d postgres backend frontend memory-frontend caddy
```

데이터 수집과 import는 `docs/lightsail-deployment.md` 순서를 따릅니다.

Silver Memory 운영 백오피스는 `/memory/#/admin`에서 열고, `.env.prod`의 `SILVER_ADMIN_TOKEN` 값으로 접근합니다.

`scripts/refresh-data.sh`는 cron, 수동 workflow, 서버 직접 실행이 겹쳐도 한 번에 하나만 실행되도록 `/tmp/silver-data-refresh.lock`을 사용합니다. 필요하면 `SILVER_REFRESH_LOCK_FILE`, `SILVER_REFRESH_LOCK_WAIT_SECONDS`로 조정합니다.

데이터 갱신 전에는 기본적으로 collector 이미지를 다시 빌드합니다. GitHub Actions나 서버에서 최신 collector 코드를 pull한 뒤 stale image로 수집하는 일을 막기 위한 동작이며, 긴급하게 기존 이미지를 그대로 써야 할 때만 `SILVER_REFRESH_BUILD_COLLECTOR=0`으로 끕니다.

데이터 갱신 mode는 `education`, `core`, `food`, `full`만 허용합니다. `SILVER_REFRESH_LIMIT`은 양의 정수, `SILVER_MFDS_PAUSE_SECONDS`는 0 이상의 정수여야 합니다. GitHub Actions 수동 갱신 workflow도 같은 입력 검증 후 shell-safe quoting으로 서버에 값을 전달합니다.

`scripts/backup-postgres.sh`는 운영 PostgreSQL을 custom-format dump로 백업합니다. `scripts/backup-volumes.sh`는 Memory 업로드와 collector 데이터 Docker volume을 `tar.gz`로 백업합니다. `scripts/install-cron.sh`를 실행하면 매일 02:30 KST DB 백업, 02:40 KST volume 백업 cron도 함께 설치됩니다. 복원 절차는 `docs/backup-restore.md`를 따릅니다.

`scripts/check-backups.sh`는 최신 DB/volume 백업이 존재하고 기본 48시간 이내인지 확인합니다. `scripts/smoke-after-deploy.sh`도 이 검사를 함께 실행하며, 첫 백업 전 환경에서는 `SILVER_SKIP_BACKUP_CHECK=1`로 건너뜁니다.

운영 서버의 현재 커밋, 컨테이너, 데이터 freshness, 최근 collector run, 백업, 디스크 상태를 읽기 전용으로 빠르게 보려면 아래 명령을 실행합니다. secret 값은 출력하지 않습니다.

```bash
./scripts/ops-status.sh
```

배포 후 읽기 전용 스모크 테스트까지 자동으로 돌리려면 서버에서 아래처럼 실행합니다.

```bash
SILVER_DEPLOY_SMOKE=1 ./scripts/deploy-app.sh
```

`scripts/deploy-app.sh`는 컨테이너를 빌드하거나 재기동하기 전에 `scripts/validate-deploy-config.sh`를 실행합니다. 긴급 복구처럼 검증을 의도적으로 건너뛰어야 할 때만 `SILVER_SKIP_DEPLOY_VALIDATE=1`을 사용합니다.

배포 파일을 수정한 뒤에는 먼저 shell script 문법과 Docker Compose 설정을 점검합니다. Docker Compose가 없는 로컬 환경에서는 compose 검사를 자동으로 건너뜁니다.

```bash
./scripts/validate-deploy-config.sh
```

## Smoke Tests

Silver Smile 공공데이터 서비스 읽기 전용 점검. 주요 페이지, 페이지별 JS/CSS/favicon 정적 자산, `/course` 하루 안심 코스 정적 메타, 공모전 URL별 정적 메타, frontend/API base의 `/internal` 공개 차단, `robots.txt`, `sitemap.xml`, 지도 API, 관리자 보호 상태, 관광 후기 읽기 API를 확인합니다. 공모전 URL은 `/contest/education`, `/contest/tour`, `/contest/mobility`, `/contest/food`를 포함합니다.

```bash
./scripts/smoke-public-service.sh https://silver.loopmateapp.com
```

기본적으로 각 지도 API의 `totalCount`와 `layers`가 1건 이상인지 확인합니다. 빈 데이터 환경을 의도적으로 확인할 때는 `SILVER_SMOKE_MIN_TOTAL_COUNT=0`, `SILVER_SMOKE_MIN_LAYER_COUNT=0`으로 낮출 수 있습니다.

데이터 최신도는 기본적으로 `fresh,aging` 상태만 허용하고, `ageHours`가 168시간을 넘으면 실패합니다. 장기 보관 데이터나 빈 샘플 환경을 의도적으로 점검할 때는 `SILVER_SMOKE_ALLOWED_FRESHNESS_STATUSES`, `SILVER_SMOKE_MAX_DATA_AGE_HOURS`로 기준을 조정합니다.

GitHub Actions의 `Public service smoke` workflow는 매일 06:30 KST에 같은 읽기 전용 점검을 실행합니다. 별도 secret 없이 공개 URL만 확인하므로 운영 키를 노출하지 않습니다. 필요하면 repository variables로 `SILVER_BASE_URL`, `SILVER_API_BASE_URL`, `SILVER_SMOKE_REGION`, `SILVER_SMOKE_ALLOWED_FRESHNESS_STATUSES`, `SILVER_SMOKE_MAX_DATA_AGE_HOURS`, `SILVER_SMOKE_MIN_TOTAL_COUNT`, `SILVER_SMOKE_MIN_LAYER_COUNT`를 조정할 수 있고, `SILVER_PUBLIC_SMOKE_ENABLED=false`로 일시 중지할 수 있습니다.

GitHub Actions의 `Operations smoke` workflow는 매일 08:00 KST에 Lightsail 서버에서 `scripts/smoke-after-deploy.sh`를 실행합니다. 공개/API/Memory/백업 신선도까지 확인하며, `SILVER_OPERATIONS_SMOKE_ENABLED=false` repository variable로 일시 중지할 수 있습니다. 배포/운영 smoke workflow는 성공·실패와 무관하게 마지막에 `ops-status.sh`를 실행해 진단 스냅샷을 Actions 로그에 남깁니다.

운영 서버에서 `.env.prod`의 `SILVER_ADMIN_TOKEN`을 환경변수로 함께 넘기면 보호된 관리자 요약 필드까지 확인합니다.

```bash
SILVER_ADMIN_TOKEN='관리자_토큰' \
./scripts/smoke-public-service.sh https://silver.loopmateapp.com
```

배포 직후 public service와 Memory 읽기 전용 점검을 함께 실행하는 래퍼도 있습니다. `.env.prod`에서 도메인과 관리자 토큰을 안전하게 읽어 사용하며 토큰 값은 출력하지 않습니다.

```bash
./scripts/smoke-after-deploy.sh
```

Silver Memory 배포 후 읽기 전용 점검. 프론트 HTML, JS/CSS 정적 자산, 공개 API, `announcements` 응답 계약, 유족 보호 상태를 확인합니다.

```bash
./scripts/smoke-memory.sh https://silver.loopmateapp.com
```

배포 직후 일시적인 재기동 구간을 견디도록 읽기 요청은 기본 6회 재시도합니다. 필요하면 `SILVER_MEMORY_SMOKE_RETRIES`, `SILVER_MEMORY_SMOKE_RETRY_SLEEP_SECONDS`로 조정합니다.

유족 코드와 함께 이미지 업로드 경로까지 점검하려면 tiny PNG를 업로드한 뒤 `/uploads/memory/...` 다운로드 응답을 확인합니다. 이 점검은 운영 DB/볼륨에 작은 파일을 남기므로 필요할 때만 수동으로 실행합니다.

```bash
SILVER_MEMORY_SMOKE_UPLOAD=1 \
MEMORY_EDITOR_TOKEN='유족_코드' \
./scripts/smoke-memory.sh https://silver.loopmateapp.com
```

유족 코드까지 포함한 쓰기 점검은 운영 DB에 점검용 방명록, 타임라인, 기억 카드, 공지사항을 만든 뒤 바로 숨김 또는 삭제 처리합니다.

```bash
SILVER_MEMORY_SMOKE_WRITE=1 \
MEMORY_EDITOR_TOKEN='유족_코드' \
./scripts/smoke-memory.sh https://silver.loopmateapp.com
```

## Repositories

- collector: `git@github.com:dgdev22/silver-data-collector.git`
- backend: `git@github.com:dgdev22/silver-backend.git`
- frontend: `git@github.com:dgdev22/silver-frontend.git`
- memory frontend: 현재 deploy repo에 포함. 동접자와 매출이 생기기 전까지는 같은 Lightsail/Compose 안에서 모놀리식으로 운영한다.
