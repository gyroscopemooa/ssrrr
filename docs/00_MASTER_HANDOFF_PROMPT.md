# 시크릿아지트 유머사이트 최종 통합 핸드오프 V3
## 자동수집 + 댓글/미디어 + 쇼츠 자동제작 + 경제게시판/Gmail + 도메인 전환

> 이 파일을 **가장 먼저 읽고 실행 기준으로 삼아라.**
>
> 이 패키지는 기존 유머사이트 프로젝트에 기능을 새로 덧붙이는 최종 핸드오프다.
> 예시 코드를 무작정 복붙하지 말고 **현재 실제 저장소의 프레임워크·DB·ORM·Auth·Admin UI·Storage·배포환경을 먼저 분석한 뒤 최소 변경으로 통합**한다.
>
> 계획만 작성하고 멈추지 말 것. 안전하게 구현 가능한 부분은 실제 코드·DB migration·관리자 UI·worker/service·테스트까지 계속 진행한다.
> 실제 도메인, OAuth credential, 외부 API secret, CAPTCHA/로그인 차단처럼 사용자가 직접 제공해야 하는 항목만 `WAITING_FOR_USER` 또는 `BLOCKED`로 남기고 나머지는 완료한다.

# 1. 최종 제품 목표

사이트는 다음 4개의 축을 하나의 관리자 운영 흐름으로 제공해야 한다.

1. **유머 자동수집 엔진**
   - 약 20개 안팎 커뮤니티/게시판을 관리자에서 ON/OFF
   - 각 소스의 베스트/인기/개념글 1페이지 전체 스캔
   - 후보풀 저장
   - 이미 사용한 글 제외
   - 새로 베스트에 들어온 후보 우선
   - 신규가 없으면 과거 미사용 후보 fallback
   - 소스별 daily limit 조절
   - 이미지/GIF/영상/댓글 최대 5개 처리
   - 기본 19:00부터 3분 간격으로 약 1시간 내 순차 게시

2. **쇼츠 제작소**
   - 사이트 게시글/후보를 선택
   - 텍스트/이미지/GIF/영상 유형 자동 분석
   - 길이 계산
   - 짧으면 댓글/다음 글로 자동 보강
   - 길면 속도조정/분할 제안
   - 1080x1920 브랜드 쇼츠 생성
   - BGM/원본오디오 정책
   - QC
   - 관리자 승인
   - YouTube 비공개/예약/공개 업로드
   - 중복 쇼츠 생성 방지 및 강제 재생성
   - 성과 동기화 확장 구조

3. **경제게시판 + Gmail 자동게시**
   - ChatGPT에 연결된 기존 개인 Gmail은 그대로 유지
   - 개인 Gmail에서 지정된 경제/주식/코인/포트폴리오 알림만 전용 빈 Gmail로 자동 전달
   - 사이트는 전용 Gmail만 읽음
   - 개인정보/개인 금칙어 검수
   - 문제 없으면 economy 게시판 자동등록
   - 의심되면 `review_required`
   - 메일 중복방지

4. **Preview → 실제 도메인/브랜드 전환**
   - 현재 GUI Preview URL이 바뀌어도 개발 가능
   - SITE_URL/SITE_NAME/자동작성자 등을 중앙화
   - 실제 도메인 확정 후 환경설정 중심으로 전환
   - 대규모 코드 수정 금지

# 2. 작업 전 반드시 분석할 실제 프로젝트 항목

먼저 저장소를 열고 아래를 실제 코드 기준으로 기록한다.

- framework / runtime / package manager
- app router / pages router 또는 기타 routing
- TypeScript 여부
- ORM/DB client 및 migration 방식
- posts / comments / users / profiles 실제 PK 타입과 relation
- 게시판/category 구조
- 관리자 권한 guard
- 인증 방식
- 이미지/GIF/영상 저장소
- 현재 cron/background job/queue 존재 여부
- 배포환경
- Node child_process 사용 가능 여부
- ffmpeg/ffprobe 사용 가능 여부
- Chromium/Remotion renderer 실행 가능 여부
- 환경변수/secret 관리 방식
- UI component/design system
- 기존 로그/에러 처리 방식
- 현재 테스트 runner

분석 결과로:
1. 재사용 가능한 것
2. 새로 만들 것
3. 이름/경로를 바꿔야 하는 예시 코드
4. 실제 migration 위험
을 짧게 정리한 뒤 구현을 계속한다.

# 3. 절대 원칙

- 기존 게시글/댓글 시스템을 불필요하게 재작성하지 않는다.
- 자동수집/쇼츠 실패가 일반 사이트 응답이나 글 저장을 막지 않게 한다.
- 장시간 렌더를 API 요청-응답 안에서 기다리지 않는다.
- 토큰/secret/OAuth refresh token은 server-only.
- 도메인/브랜드명/작성자 표시명을 코드 여러 곳에 하드코딩하지 않는다.
- 사이트별 차단 우회 금지. 차단 소스는 `BLOCKED` 처리.
- 관리자 기능은 서버에서도 권한 재검증.
- 쇼츠 업로드 기본값은 즉시 공개가 아니라 `file/private/scheduled` 중 안전한 기본값을 사용.
- 저작권이 확인되지 않은 음악을 자동 다운로드하지 않는다.
- 원본 영상에 음성이 있으면 BGM 정책을 `off/duck/keep`로 명시적으로 처리한다.
- 자동수집 공개 UI에 출처 라벨을 강제로 추가하지 않는다. 단, 운영/중복/삭제대응을 위해 내부 DB의 source 식별 정보는 유지한다.
- 댓글은 별도 베댓 영역이 아니라 기존 comments 시스템에 최대 5개까지 삽입한다.
- 쇼츠에 포함할 댓글은 기본 최대 3개를 사용하되 원 게시글 comments 데이터에서 선택한다.

# 4. 유머 자동수집 핵심 알고리즘

## 4.1 전체 스캔
각 소스 실행마다:
1. 베스트/인기/개념글 **첫 페이지 전체** 스캔
2. 최대 `scan_item_limit`개 후보 메타데이터 수집
3. candidate upsert
4. 처음 본 글 `first_seen_at=now`
5. 기존 글 `last_seen_at=now`, metrics 갱신
6. 이미 `used_at` 있는 글 제외
7. 필터/중복 검사
8. 신규 후보 우선
9. 신규가 없으면 기존 미사용 fallback
10. daily_limit만큼 게시큐 생성
11. 후보가 없으면 해당 소스 skip

## 4.2 기본 설정
- `scan_item_limit=30`
- `daily_limit=1`
- `prefer_new_candidates=true`
- `fallback_to_old_unused=true`
- `max_candidate_age_days=7`
- `selection_mode=hybrid`

## 4.3 시간 필드
- `published_at`: 원글 작성시각
- `first_seen_at`: 우리 크롤러가 베스트 페이지에서 처음 본 시각
- `last_seen_at`: 마지막 확인
- `selected_at`: 후보 선택
- `used_at`: 사이트 게시 완료

신규성 판단은 `published_at`만 보지 말고 **first_seen_at 중심**으로 한다.

## 4.4 예시
- 9/20: A/B/C → A 게시
- 9/21: 목록 그대로 → A 제외 → B 게시
- 9/22: X/Y가 새로 들어옴, B가 점수가 더 높아도 → X/Y 신규 그룹 우선
- 9/23: 신규 없음 → Y 또는 기존 미사용 fallback
- 모두 소진 → 그 소스 skip

## 4.5 인기도 점수
초기 예:
`score = likes*5 + comments*3 + views*0.01`

사이트마다 scale이 다르므로 관리자에서 weight 변경 가능.

# 5. 중복방지

## 같은 소스
우선순위:
1. source_id + external_post_id
2. canonical_url

## cross-source
- normalized title hash
- body fingerprint
- 대표 이미지 hash
- 가능하면 perceptual image hash
- 영상 hash 또는 대표 frame fingerprint

중복 판정 결과와 어떤 후보와 겹쳤는지 관리자 로그에 남긴다.

관리자가 사이트 글을 삭제해도 수집 이력은 유지하여 같은 글이 자동 재등록되지 않게 한다.

# 6. 초기 소스 운영

일반 후보:
- 엠봉
- 개드립
- 개집넷
- 오늘의유머
- FM코리아
- 보배드림
- 뽐뿌
- 인스티즈
- 클리앙
- 와이고수
- MLBPARK
- 더쿠
- 루리웹
- 인벤
- 아카라이브
- 이토랜드

디시 후보:
- 막갤
- 코갤
- 야갤
- 인방갤
- 우울갤
- 롤갤
- 치지직 관련 갤
- 싱글벙글 계열
- 해축갤
- 주갤

실제 ON 여부는 수집 테스트 통과 후 결정.
좋은 소스는 daily_limit 2~3, 별로인 소스는 OFF.

디시는 동일 `DcinsideAdapter`를 재사용하고 갤러리별 URL/id/config만 저장.
Prefix 예:
- `[막장갤 베스트]`
- `[야갤 베스트]`
- `[롤갤 베스트]`

# 7. 게시/댓글/미디어

## 게시 스케줄 기본
- timezone: Asia/Seoul
- 시작: 19:00
- 간격: 3분
- 약 20개면 19:00~19:57
- 동일 소스 글 연속 몰림 최소화
- 관리자에서 시작/간격/정렬 변경 가능
- 1시간 초과 예상 경고

## 댓글
- 외부 댓글 최대 5개
- 기존 comments 테이블/댓글 UI 사용
- 댓글이 3개면 3개만, 0개면 0개
- 랜덤 닉네임 풀 관리자 관리
- 내부 필드로 imported origin 추적

## 미디어
지원:
- jpg/jpeg/png/webp
- gif
- mp4/webm
- 지원 가능한 embed

본문 순서 최대한 보존.
기존 object storage 재사용.
미디어 오류 시 `skip media` 또는 `review_required` 정책 선택.
기본 예:
- image/gif 30MB
- video 100MB

# 8. 관리자 IA

좌측 메뉴 기준 권장:

- 대시보드
- 게시글
- 자동수집
  - 현황
  - 소스 관리
  - 후보풀
  - 게시 대기
  - 수집 기록
  - 설정
  - 랜덤 닉네임
- 쇼츠 제작소
  - 후보
  - 제작 대기
  - 생성 완료
  - 업로드
  - 설정
  - 성과
- 경제메일 자동게시
- 시스템 설정

기존 관리자 IA가 있으면 그 구조에 맞춰 재배치한다.

# 9. 쇼츠 제작소 핵심 운영 UX

운영자가 기본값만 사용할 경우:
`게시글 선택 → 미리보기 → 생성 → QC → 승인 → YouTube 예약`

3클릭 수준의 단순 플로우를 목표로 한다.

후보 화면:
- 체크박스
- 썸네일
- 제목
- 게시일
- 조회/추천/댓글
- 유형
- 예상길이
- 쇼츠 적합도
- 제작이력
- 미리보기
- 생성

필터:
- 기간
- 소스 내부값
- 콘텐츠 타입
- 쇼츠 제작 여부
- 예상 길이
- 검색

# 10. 쇼츠 콘텐츠 분석

자동 감지:
- text
- image
- multi image
- gif
- video
- video + original audio

분석 결과:
- normalized text
- content blocks
- media list
- video duration
- video hasAudio
- image count
- best comments
- estimated duration
- safety/filter status
- existing shorts history

# 11. 예상 길이 및 자동 조합

초기 기본값:
- min = 25초
- preferred = 30~55초
- target = 40초
- operational max = 60초
- long threshold = 70초
- max posts per short = 2
- shorts comments max = 3

짧은 글 보강:
1. 본문
2. 베스트댓글
3. 다음 eligible post
4. 다음 글 베스트댓글

관리자에서 우선순위 override 가능.

긴 글:
- 읽을 수 있는 범위에서 스크롤 속도 조절
- 여전히 max 초과면 split suggestion
- 자동분할 ON이면 part 1/2 생성 가능

# 12. 쇼츠 렌더 아키텍처

현재 프로젝트가 React/Next 계열이면 Remotion 우선 고려.
최종 인코딩/오디오 진단은 FFmpeg/ffprobe 사용 가능.

권장 흐름:
Admin UI
→ create job
→ DB `queued`
→ worker
→ analyzing
→ scene planner
→ ready_to_render
→ Remotion render
→ FFmpeg finalization
→ qc
→ ready
→ 사용자 승인
→ upload_queued
→ YouTube upload/schedule
→ scheduled/published

상태:
- draft
- queued
- analyzing
- ready_to_render
- rendering
- qc
- ready
- rejected
- upload_queued
- uploading
- scheduled
- published
- failed

모든 상태 전환 시각/오류를 기록.

# 13. 쇼츠 장면/렌더 규칙

출력 기본:
- 1080x1920
- 30fps
- H.264 MP4
- AAC

Scene 예:
- intro
- post_title
- post_body_scroll
- image_hold
- gif_play
- video_play
- comments
- transition
- outro

레이아웃:
- 상단 브랜드 영역
- 중앙 safe zone
- 하단 CTA/브랜드
- Shorts UI와 겹칠 수 있는 우측/하단 중요정보 배치 금지

스크롤:
- 단순 px/s 고정 금지
- 읽기시간 → 필요한 거리 → 평균속도 역산
- easeInOut
- 이미지 중앙 hold
- 펀치라인 hold
- 시작/끝 감속
- 전환 전 여백

# 14. 쇼츠 오디오

기본:
- text/image/gif → BGM ON
- video + audio → BGM OFF
- video mute → BGM ON

고급:
- `video_audio_policy=off|duck|keep`
- bgm volume
- original audio volume
- effects off/low/normal

BGM은 관리자가 등록한 라이선스 확인 자산만 사용.

# 15. 쇼츠 QC

최소 검사:
- output file exists
- file size > 0
- width=1080
- height=1920
- duration valid
- video stream exists
- audio 정책에 맞는 audio stream
- 마지막 scene 완료 metadata
- 기본 black-frame/empty-frame 검사를 지원 가능한 범위에서 실시
- 실패 원인 저장
- 자동 수정 가능한 QC 오류는 1회 재렌더
- 렌더 retry 횟수 제한

쇼츠 실패는 일반 사이트 기능에 영향 없어야 함.

# 16. 쇼츠 중복방지

기본적으로 성공/ready/published 이력이 있는 게시글은 자동 후보에서 제외.

예외:
- 운영자 수동 재생성
- failed/rejected
- 플랫폼별 별도 출력
- A/B 실험

`force=true` 같은 명시적 관리자 동작 없이 자동 중복생성 금지.

# 17. YouTube

지원:
- 파일만 생성
- private
- unlisted
- scheduled
- public

기본 권장:
- private 또는 scheduled
- 즉시 public 기본 금지

저장:
- channel id
- youtube_video_id
- privacy
- status
- scheduled/published time
- title
- description
- tags
- last synced

업로드 실패:
- 렌더된 MP4 보존
- publication만 failed
- upload만 재시도

실제 운영 전 현재 Google/YouTube API 정책과 공개 제한은 공식문서 기준으로 재확인하도록 작업보고에 적는다.

# 18. 자동수집 ↔ 쇼츠 연동

중요: 두 시스템을 중복 구현하지 말고 데이터 흐름을 연결한다.

- 자동수집으로 최종 게시된 `posts`가 쇼츠의 주된 후보 source.
- `auto_candidates`의 조회/추천/댓글/신규성 데이터는 쇼츠 적합도 계산에 재사용 가능.
- imported comments는 기존 comments 테이블에서 읽어 쇼츠의 베스트댓글 후보로 사용.
- media asset relation을 재사용.
- 같은 post에 shorts 성공 이력이 있으면 자동 쇼츠 후보에서 제외.
- 사이트 게시 여부와 쇼츠 생성 여부는 별도 상태.
- 자동수집 실패가 쇼츠 worker에 장애를 전파하지 않음.
- 쇼츠 생성 실패가 post 상태를 변경하지 않음.

# 19. 경제게시판/Gmail

흐름:
ChatGPT 알림
→ 개인 Gmail
→ 특정 경제 알림만 자동전달
→ 전용 Gmail
→ Gmail ingest
→ 개인정보 검사
→ economy 게시판

사이트가 개인 Gmail 전체를 읽지 않는다.

처리조건:
- 허용 sender
- 허용 subject pattern
- AUTO_POST label
- unprocessed
- Message-ID 중복 없음
- content hash 중복 없음

검수:
- 이메일
- 전화번호
- 주민번호형
- 카드/계좌번호형
- API key/token
- 주소형 패턴
- 관리자 private denylist
감지 시 `review_required`.

검수 시스템 오류 시 자동게시 금지(Fail Closed).

V1 polling 기본 3분.
V2 event/push 확장 가능.

# 20. 데이터 모델

실제 프로젝트 모델에 맞춰 migration 문법/PK 타입을 조정한다.
최소 개념 테이블:

자동수집:
- auto_sources
- auto_candidates
- crawl_runs
- auto_post_jobs

쇼츠:
- shorts_settings
- shorts_assets
- shorts_jobs
- shorts_job_posts
- shorts_outputs
- shorts_publications
- shorts_metrics

경제메일:
- email_ingest_messages

기존 확장:
- comments: origin/source_id/external_comment_id/imported_at
- posts 또는 relation: short_excluded / source refs / short last created 등의 개념

정확한 필드는 `04_UNIFIED_DB_SCHEMA.md` 참고.

# 21. 시스템 작성자/브랜드

가능하면 자동글 작성자명을 글마다 문자열로 복사하지 말고 시스템 user/profile의 `author_id`를 참조한다.

나중에 사이트명이 정해지면:
- 시스템 프로필 표시명
- SITE_NAME
- 로고/파비콘
만 중앙에서 변경.

# 22. Preview URL / 도메인

현재:
- 임시 Preview URL이 바뀌어도 내부 기능 정상
- 내부 링크 상대경로
- OAuth callback 등 절대 URL이 필요한 곳만 환경별 설정

도메인 확정 후:
DNS → HTTPS → SITE_URL → SITE_NAME → 로고 → author display → OAuth/Auth redirect → CORS → cookies → canonical → sitemap → robots → OG → Search Console → Analytics/광고 → 이메일 링크 → 하드코딩 검사 → E2E.

# 23. 구현 우선순위

## Phase 0: Preflight
- 저장소/DB/Auth/Admin/Storage/배포 분석
- ffmpeg/ffprobe/Chromium/child_process 점검
- 회귀 기준 확보

## Phase 1: 자동수집 기반
- DB
- adapters
- 전체 1페이지 scan
- candidate pool
- dedup
- filter
- schedule
- comments/media
- admin UI

## Phase 2: 쇼츠 MVP
- shorts DB
- 후보 화면
- 1개 text/image post
- duration estimate
- Remotion template
- MP4 output
- history

## Phase 3: 쇼츠 자동조합
- best comments
- next post
- planner
- scroll math
- override UI

## Phase 4: GIF/video/audio/QC
- ffprobe
- audio policy
- GIF/video scenes
- QC/retry

## Phase 5: YouTube
- OAuth
- private upload
- schedule
- publication history

## Phase 6: 경제게시판/Gmail
- economy board
- Gmail ingest
- privacy scan
- duplicate prevention
- admin review

## Phase 7: 도메인 readiness + 최종 검수
- env centralization
- hardcode scan
- build/typecheck/lint/tests
- final report

서로 독립적으로 구현 가능한 단계는 외부 credential 때문에 전체를 멈추지 말 것.

# 24. 최종 보고 형식

반드시 마지막에:
- 분석한 실제 프로젝트 구조
- 실제 변경 파일
- 새 파일
- migration
- 설치한 dependency
- env/secrets
- local run 명령
- worker run 명령
- 테스트 결과
- BLOCKED/WAITING_FOR_USER
- 실제 도메인 연결 후 할 일
- YouTube credential 설정 후 할 일
- 남은 known issue
를 정리한다.

# 25. 완료 기준

다음이 충족되어야 1차 최종 완성:

자동수집:
- 1페이지 전체 스캔
- first_seen/last_seen/used
- 신규 우선
- fallback
- max age
- source daily limit
- dedup
- comments max5
- image/gif/video
- 19:00/3분
- 관리자 조율

쇼츠:
- 후보/미리보기
- text/image/gif/video 지원
- 원본음성 감지
- 자동 길이
- 짧은 글 보강
- 긴 글 split 제안
- auto scroll
- 1080x1920 MP4
- BGM/duck/off
- QC/retry
- 중복생성 방지
- 수동 재생성
- YouTube private 또는 scheduled
- video id 저장
- job 비동기

경제:
- economy 게시판
- 전용 Gmail
- 중복방지
- 개인정보 fail closed
- review queue

플랫폼:
- Preview URL 독립
- 도메인/브랜드 중앙설정
- lint/typecheck/build/test
- 일반 게시판 회귀 없음

# 26. 절대 마지막 지시

예시 코드는 **참고 구현**이다.
현재 실제 코드베이스에서 더 좋은 기존 abstraction이 있으면 그것을 사용한다.
그러나 기능 요구사항을 단순히 "추후 구현"으로 미루지 말고, 현재 환경에서 구현 가능한 것은 끝까지 완성한다.
