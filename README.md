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

## Quick Start On Server

```bash
cp .env.prod.example .env.prod
nano .env.prod
docker compose --env-file .env.prod -f compose.prod.yaml build
docker compose --env-file .env.prod -f compose.prod.yaml up -d postgres backend frontend memory-frontend caddy
```

데이터 수집과 import는 `docs/lightsail-deployment.md` 순서를 따릅니다.

Silver Memory 운영 백오피스는 `/memory/#/admin`에서 열고, `.env.prod`의 `SILVER_ADMIN_TOKEN` 값으로 접근합니다.

배포 후 읽기 전용 스모크 테스트까지 자동으로 돌리려면 서버에서 아래처럼 실행합니다.

```bash
SILVER_DEPLOY_SMOKE=1 ./scripts/deploy-app.sh
```

## Smoke Tests

Silver Smile 공공데이터 서비스 읽기 전용 점검. 주요 페이지, 공모전 URL별 정적 메타, `robots.txt`, `sitemap.xml`, 지도 API, 관리자 보호 상태, 관광 후기 읽기 API를 확인합니다.

```bash
./scripts/smoke-public-service.sh https://silver.loopmateapp.com
```

기본적으로 각 지도 API의 `totalCount`와 `layers`가 1건 이상인지 확인합니다. 빈 데이터 환경을 의도적으로 확인할 때는 `SILVER_SMOKE_MIN_TOTAL_COUNT=0`, `SILVER_SMOKE_MIN_LAYER_COUNT=0`으로 낮출 수 있습니다.

운영 서버에서 `.env.prod`의 `SILVER_ADMIN_TOKEN`을 환경변수로 함께 넘기면 보호된 관리자 요약 필드까지 확인합니다.

```bash
SILVER_ADMIN_TOKEN='관리자_토큰' \
./scripts/smoke-public-service.sh https://silver.loopmateapp.com
```

배포 직후 public service와 Memory 읽기 전용 점검을 함께 실행하는 래퍼도 있습니다. `.env.prod`에서 도메인과 관리자 토큰을 안전하게 읽어 사용하며 토큰 값은 출력하지 않습니다.

```bash
./scripts/smoke-after-deploy.sh
```

Silver Memory 배포 후 읽기 전용 점검. 프론트 HTML, 공개 API, `announcements` 응답 계약, 유족 보호 상태를 확인합니다.

```bash
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
