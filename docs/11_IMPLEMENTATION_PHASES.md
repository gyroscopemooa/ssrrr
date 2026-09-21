# 구현 단계

## Phase 0 - Preflight
현재 프로젝트 분석 + 회귀기준 + runtime capability 확인.

## Phase 1 - 자동수집
DB → adapter → scan/upsert → selection → dedup/filter → comments/media → publish queue → admin.

## Phase 2 - 쇼츠 MVP
DB → 후보화면 → text/image 1개 → duration → render → MP4 → history.

## Phase 3 - 쇼츠 자동조합
comments → next post → planner → scroll → override.

## Phase 4 - GIF/Video/Audio/QC
ffprobe → audio policy → media scenes → QC/retry.

## Phase 5 - YouTube
OAuth → private upload → schedule → history.

## Phase 6 - Economy/Gmail
economy board → dedicated Gmail ingest → privacy scan → review queue → post.

## Phase 7 - Production readiness
worker split/queue, hardcode scan, domain checklist, regression, build/typecheck/lint.

### 진행 규칙
외부 credential 때문에 막히는 단계는 인터페이스/DB/UI/mock까지 만들고 WAITING_FOR_USER로 남긴다.
다른 독립 단계는 계속 구현한다.
