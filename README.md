# Silver Project Deploy

Lightsail 운영 배포용 파일 모음입니다.

이 저장소에는 secret을 넣지 않습니다. 실제 운영 값은 서버에서 `.env.prod`로만 관리합니다.

## Files

- `compose.prod.yaml`: frontend, backend, PostgreSQL, Caddy, collector job 구성
- `Caddyfile`: HTTPS와 `/api` reverse proxy 설정
- `.env.prod.example`: 운영 환경변수 템플릿
- `docs/lightsail-deployment.md`: Lightsail step-by-step runbook
- `docs/deployment.md`: 배포 전략 요약

## Quick Start On Server

```bash
cp .env.prod.example .env.prod
nano .env.prod
docker compose --env-file .env.prod -f compose.prod.yaml build
docker compose --env-file .env.prod -f compose.prod.yaml up -d postgres backend frontend caddy
```

데이터 수집과 import는 `docs/lightsail-deployment.md` 순서를 따릅니다.

## Repositories

- collector: `git@github.com:dgdev22/silver-data-collector.git`
- backend: `git@github.com:dgdev22/silver-backend.git`
- frontend: `git@github.com:dgdev22/silver-frontend.git`
