# 실행 및 운영 안내

## 구성
- 웹: Vinext / React / TypeScript, Cloudflare Workers. 기존 ChatGPT 로그인과 회원·포인트 구조 유지.
- 저장: D1(SQLite), R2. 일반 요청 안에서 크롤링이나 영상 렌더를 기다리지 않습니다.
- 긴 작업: 별도 Node 22.13+ 프로세스. `worker_tasks` 큐의 3분 lease를 받고 30초마다 갱신합니다.
- 관리: `/admin` → **수집·쇼츠·메일** (`/admin/automation`). 웹 관리자 이메일은 `ADMIN_EMAIL`입니다.

## 로컬 웹
```sh
npm ci
npm run build
npm run db:migrate:local
npm start
```
`npm start`는 로컬 8787 서버입니다. UI 개발은 `npm run dev` (5173)입니다.
로컬 `.dev.vars`에 `ADMIN_EMAIL`, `METRICS_SALT`, `WORKER_TOKEN`을 설정하세요. 파일은 커밋/검수 ZIP에 넣지 않습니다.
로컬 서버의 인증 헤더는 테스트용입니다. 해당 서버를 외부에 직접 노출하지 마세요. 배포본은 Sites dispatcher가 로그인 헤더를 전달합니다.
Windows에서 시스템 npm 래퍼가 깨진 경우: `node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js" run build` 또는 `node scripts/run-framework.mjs build`.

## 워커
`.env.example`은 변수 이름만 담습니다. 운영 환경의 secret manager/환경변수로 값을 주입하는 방법을 우선합니다.
```sh
npm run worker
npm run worker:once
```
워커에 `WORKER_SITE_URL`, 웹과 동일한 `WORKER_TOKEN`(32자 이상)을 설정합니다. 비공개 Sites에는 별도 `SITES_DISPATCHER_TOKEN`이 필요하며 `OAI-Sites-Authorization: Bearer ...`로 전달합니다.
로컬 파일 방식은 `.env.worker`를 읽지만 실제 credential 파일은 ZIP에 포함하지 않습니다. 이번 작업에서는 보안 승인 검토에 의해 실운영 credential의 로컬 파일 저장이 보류되었습니다.
워커는 계속 실행되는 호스트가 필요합니다. 웹 Workers 런타임 안에서는 FFmpeg/Chromium을 실행하지 않습니다.
```sh
docker build -f Dockerfile.worker -t secretagit-worker .
docker run --restart unless-stopped --env-file /secure/worker.env secretagit-worker
```
운영 머신 최소 권장: Node 지원 Linux/Windows, Chromium 실행 가능, 여유 디스크 및 렌더용 메모리. npm 설치에 FFmpeg/ffprobe가 포함되며 Chromium은 첫 렌더에서 내려받습니다. 오프라인 배포는 이미지 빌드 단계에서 준비합니다.

## 수집
1. 기본 소스 등록 → 필요한 소스 설정 확인 → **수집 테스트**.
2. 목록 1페이지 전체·상세·댓글·미디어 실검증을 모두 통과한 소스만 켤 수 있습니다. ‘검수된 기본값 적용 (OFF)’으로 이번 PASS 증거를 반영하거나 worker 수집 테스트를 실행하세요. 최초 전체 자동 게시는 정지 상태입니다.
3. ON 소스의 새 후보가 우선, 없으면 미사용 과거 후보가 선택됩니다. 기본 하루 1개/소스, 한국시간 19:00 이후 3분 간격.
4. robots/CAPTCHA/로그인 차단은 우회하지 않습니다. 실패 소스는 OFF로 유지합니다.
5. 공개 이미지 호스트는 소스별 `mediaHosts`에 추가합니다. 미디어 실패 정책 기본은 검수 대기입니다. 허용 목록을 광범위하게 풀지 마세요.
6. 실패 게시 작업은 설정을 고친 후 **다시 시도**. 사용 이력은 게시글을 숨겨도 남습니다.
7. 글/댓글의 출처 ID는 내부 DB에 보존되며 일반 게시글 API에서 노출하지 않습니다.

## 쇼츠
- 게시글 1~2개 선택 → 필요하면 이번 영상 설정 변경 → 제작 → MP4 재생/QC 확인 → 승인 → YouTube 업로드.
- 파일만 만들기는 승인/업로드 없이도 가능합니다. 업로드는 자동 실행되지 않습니다.
- BGM/배경/로고/효과음은 자산 화면에 사용 권한 근거를 적어 업로드합니다.
- 원본 음성이 있을 때 BGM `off`는 배경음악만 끄고 원본을 유지합니다. `duck`은 배경음악 20%, `keep`은 설정 볼륨 유지입니다.
- 너무 길면 분할 권고로 중단하거나 자동 분할을 사용합니다. 각 편은 독립 검수/승인을 받습니다.
- 원본 YouTube 임베드는 내려받아 재가공하지 않습니다. 텍스트와 직접 저장된 미디어만 렌더합니다.
- 렌더 오류는 최대 재시도 설정에 따라 10분/30분 뒤 재시도합니다. QC 실패 시 내부에서 한 번 다시 렌더합니다.
- 실패한 업로드는 생성 MP4를 지우지 않으며 저장된 resumable session으로 재개합니다. 세션 만료는 채널 중복 확인 후 명시적 초기화합니다.

## Google 연결
별도 Google OAuth client를 준비하고 API를 켭니다. Gmail용 계정은 반드시 전용 빈 메일함입니다.
```sh
npm run oauth -- gmail
npm run oauth -- youtube
```
이 보조 CLI는 localhost 콜백 + state/PKCE를 검증하고 refresh token을 ignored `.env.worker`에 기록합니다. 이 파일 저장을 원하지 않으면 조직의 secret manager 흐름으로 토큰을 발급·주입하세요.
콜백: `http://127.0.0.1:8765/callback`.
Gmail scopes: `gmail.modify` (기존 readonly 토큰은 재동의 필요). YouTube scopes: `youtube.upload`, `youtube.readonly`.
Gmail 워커는 profile의 주소가 관리자 지정 전용 주소와 일치할 때만 메시지를 읽습니다. 허용 발신자·제목 키워드·AUTO_POST 라벨을 모두 검사합니다. 기존 개인 Gmail은 연결/조회하지 않았습니다.
개인 Gmail→전용 계정의 전달 필터 및 라벨은 계정 소유자가 설정해야 합니다.
YouTube 앱 검증/감사 상태에 따라 API 업로드는 비공개로 제한될 수 있습니다. 실제 계정 연결 뒤 비공개 업로드로 검증하고 예약/공개를 사용하세요.

## 검증
```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:integration -- --render
npm run test:render
npm run test:sources
```
통합 테스트는 `.sites-runtime/integration-*/state`의 새 DB/R2와 18787 포트를 사용하고 종료합니다. 기존 `.wrangler/state`를 삭제하지 않습니다.
`test:sources`는 외부 공개 소스에 읽기 요청을 하며 사이트에 게시하지 않습니다.
검수 증거는 `test-results/`. 실제 혼합 미디어 영상은 `shorts-sample.mp4`, 미리보기는 `shorts-preview.png`입니다.

## migration / 복구
0000, 0001은 기존 migration을 변경하지 않았습니다. 0002는 운영 테이블 및 기존 글/댓글의 추가 컬럼만 만듭니다. 기존 글/회원 삭제나 PK 변경은 없습니다.
운영 전 DB 백업을 확보하고 동일 소스 빌드를 배포하세요. 스키마를 유지한 채 이전 앱 버전으로 되돌리는 방법이 데이터 삭제 rollback보다 안전합니다.
현재 웹 hosting은 Sites를 유지합니다. 배포 시 `drizzle` migration이 포함됩니다.

## 도메인 전환
대표 주소는 `https://www.ssrrr.net`이며 `SITE_URL`과 사이트 메타데이터는 이 주소를 사용합니다. canonical은 www 호스트입니다. apex `ssrrr.net`도 함께 연결해 www로 영구 리디렉션하세요.

DNS 연결 후: HTTPS 발급 완료 → 루트/로그인/첨부 Range/`robots.txt`/`sitemap.xml`/OG 미리보기 확인 → 상시 워커의 `WORKER_SITE_URL=https://www.ssrrr.net` 전환 → Search Console 속성과 sitemap 등록 순서로 점검합니다. 이전 Sites 주소는 운영 중 공유하지 않습니다.
사이트를 공개로 전환하는 것은 별도 소유자 결정이며 이번 작업에서 공개 범위를 바꾸지 않았습니다.

최신 재검수, Gmail 완료/실패/검토 라벨 처리 및 메뉴 설명은 [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md)를 참고하세요.

## 현재 Windows worker 연결 (2026-09-21)
실제 사이트 인증 및 claim 응답 확인 완료. 작업자 이름 secretagit-windows-main. 수집/렌더 활성, Gmail/YouTube credential 미연결. PC 전원·인터넷이 필요하며 재부팅 자동 시작은 등록하지 않았습니다.

PowerShell 7에서 프로젝트 디렉터리 기준 실행:
```powershell
./scripts/worker-windows.ps1          # 백그라운드 시작, 중복 실행 방지
./scripts/worker-windows.ps1 -Status  # 상태
./scripts/worker-windows.ps1 -Stop    # 이 프로젝트 worker만 종료
```

인증키는 .worker-runtime/credentials.dpapi에 Windows 현재 사용자 DPAPI로 암호화됩니다. 평문 .env.worker를 만들지 않았고 Git/검수 ZIP에서 제외합니다. 다른 PC/Windows 사용자에게 복사해도 복호화되지 않습니다. 시작 스크립트가 자식 Node 프로세스에만 환경변수를 전달하고 부모 환경을 복원합니다. 구성 도구 scripts/configure-worker-windows.mjs는 에코를 끈 터미널 입력으로 JSON을 받아 인증 확인 후 암호화하며, 토큰을 명령줄 인자로 전달하지 마세요. PowerShell 7 및 Node가 필요합니다.

관리 화면에서 수집 테스트를 누르면 정지 상태에서도 테스트 작업을 받을 수 있습니다. 자동 게시를 가동하려면 검증된 사이트 ON 및 자동 게시 재개를 사용합니다. 스캔 개수 30은 상한이며 첫 페이지가 20개면 20개만 확인합니다. 페이지를 추가로 넘기지 않습니다. 펨코는 현 실검증 BLOCKED이므로 ON 대상이 아닙니다.

ChatGPT 작업 알림 메일에서 전체 원문을 가져오는 VM 릴레이의 로그인·시험·중지 절차는 [CHATGPT_VM_RELAY.md](CHATGPT_VM_RELAY.md)를 따릅니다. 로그인 만료 시 릴레이만 정지하며 다른 worker 작업은 계속됩니다.
## 수동 수집 사이트 추가
‘가져올 사이트’ → ‘+ 수집 사이트 추가’에서 이름·목록 첫 페이지 주소·수집 규칙을 선택합니다. 디시는 일반갤/마이너갤 공통 규칙, 기존 사이트는 기본 규칙 복사, 기타 사이트는 직접 추출 규칙 설정을 지원합니다. 이름만으로 갤러리를 찾지는 않습니다.
‘저장하고 실제 검사’는 OFF 상태로 등록하고 worker 검사 작업을 예약합니다. 상태는 5초마다 갱신되며 미검증·검사 대기·검사 중·통과·실패/재검증 필요를 표시합니다. 목록/상세/댓글/미디어 확인 개수와 실패 이유를 볼 수 있습니다. 규칙을 복사해도 PASS 이력은 복사하지 않습니다. 통과 전에는 켜기 버튼이 비활성화됩니다. URL만 넣으면 모든 사이트가 지원되는 것은 아니며, 접근 차단은 우회하지 않습니다.
