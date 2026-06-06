# Silver Memory

고인의 생애 페이지, 방명록, 유족 편집기를 제공하는 별도 서비스 프로토타입입니다.

## 현재 범위

- 고인의 생애 페이지: 대표 사진, 한 줄 소개, 삶의 키워드, 타임라인, 기억 카드
- 새 추모관 만들기: 기본 정보 입력 후 slug와 최초 유족 코드 발급
- 최초 유족 코드/QR 링크/가족 초대 링크 복사: 생성 직후 편집 권한과 공유 링크를 안전하게 보관
- 처음 설정 체크리스트: 유족 코드, 대표 사진, 타임라인, 기억 카드, QR, 가족 초대 준비 상태 확인
- 빠른 기록 작성: 생애 타임라인과 기억 카드를 한 화면에서 묶어 추가
- 방명록: 방문자 작성, 승인 대기, 공개 글 표시, 작성 브라우저에서 본인 글 수정/삭제
- 유족 편집기: 기본 정보 수정, 대표 사진 미리보기/업로드, 공개 범위 변경, 방명록 승인/숨김/고정
- 비공개 추모관 안내: 가족만 공개된 페이지는 공개 생애 화면 대신 유족 코드 입력 화면 표시
- 타임라인 편집: 중요한 순간 추가, 수정, 삭제
- 기억 카드 편집: 짧은 가족 이야기, 좋아했던 것, 영상/사진 링크 추가, 수정, 삭제
- 유족 코드: 편집/승인/편집기록 조회 전용 MVP 보호 장치
- 가족 초대 링크: 함께 편집할 가족에게 만료 기간이 있는 초대 링크 발급, 목록 확인, 회수, 초대받은 이름으로 편집 기록 표시
- 편집 기록: 누가 어떤 내용을 바꿨는지 유족끼리 확인
- 가족 백업: 생애 정보, 타임라인, 기억 카드, 방명록, 편집 기록을 JSON 파일로 다운로드하고 브라우저에서 임시 복구
- QR 카드: 현재 페이지 URL을 실제 QR SVG로 만들고 인쇄용 안내 카드 다운로드
- 디자인 설정: 유족이 테마, 기억 대상, 페이지 구성을 직접 선택하고 저장
- 디자인 테마: 따뜻한 기록, 강릉 바다, 조용한 정원, 담백한 기록관, 봄날의 꽃, 한지 편지, 고요한 호수
- 기억 대상: 사람, 반려동물
- 페이지 구성: 기록관형, 앨범형, 편지형, 사진첩형, 스토리형
- AI 태그 초안: 생애 글과 방명록을 바탕으로 키워드 후보를 만들고 유족이 승인

백엔드가 켜져 있으면 `/api/memory`를 통해 PostgreSQL에 저장합니다. 백엔드 연결이 없으면 브라우저 `localStorage`에 임시 저장되는 프론트엔드 MVP로 동작합니다.

백엔드 연결 상태에서 대표 사진을 선택해 저장하면 `/api/memory/memorials/{slug}/uploads`로 먼저 업로드하고, 반환된 이미지 URL만 프로필에 저장합니다. 백엔드 연결이 없을 때만 브라우저 data URL을 임시로 사용합니다. 유족 편집기에서는 저장 전에 선택한 사진을 미리 볼 수 있고, 이미지가 아니거나 5MB를 넘는 파일은 저장 전에 막습니다.

공개 범위는 `가족만`, `링크 공개`, `전체 공개`입니다. `가족만`은 유족 코드 또는 초대 토큰이 있어야 열 수 있고, 공개 방명록 작성도 막습니다.

## 실행

```bash
npm run dev
```

브라우저에서 `http://127.0.0.1:5175`를 엽니다.

공유/QR 링크는 해시 라우트로 동작합니다.

```text
http://127.0.0.1:5175/#/m/kim-youngsu
```

백엔드까지 연결해 보려면 별도 터미널에서 다음을 실행합니다.

```bash
cd ../backend
./gradlew bootRun --args='--spring.docker.compose.enabled=false'
```

로컬 `5175`에서는 자동으로 `http://127.0.0.1:8080/api/memory`를 바라봅니다. 운영에서는 같은 도메인의 `/api/memory`를 사용합니다.

## API

초기 샘플 slug는 `kim-youngsu`입니다.

```http
GET /api/memory/memorials/kim-youngsu
POST /api/memory/memorials
POST /api/memory/memorials/kim-youngsu/guestbook
GET /api/memory/memorials/kim-youngsu?includeModeration=true
PUT /api/memory/memorials/kim-youngsu
POST /api/memory/memorials/kim-youngsu/life-events
PATCH /api/memory/life-events/{id}
DELETE /api/memory/life-events/{id}
POST /api/memory/memorials/kim-youngsu/moments
PATCH /api/memory/moments/{id}
DELETE /api/memory/moments/{id}
POST /api/memory/memorials/kim-youngsu/uploads
POST /api/memory/memorials/kim-youngsu/editor-invites
PATCH /api/memory/editor-invites/{id}
PATCH /api/memory/guestbook/{id}/owner
DELETE /api/memory/guestbook/{id}/owner
PATCH /api/memory/guestbook/{id}
```

유족 편집 탭에서 샘플 코드는 `demo-family-token`입니다. 보호되는 API에는 다음 헤더가 붙습니다.

```http
X-Memory-Editor-Token: demo-family-token
```

가족 초대 링크는 `#/m/{slug}?invite={token}` 형식입니다. 초대 링크로 들어오면 프론트엔드가 초대 토큰을 유족 코드 입력란에 저장하고, 주소창에서는 토큰을 제거합니다. 백엔드는 초대 토큰에 연결된 이름을 `currentEditorLabel`로 내려주며, 프론트엔드는 편집자 이름이 비어 있거나 기본값이면 이 이름을 자동으로 채워 편집 기록에 남깁니다. 생성된 초대는 유족 편집기에서 상태와 만료일을 확인하고 회수할 수 있습니다.

새 추모관 생성 응답의 `editorToken`은 최초 유족 코드입니다. 프론트엔드는 생성 직후 이 코드를 유족 편집기에 표시하고, 해당 코드로 바로 편집 화면을 엽니다.

방명록 작성 응답에는 `ownerToken`이 한 번 포함됩니다. 프론트엔드는 이 토큰을 이 브라우저에만 저장해 `내가 남긴 방명록` 영역에서 수정/삭제할 때 사용합니다. 서버에는 토큰 원문 대신 해시만 저장합니다. 방문자가 글을 수정하면 다시 승인 대기 상태가 되고, 유족이 승인해야 공개됩니다. Google 로그인 도입 전까지의 MVP 소유권 장치입니다.

백업 다운로드 파일에는 유족 코드와 초대 토큰 원문을 포함하지 않습니다. 권한 코드는 별도 보관해야 합니다. 백업 가져오기는 먼저 JSON 형식을 확인하고, 현재 단계에서는 운영 DB를 덮어쓰지 않고 이 브라우저에 임시 복구합니다.

운영 서버의 새 추모관 생성 API는 기본적으로 같은 IP에서 1시간에 5개까지만 허용합니다.

```env
MEMORY_CREATION_RATE_LIMIT_MAX=5
MEMORY_CREATION_RATE_LIMIT_WINDOW_MINUTES=60
MEMORY_GUESTBOOK_RATE_LIMIT_MAX=20
MEMORY_GUESTBOOK_RATE_LIMIT_WINDOW_MINUTES=60
```

`MEMORY_CREATION_RATE_LIMIT_MAX=0` 또는 `MEMORY_GUESTBOOK_RATE_LIMIT_MAX=0`으로 두면 해당 제한을 임시로 끌 수 있습니다.

## 디자인 변경

페이지 분위기는 `src/styles.css`의 `:root[data-memory-theme="..."]` 토큰과 `src/main.js`의 `DESIGN_THEMES` 프리셋으로 관리합니다. 유족 편집기의 `디자인 설정` 패널에서 바꾸고 저장할 수 있습니다.

새 테마를 추가할 때는 두 곳에 같은 `id`를 추가합니다.

페이지 구성은 `PAGE_TEMPLATES`, 기억 대상은 `MEMORIAL_KINDS`에서 관리합니다. 새 값을 추가할 때는 backend의 허용 목록도 함께 확장해야 합니다.

## AI 태그 방향

현재 프론트엔드 MVP의 `AI 태그 초안`은 로컬 규칙 기반 추천입니다. 운영 버전에서는 생애 글, 장면, 승인된 방명록을 LLM에 전달해 태그 후보를 만들고, 유족이 직접 눌러 승인한 태그만 공개 페이지에 반영합니다.

## 로그인 방향

현재 MVP는 유족 코드로 편집을 보호합니다. 운영 베타부터는 Google 로그인과 가족 초대 링크를 붙이는 것이 좋습니다.

- 공개 페이지와 방명록 작성은 로그인 없이 유지
- 방명록 작성자 수정/삭제는 현재 `ownerToken`으로 보호하고, 로그인 도입 후 Google 사용자 ID 소유권으로 이전
- 유족 편집기, 방명록 승인, 편집 기록, QR 다운로드는 로그인 필요
- 유족 데이터 백업과 복구는 로그인한 가족 권한으로 제한
- Google 로그인 사용자는 memorial별 가족 권한 테이블로 연결

## 서비스 경계

현재 단계에서는 Silver Smile과 Silver Memory를 같은 Lightsail 서버와 Docker Compose 안에서 운영합니다.

- `silver.loopmateapp.com`: 어르신 생활정보
- `silver.loopmateapp.com/memory/`: 가족 기억 보관소

동접자와 운영 비용이 커지기 전까지는 모놀리식 운영을 유지합니다. 제품/브랜드가 충분히 검증되면 `memory.loopmateapp.com` 같은 별도 도메인 또는 별도 배포 단위로 분리할 수 있습니다.

## 운영 전 필수 작업

- 유족 편집기 MVP 코드를 실제 로그인/초대 토큰으로 교체
- 방명록 스팸 방지
- QR 스캐너 실기기 판독 테스트
- 개인정보/추모 데이터 백업 정책
