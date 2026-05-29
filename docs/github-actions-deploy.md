# GitHub Actions Deploy

Last updated: 2026-05-28

main branch에 push되면 Lightsail 서버에서 최신 코드를 pull하고 Docker Compose 서비스를 다시 띄우는 자동 배포 구성이다.

## 구조

```text
GitHub main push
  -> GitHub Actions
  -> SSH to Lightsail
  -> ~/apps/silverProject/deploy/scripts/deploy-app.sh
  -> git pull/reset all repos
  -> docker compose build
  -> docker compose up -d
```

데이터 수집은 오래 걸리고 API quota를 쓰므로 자동 배포와 분리한다.

- 코드 배포: `deploy-app.sh`
- 데이터 갱신: `refresh-data.sh`

## Required GitHub Secrets

아래 secrets를 배포를 트리거할 repository에 등록한다.

| Secret | Value |
|---|---|
| `LIGHTSAIL_HOST` | `43.200.63.172` 또는 `ubuntu@43.200.63.172` |
| `LIGHTSAIL_USER` | `ubuntu`. 단, `LIGHTSAIL_HOST`에 `ubuntu@`를 포함했다면 생략 가능 |
| `LIGHTSAIL_SSH_KEY` | Lightsail 서버에 접속 가능한 private key 전체 |

GitHub repository의 Settings -> Secrets and variables -> Actions -> New repository secret에서 추가한다.

같은 화면의 Variables 탭에서 아래 repository variable을 선택적으로 추가할 수 있다.

| Variable | Value |
|---|---|
| `LIGHTSAIL_DEPLOY_ENABLED` | `false`로 두면 자동 배포를 일시 중지 |

현재 workflow는 기본적으로 main push 시 배포를 실행한다. 임시로 막고 싶을 때만 `LIGHTSAIL_DEPLOY_ENABLED=false`를 넣는다.

## SSH Key 권장 방식

서버에서 deploy 전용 key를 만든다.

```bash
ssh-keygen -t ed25519 -C "github-actions-silver-deploy" -f ~/.ssh/github_actions_silver_deploy -N ""
cat ~/.ssh/github_actions_silver_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
cat ~/.ssh/github_actions_silver_deploy
```

마지막에 출력된 private key 전체를 GitHub secret `LIGHTSAIL_SSH_KEY`에 넣는다.

## Workflows

`silver-project-deploy`에는 두 workflow가 있다.

- `.github/workflows/deploy.yml`: main push 또는 수동 실행 시 코드 배포
- `.github/workflows/refresh-data.yml`: 수동 실행 시 공공데이터 재수집/import

다른 repository도 main push마다 자동 배포하려면 같은 `deploy.yml`을 추가한다.

권장 대상:

- `silver-data-collector`
- `silver-backend`
- `silver-frontend`
- `silver-project-deploy`

## 서버 쪽 전제

서버에는 아래 경로가 있어야 한다.

```text
~/apps/silverProject
~/apps/silverProject/deploy
~/apps/silverProject/silver-data-collector
~/apps/silverProject/backend
~/apps/silverProject/silver-tour-app
~/apps/silverProject/.env.prod
```

`deploy-app.sh`는 `.env.prod`를 덮어쓰지 않는다.

## 수동 테스트

서버에서 먼저 직접 실행해본다.

```bash
cd ~/apps/silverProject/deploy
git pull --ff-only
chmod +x scripts/*.sh
./scripts/deploy-app.sh
```

데이터 갱신:

```bash
cd ~/apps/silverProject/deploy
./scripts/refresh-data.sh
```

cron 설치:

```bash
cd ~/apps/silverProject/deploy
SILVER_REFRESH_REGIONS="강릉" ./scripts/install-cron.sh
```

지역 하나를 즉시 수집:

```bash
cd ~/apps/silverProject/deploy
./scripts/refresh-region.sh 강릉 20
```

여러 지역을 한 번에 수집:

```bash
cd ~/apps/silverProject/deploy
SILVER_REFRESH_MODE=core SILVER_REFRESH_REGIONS="강릉,서울 강남구,부산 해운대구" SILVER_REFRESH_LIMIT=20 ./scripts/refresh-data.sh
```

## 주의

- GitHub Actions deploy는 앱 재배포만 수행한다.
- 공공데이터 수집은 `refresh-data.yml`을 수동으로 실행한다.
- DB volume은 유지된다.
- `docker compose up -d`는 전체 서버를 지우지 않고 필요한 container만 recreate한다.
