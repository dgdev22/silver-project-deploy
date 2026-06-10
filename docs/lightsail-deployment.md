# Lightsail Deployment Runbook

Last updated: 2026-05-25

이 문서는 공공데이터 공모전 제출과 실제 운영 시작을 위한 AWS Lightsail 배포 절차다.

2026-06-04 현재 `Silver Memory`도 같은 서버에서 함께 배포한다.

- Silver Smile: `https://도메인/`
- Silver Memory: `https://도메인/memory/`
- Silver Memory API와 업로드 파일은 기존 backend의 `/api/memory/**`, `/uploads/memory/**`를 사용한다.

## 0. 미리 정할 것

필수:

- AWS 계정
- Lightsail region: 한국 사용자가 주 대상이면 `ap-northeast-2` 또는 가까운 리전
- instance size: 처음에는 4GB RAM 권장
- 도메인: 제출 신뢰도를 위해 권장
- GitHub repository:
  - `silver-data-collector`
  - `silver-backend`
  - `silver-tour-app`
  - `silver-project-deploy` (`silver-memory-app` 정적 프론트를 포함)
- 운영 secret:
  - `DATA_GO_KR_SERVICE_KEY`
  - `DISASTER_SAFETY_SERVICE_KEY`
  - `MFDS_SERVICE_KEY`
  - PostgreSQL password

프론트 저장소 주의:

- 현재 로컬 `silver-tour-app`은 `git@github.com:dgdev22/silver-frontend.git`를 origin으로 사용한다.
- GitHub에서 해당 repository를 먼저 만들고 push해야 서버에서 clone할 수 있다.

## 1. Lightsail instance 생성

1. AWS Lightsail 콘솔로 이동한다.
2. Create instance를 선택한다.
3. Platform은 Linux/Unix, blueprint는 Ubuntu LTS를 선택한다.
4. plan은 처음에는 4GB RAM급을 권장한다.
5. instance name은 예를 들어 `silver-prod-1`로 둔다.
6. 생성 후 SSH 접속이 되는지 확인한다.

## 2. Static IP 연결

Lightsail 기본 public IP는 instance stop/start 후 바뀔 수 있으므로 static IP를 붙인다.

1. Lightsail 콘솔의 Networking으로 이동한다.
2. Create static IP를 선택한다.
3. `silver-prod-1` instance에 attach한다.
4. static IP 값을 기록한다.

## 3. Domain 연결

도메인이 있으면 DNS에 A record를 추가한다.

```text
Type: A
Name: silver 또는 @
Value: Lightsail static IP
TTL: 300
```

예:

```text
silver.example.com -> 12.34.56.78
```

도메인이 아직 없어도 IP로 테스트는 가능하지만, HTTPS와 제출 신뢰도를 생각하면 도메인을 권장한다.

## 4. Firewall 설정

Lightsail networking/firewall에서 아래만 연다.

| Port | Protocol | Source | Purpose |
|---:|---|---|---|
| 22 | TCP | 내 IP 권장 | SSH |
| 80 | TCP | Anywhere | HTTP/HTTPS 발급 |
| 443 | TCP | Anywhere | HTTPS |

PostgreSQL `5432`, backend `8080`은 public으로 열지 않는다.

## 5. 서버 초기 세팅

SSH 접속 후:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y ca-certificates curl git ufw htop
```

Docker 설치:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
```

SSH를 다시 접속한 뒤 확인:

```bash
docker version
docker compose version
```

## 6. 코드 배치

서버에서 작업 디렉터리를 만든다.

```bash
mkdir -p ~/apps/silverProject
cd ~/apps/silverProject
```

repository를 clone한다.

```bash
git clone git@github.com:dgdev22/silver-data-collector.git
git clone git@github.com:dgdev22/silver-backend.git backend
git clone git@github.com:dgdev22/silver-frontend.git silver-tour-app
git clone git@github.com:dgdev22/silver-project-deploy.git deploy
```

deploy repo의 배포 파일을 운영 루트에 둔다.

```bash
cp deploy/compose.prod.yaml compose.prod.yaml
cp deploy/Caddyfile Caddyfile
cp -R deploy/silver-memory-app silver-memory-app
```

`.env.prod`는 운영 루트에 직접 만들고 Git에 올리지 않는다.

## 7. 운영 환경변수 작성

```bash
cp .env.prod.example .env.prod
nano .env.prod
```

필수로 바꿀 값:

```dotenv
SITE_DOMAIN=silver.example.com
ACME_EMAIL=you@example.com
POSTGRES_PASSWORD=긴_랜덤_문자열
SILVER_ADMIN_TOKEN=긴_관리자_토큰
DATA_GO_KR_SERVICE_KEY=...
DISASTER_SAFETY_SERVICE_KEY=...
MFDS_SERVICE_KEY=...
```

`.env.prod`는 절대 Git에 올리지 않는다.

## 8. 서비스 빌드와 실행

```bash
docker compose --env-file .env.prod -f compose.prod.yaml build
docker compose --env-file .env.prod -f compose.prod.yaml up -d postgres backend frontend memory-frontend caddy
```

상태 확인:

```bash
docker compose --env-file .env.prod -f compose.prod.yaml ps
docker compose --env-file .env.prod -f compose.prod.yaml logs -f backend
```

브라우저에서 확인:

```text
https://silver.example.com
https://silver.example.com/memory/
https://silver.example.com/api/health-safety-map?region=강릉&perCategoryLimit=2
```

## 9. 초기 데이터 수집

collector는 상시 실행하지 않고 job으로 실행한다.

```bash
docker compose --env-file .env.prod -f compose.prod.yaml run --rm collector \
  silver-data-collector collect-core --region 강릉 --limit 5

docker compose --env-file .env.prod -f compose.prod.yaml run --rm collector \
  silver-data-collector collect-education-experience --region 강릉 --limit 5

docker compose --env-file .env.prod -f compose.prod.yaml run --rm collector \
  silver-data-collector collect-parking-lots --region 강릉 --limit 5

docker compose --env-file .env.prod -f compose.prod.yaml run --rm collector \
  silver-data-collector collect-bus-stops --region 강릉 --limit 5

docker compose --env-file .env.prod -f compose.prod.yaml run --rm collector \
  silver-data-collector collect-food-safety --limit 5
```

운영에서는 deploy repo의 wrapper를 쓰면 된다.

```bash
cd ~/apps/silverProject/deploy
SILVER_REFRESH_MODE=full SILVER_REFRESH_REGIONS="강릉" SILVER_REFRESH_LIMIT=5 ./scripts/refresh-data.sh
```

강릉 외 지역을 바로 추가하려면:

```bash
cd ~/apps/silverProject/deploy
./scripts/refresh-region.sh "서울 강남구" 20
./scripts/refresh-region.sh "부산 해운대구" 20
```

여러 지역을 한 번에 돌릴 수도 있다.

```bash
cd ~/apps/silverProject/deploy
SILVER_REFRESH_MODE=core SILVER_REFRESH_REGIONS="강릉,서울 강남구,부산 해운대구" SILVER_REFRESH_LIMIT=20 ./scripts/refresh-data.sh
```

점수 생성:

```bash
docker compose --env-file .env.prod -f compose.prod.yaml run --rm collector \
  silver-data-collector score-education-experience

docker compose --env-file .env.prod -f compose.prod.yaml run --rm collector \
  silver-data-collector score-contest-menus
```

## 10. Backend import

backend container는 collector volume을 `/data`로 읽는다.

```bash
docker compose --env-file .env.prod -f compose.prod.yaml exec backend \
  wget -qO- --post-data='' \
  "http://localhost:8080/internal/import/processed-json?directory=/data/processed"
```

응답에서 `success: true`와 파일별 inserted/updated/skipped count를 확인한다.

## 11. 화면 검증

아래 URL을 직접 확인한다.

```text
https://silver.example.com/learning
https://silver.example.com/tour
https://silver.example.com/mobility
https://silver.example.com/health
https://silver.example.com/memory/
https://silver.example.com/memory/#/m/kim-youngsu
```

확인할 것:

- 지도/카드가 표시되는가
- 점수와 신뢰도가 표시되는가
- `정류장`, `주차장`, `저염레시피`, `건강기능식품` 레이어가 보이는가
- 모바일 화면에서 글자와 버튼이 겹치지 않는가
- 전화/길찾기 버튼이 보이는가
- Memory 생애 페이지, 방명록, 유족 편집 화면이 보이는가
- Memory 대표사진 업로드 후 `/uploads/memory/...` 이미지가 열리는가

서버에서 Memory 읽기 전용 smoke test:

```bash
cd ~/apps/silverProject/deploy
./scripts/smoke-memory.sh https://silver.loopmateapp.com
```

대표사진 업로드 경로까지 확인하려면 tiny PNG를 업로드한 뒤 `/uploads/memory/...` 다운로드 응답을 확인한다. 업로드 파일은 운영 볼륨에 남으므로 필요할 때만 수동 실행한다.

```bash
cd ~/apps/silverProject/deploy
SILVER_MEMORY_SMOKE_UPLOAD=1 \
MEMORY_EDITOR_TOKEN='유족_코드' \
./scripts/smoke-memory.sh https://silver.loopmateapp.com
```

유족 코드와 방명록 moderation까지 확인하려면:

```bash
cd ~/apps/silverProject/deploy
SILVER_MEMORY_SMOKE_WRITE=1 \
MEMORY_EDITOR_TOKEN='유족_코드' \
./scripts/smoke-memory.sh https://silver.loopmateapp.com
```

쓰기 점검은 점검용 방명록을 생성한 뒤 바로 `hidden`으로 바꾸고, 타임라인/기억 카드/공지사항 점검 레코드는 삭제한다.

## 12. 백업

최소 백업:

```bash
mkdir -p ~/backups
docker compose --env-file .env.prod -f compose.prod.yaml exec -T postgres \
  pg_dump -U silver silver > ~/backups/silver-$(date +%Y%m%d-%H%M).sql
```

Lightsail console에서 automatic snapshot도 켠다. 운영 초기는 매일 snapshot을 권장한다.

## 12-1. Cron 등록

운영 사이트가 정상으로 보이면 cron을 등록한다.

```bash
cd ~/apps/silverProject/deploy
SILVER_REFRESH_REGIONS="강릉" ./scripts/install-cron.sh
```

기본 cron:

- 매일 03:00 core 데이터 갱신
- 매주 월요일 04:30 식의약 데이터 갱신

지역을 추가하고 싶으면 다시 실행한다.

```bash
cd ~/apps/silverProject/deploy
SILVER_REFRESH_REGIONS="강릉,서울 강남구,부산 해운대구" ./scripts/install-cron.sh
```

로그:

```bash
tail -f ~/apps/silverProject/logs/refresh-core.log
tail -f ~/apps/silverProject/logs/refresh-food.log
```

## 13. 업데이트 배포

```bash
cd ~/apps/silverProject/silver-data-collector
git pull

cd ~/apps/silverProject/backend
git pull

cd ~/apps/silverProject/silver-tour-app
git pull

cd ~/apps/silverProject/deploy
git pull --ff-only

cd ~/apps/silverProject
cp deploy/compose.prod.yaml compose.prod.yaml
cp deploy/Caddyfile Caddyfile
cp -R deploy/silver-memory-app/. silver-memory-app/
docker compose --env-file .env.prod -f compose.prod.yaml build
docker compose --env-file .env.prod -f compose.prod.yaml up -d
```

## 14. 장애 대응

로그:

```bash
docker compose --env-file .env.prod -f compose.prod.yaml logs -f caddy
docker compose --env-file .env.prod -f compose.prod.yaml logs -f backend
docker compose --env-file .env.prod -f compose.prod.yaml logs -f postgres
```

재시작:

```bash
docker compose --env-file .env.prod -f compose.prod.yaml restart backend
docker compose --env-file .env.prod -f compose.prod.yaml restart caddy
```

디스크 확인:

```bash
df -h
docker system df
```

## 15. 제출 전 체크리스트

- [ ] 도메인 HTTPS 접속 가능
- [ ] `/learning`, `/tour`, `/mobility`, `/health` 모두 정상
- [ ] backend API 정상
- [ ] `./scripts/smoke-public-service.sh https://silver.loopmateapp.com` 통과
- [ ] 초기 데이터 import 완료
- [ ] 공공데이터 원천/한계 문서 준비
- [ ] 제출용 스크린샷 캡처
- [ ] 1~2분 시연 영상 녹화
- [ ] Lightsail snapshot 생성
