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

## Smoke Tests

Silver Memory 배포 후 읽기 전용 점검:

```bash
./scripts/smoke-memory.sh https://silver.loopmateapp.com
```

유족 코드까지 포함한 쓰기 점검은 운영 DB에 점검용 방명록을 만든 뒤 바로 숨김 처리합니다.

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
