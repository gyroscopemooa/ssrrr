# 실운영 준비 재검수 (2026-09-21)

## 실제 소스 검사
26개 소스를 순서대로 재검수했다. 각 URL의 첫 목록 페이지 전체를 파싱하고 공개 상세 최대 5건에서 본문·댓글·실제 미디어 응답을 확인했다. 검사한 요청 URL/응답 크기와 개수는 test-results/live-sources.json에 있다. 상세 완료는 댓글까지 성공한 상세이며, 디시의 본문 HTTP 200 후 댓글 거절은 완료로 세지 않는다.

기존 PASS: 개집넷, 오늘의유머, 인스티즈, 더쿠, 인벤.
현재 강화된 PASS: 엠봉, 개드립, 더쿠, 루리웹, 인벤. **신규 통과 3개, 종전 3개 재검수 탈락으로 총 PASS는 5개**다. 숫자를 늘리기 위해 차단을 우회하거나 검증 기준을 낮추지 않았다. 개집넷 표본의 FM 이미지 서버와 오늘의유머 이미지 서버는 robots 제한, 인스티즈는 HTTP 403이다.

| 소스 | 결과 | 1페이지 글 수 | 상세 완료 | 댓글 | 미디어 | 원인 |
|---|---|---:|---:|---:|---:|---|
| 엠봉 | PASS | 20 | 1 | 1 | 2 |  |
| 개드립 | PASS | 23 | 1 | 5 | 2 |  |
| 개집넷 | BLOCKED | 20 | 2 | 10 | 0 | BLOCKED: robots.txt / |
| 오늘의유머 | BLOCKED | 30 | 2 | 0 | 0 | FETCH_TIMEOUT; BLOCKED: robots.txt / |
| FM코리아 | BLOCKED | 24 | 0 | 0 | 0 | BLOCKED: robots.txt / |
| 보배드림 | BLOCKED | 0 | 0 | 0 | 0 | HTTP 406 |
| 뽐뿌 | BLOCKED | 0 | 0 | 0 | 0 | BLOCKED: HTTP 403 |
| 인스티즈 | BLOCKED | 0 | 0 | 0 | 0 | BLOCKED: HTTP 403 |
| 클리앙 | BLOCKED | 0 | 0 | 0 | 0 | BLOCKED: robots.txt /service/recommend |
| 와이고수 | BLOCKED | 27 | 0 | 0 | 0 | BLOCKED: robots.txt /*?*list_context= |
| MLBPARK | BLOCKED | 0 | 0 | 0 | 0 | BLOCKED: robots.txt / |
| 더쿠 | PASS | 20 | 1 | 5 | 2 |  |
| 루리웹 | PASS | 28 | 1 | 2 | 1 |  |
| 아카라이브 | BLOCKED | 45 | 1 | 2 | 0 | BLOCKED: HTTP 403 |
| 이토랜드 | NETWORK_ERROR | 0 | 0 | 0 | 0 | UNSAFE_URL |
| 막갤 | BLOCKED | 49 | 0 | 0 | 0 | BLOCKED: DC public comment endpoint denied access |
| 코갤 | BLOCKED | 50 | 0 | 0 | 0 | BLOCKED: DC public comment endpoint denied access |
| 야갤 | BLOCKED | 49 | 0 | 0 | 0 | BLOCKED: DC public comment endpoint denied access |
| 인방갤 | BLOCKED | 0 | 0 | 0 | 0 | BLOCKED: robots.txt /board/lists/?id=ib_new |
| 우울갤 | BLOCKED | 50 | 0 | 0 | 0 | BLOCKED: DC public comment endpoint denied access |
| 롤갤 | BLOCKED | 49 | 0 | 0 | 0 | BLOCKED: DC public comment endpoint denied access |
| 치지직 | PARSING_UNVERIFIED | 0 | 0 | 0 | 0 | SELECTOR_MISMATCH: list |
| 싱글벙글 | BLOCKED | 50 | 0 | 0 | 0 | BLOCKED: DC public comment endpoint denied access |
| 해축갤 | PARSING_UNVERIFIED | 49 | 0 | 0 | 0 | SELECTOR_MISMATCH: body; SELECTOR_MISMATCH: body; SELECTOR_MISMATCH: body; SELECTOR_MISMATCH: body; SELECTOR_MISMATCH: body |
| 주갤 | PARSING_UNVERIFIED | 0 | 0 | 0 | 0 | SELECTOR_MISMATCH: list |
| 인벤 | PASS | 50 | 1 | 1 | 2 |  |

## 수정 내용
- robots wildcard·끝 일치·Allow 우선순위·query·crawl-delay 수정. 리다이렉트 목적지도 요청 전에 robots 검사. 웹페이지와 원본 미디어 모두 검사하며 HTTP 403/406 등 차단은 중단.
- 엠봉 댓글, 개드립/루리웹 목록·본문·댓글 선택자 수정. 더쿠/인벤은 페이지가 사용하는 공개 댓글 읽기 API와 실제 응답 구조 반영. 더쿠의 실제 이미지 호스트 pbs.twimg.com만 추가.
- 디시 일반 로그인 안내 문구에 대한 오탐 제거. 막갤 accident_new, 코갤 comedy_new1, 야갤 baseball_new13, 치지직/싱글벙글 mgallery 경로 반영. 공통 Adapter가 공개 댓글 API를 확인하나 접근 거절 시 중단하며 로그인·쿠키·CAPTCHA 우회는 하지 않는다. 일부 디시 페이지는 간헐적으로 빈/다른 HTML을 반환하여 추출 미검증으로 유지한다. 인방갤은 robots 금지.
- 설정 identity + 검증 버전 2 + 목록 전체/상세/댓글/미디어 증거가 모두 있어야 ON. 주소·Adapter·selector·미디어 호스트 변경 시 재검증. 실패하면 OFF 및 tested_at 해제. 기존 약한 PASS는 재사용 불가.
- 관리자의 ‘검수된 기본값 적용 (OFF)’은 수정된 주소/추출 규칙을 적용하고, 실제 PASS 및 설정 일치 시에만 검증 이력을 가져온다. 자동으로 ON/게시하지 않는다. 사용자별 제한·게시 설정은 보존한다.

## Gmail 후처리
- AUTO_POST → AUTO_POST_DONE(게시 성공), AUTO_POST_REVIEW(검토/보류), AUTO_POST_ERROR(실패/반려). 원래 AUTO_POST와 다른 종료 라벨을 제거한다. 받은편지함/읽음 여부는 변경하지 않는다.
- 전체 message ID 페이지를 먼저 읽은 뒤 라벨 변경하므로 polling 중 목록 축소로 다음 페이지를 놓치지 않는다. 메시지 단위 수정으로 다른 스레드 메일에 영향이 없다.
- 라벨이 없으면 생성. 라벨 변경 실패는 오류로 기록하고 AUTO_POST를 남겨 다음 polling에서 idempotent 재처리. 관리자 승인/반려와 라벨 작업 저장은 DB batch로 함께 처리. 실패한 관리자 라벨 작업은 ‘Gmail 라벨 다시 반영’으로 재시도.
- 전용 mailbox profile 일치 검사 유지. Gmail 권한은 gmail.modify로 변경했으므로 기존 readonly 토큰은 재동의 필요. 실제 Gmail 테스트는 credential 미제공으로 WAITING_FOR_USER이며 모의 API 테스트와 로컬 DB/API 테스트를 구분한다.

## 회귀/운영 상태
- 신규 DB migration 및 dependency 없음. 기존 커뮤니티·DB·쇼츠 렌더 구현 유지.
- 단위/계약 16개 통과. 기존 커뮤니티 API, ON gate/재검증 취소, 경제메일 승인과 라벨 작업, 실제 Remotion → R2 → QC → 승인 → Range 다운로드 통과. lint/typecheck/build 최종 결과는 test-results/readiness-summary.json.
- Gmail/YouTube 실계정·도메인·상시 worker secret 주입은 기존 대기 상태. 외부 소스의 접근 제한은 WAITING_FOR_USER가 아닌 BLOCKED/미검증 OFF로 기록한다.

## 관리 화면 사용
주소: https://secretagitl.mooacst.chatgpt.site/admin/automation
현재 소유자 비공개 Sites이므로 소유자의 ChatGPT 계정으로 접근한다. 그 계정의 로그인 방식이 Google이면 ‘Google로 계속하기’를 사용한다. 단독 사이트 Google OAuth 로그인 기능이나 Gmail/YouTube API 연결과는 별개다.

| 메뉴 | 하는 일 |
|---|---|
| 수집 소스 | 가져올 사이트와 사이트별 수집 조건 |
| 후보·예약 | 가져온 글 검토, 게시 여부와 게시 시간 지정 |
| 쇼츠 제작소 | 게시글을 영상으로 만들고 검수/발행 |
| 경제 메일 | 전용 Gmail의 경제 알림 처리/검수 |
| 자산 | 쇼츠용 배경음악·배경·로고·효과음 보관 |
| 설정 | 전체 공통 게시 시간·작성자·Gmail·쇼츠 기본값 |
| 작업 기록 | 작업 결과와 오류 확인 |

## 이번 수정의 배포 상태
로컬 구현·검증·커밋 완료. 기존 Sites 저장소(git.chatgpt-team.site)로 소스 및 Git 이력을 push하는 단계가 자동 승인 검토에서 명시적 외부 전송 승인 부족으로 거절되었다. 우회하거나 업로드를 실행하지 않았다. 이후 사용자가 기존 저장소 업로드와 배포를 명시적으로 승인하여 배포를 재개했다. 배포 완료 여부는 Sites 배포 결과를 기준으로 확인한다.
