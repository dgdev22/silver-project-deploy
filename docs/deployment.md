# Deployment

Last updated: 2026-05-24

이 문서는 세 프로젝트를 공공데이터 공모전 제출용 데모와 이후 운영 서비스로 배포하는 기준을 정리한다.

## Recommended Shape

공모전 제출용으로는 너무 복잡한 Kubernetes보다 아래 구조가 적합하다.

```text
사용자 브라우저
  -> HTTPS 도메인
  -> reverse proxy / platform ingress
      /      -> silver-tour-app 정적 frontend
      /memory -> silver-memory-app 정적 frontend
      /api   -> backend
      /uploads -> backend upload files
  -> PostgreSQL

scheduled collector job
  -> public data APIs
  -> processed JSON
  -> backend import API or shared artifact
  -> PostgreSQL
```

핵심 원칙:

- frontend와 backend는 가능하면 같은 origin으로 노출한다. 그러면 CORS 문제를 피할 수 있다.
- `/api`는 backend로 라우팅하고, 나머지는 frontend SPA로 보낸다.
- `Silver Memory`는 우선 `/memory/` 하위 경로로 노출한다. 실제 브랜드가 굳어지면 `memory.loopmateapp.com` 같은 별도 도메인으로 분리한다.
- collector는 상시 서버가 아니라 scheduled job 또는 수동 batch로 둔다.
- 인증키와 DB 비밀번호는 이미지에 넣지 않고 secret/env로만 주입한다.
- 운영 배포 전에는 `/internal/**` API 보호가 필요하다.

## Deployment Options

### Option A. Contest Demo

가장 빠른 제출용 구조다.

- 작은 VM 또는 컨테이너 호스팅 1곳
- PostgreSQL 1개
- backend container 1개
- frontend static container 또는 플랫폼 static hosting 1개
- reverse proxy에서 `/api`만 backend로 전달
- collector는 로컬 또는 배포 서버에서 수동 실행 후 import

장점:

- 구조가 단순하다.
- 시연 URL 하나를 만들기 쉽다.
- 공모전 제출서에서 Docker 기반 재현성을 설명하기 좋다.

주의:

- collector 자동 스케줄링은 제출 후 고도화해도 된다.
- `/internal/import/processed-json`는 공개 인터넷에 그대로 두면 안 된다.

### Option B. Small Production

운영까지 염두에 둔 구조다.

- frontend: 정적 호스팅 또는 nginx
- backend: container app
- DB: managed PostgreSQL
- collector: scheduled container job
- processed/raw data: object storage 또는 collector job artifact
- secrets: platform secret manager
- monitoring: backend health check, collector run log, DB backup

장점:

- 데이터 갱신과 서비스 운영을 분리할 수 있다.
- DB 백업과 장애 대응이 쉬워진다.
- 이후 여러 지역으로 확장하기 좋다.

## Images

```bash
docker build -t silver-backend ./backend
docker build -t silver-tour-app ./silver-tour-app
docker build -t silver-memory-app ./silver-memory-app
docker build -t silver-data-collector ./silver-data-collector
```

frontend와 backend를 다른 origin으로 배포할 때는 build arg로 API base URL을 넣는다.

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://api.example.com \
  -t silver-tour-app \
  ./silver-tour-app
```

다만 현재 backend에 CORS 설정이 없으므로, 공모전 데모는 같은 origin reverse proxy 방식을 우선 권장한다.

## Runtime Environment

backend:

```dotenv
DB_URL=jdbc:postgresql://postgres:5432/silver
DB_USERNAME=silver
DB_PASSWORD=change_me
SPRING_DOCKER_COMPOSE_ENABLED=false
JAVA_OPTS=
```

frontend:

```dotenv
VITE_API_BASE_URL=
```

collector:

```dotenv
DATA_GO_KR_SERVICE_KEY=
DISASTER_SAFETY_SERVICE_KEY=
MFDS_SERVICE_KEY=
CLIENT_SIDE_REGION_SCAN_PAGES=10
SENIOR_JOBS_PROJECT_YEAR=
```

## Local Container Smoke Test

PostgreSQL은 루트 스크립트를 우선 사용한다.

```bash
./scripts/postgres.sh start
```

backend 컨테이너는 같은 PostgreSQL에 연결한다.

```bash
docker run --rm \
  -p 8080:8080 \
  -e DB_URL=jdbc:postgresql://host.docker.internal:5432/silver \
  -e DB_USERNAME=silver \
  -e DB_PASSWORD=silver \
  -e SPRING_DOCKER_COMPOSE_ENABLED=false \
  silver-backend
```

frontend 컨테이너:

```bash
docker run --rm -p 5173:80 silver-tour-app
```

Memory frontend 컨테이너:

```bash
docker run --rm -p 5175:80 silver-memory-app
```

collector 컨테이너는 인증키를 환경변수로 받고 `/app/data`를 볼륨으로 연결한다.

```bash
docker run --rm \
  -e DATA_GO_KR_SERVICE_KEY \
  -e DISASTER_SAFETY_SERVICE_KEY \
  -e MFDS_SERVICE_KEY \
  -v "$PWD/silver-data-collector/data:/app/data" \
  silver-data-collector \
  silver-data-collector collect-bus-stops --region 강릉 --limit 5
```

## Data Refresh Flow

공모전 제출용 초기 데이터:

```bash
cd silver-data-collector
uv run silver-data-collector collect-core --region 강릉 --limit 5
uv run silver-data-collector collect-education-experience --region 강릉 --limit 5
uv run silver-data-collector collect-parking-lots --region 강릉 --limit 5
uv run silver-data-collector collect-bus-stops --region 강릉 --limit 5
uv run silver-data-collector collect-food-safety --limit 5
uv run silver-data-collector score-education-experience
uv run silver-data-collector score-contest-menus
```

backend import:

```bash
cd backend
curl -X POST "http://localhost:8080/internal/import/processed-json?directory=../silver-data-collector/data/processed"
```

확인:

```bash
curl "http://localhost:8080/api/education-experience-map?region=강릉&perCategoryLimit=5"
curl "http://localhost:8080/api/senior-tour-map?region=강릉&perCategoryLimit=5"
curl "http://localhost:8080/api/mobility-access-map?region=강릉&perCategoryLimit=5"
curl "http://localhost:8080/api/health-safety-map?region=강릉&perCategoryLimit=5"
```

운영에서는 이 흐름을 scheduled collector job으로 바꾼다.

## Public Launch Checklist

- [ ] HTTPS 도메인 준비
- [ ] `/api` reverse proxy 설정
- [ ] PostgreSQL 비밀번호와 API key를 secret/env로 주입
- [ ] `/internal/**` 보호
- [ ] 초기 processed JSON import
- [ ] `/mobility`, `/health`, `/tour`, `/learning` 브라우저 확인
- [ ] `/memory/`, `/memory/#/m/kim-youngsu` 브라우저 확인
- [ ] Memory 방명록 작성, 유족 코드 편집, 대표사진 업로드 확인
- [ ] `npm run build`, `./gradlew test`, `uv run pytest` 통과
- [ ] 공공데이터 원천과 갱신일 표시
- [ ] 데이터 부족/낮은 confidence 안내 문구 표시
- [ ] DB 백업 또는 export 절차 준비

## Current Caveats

- `silver-tour-app/nginx.conf`는 SPA fallback만 제공한다. 같은 origin 배포를 하려면 플랫폼 ingress, 별도 reverse proxy, 또는 nginx proxy 설정이 추가로 필요하다.
- backend CORS 설정은 아직 없다. 다른 도메인 frontend를 쓰려면 CORS 설정을 추가하거나 same-origin proxy를 써야 한다.
- 약국정보서비스는 현재 403으로 승인/권한 재확인이 필요하다.
- 식품접객업정보(I1200)는 active sample 수집은 되지만 강릉 지역화 전략이 아직 약하다.
- MapLibre bundle size 경고가 있다. 제출용 데모에는 문제 없지만 운영 최적화 때 lazy loading을 검토한다.
