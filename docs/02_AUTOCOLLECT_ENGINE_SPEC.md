# 자동수집 엔진 상세

## Source Adapter 인터페이스 권장
- fetchList()
- parseList()
- fetchDetail()
- parseDetail()
- parseMedia()
- parseComments()
- normalizeMetrics()

## 후보 upsert key
우선:
`source_id + external_post_id`
fallback:
`source_id + canonical_url`

## scan run
매 실행마다 scan_id/run_id를 만든다.
이번 scan에서 처음 발견된 후보를 정확히 판별할 수 있도록 `first_seen_run_id` 또는 first_seen_at을 사용한다.

## 신규 우선
"오늘 작성"이 아니라 "이번에 베스트 목록에서 처음 발견"을 신규성으로 본다.

## fallback
신규 후보가 없을 때만 기존 미사용 후보.
max age 기본 7일.

## 게시 수
소스별 daily_limit.
총합은 약 20개를 기본 운영량으로 보되 고정하지 않는다.

## 스케줄
19:00부터 3분 간격.
20개면 약 57분.
관리자 설정 변경 가능.

## 실패/재시도
수집 실패:
- 10분 후 1회
- 30분 후 1회
- 이후 failed 표시
프로젝트 기존 retry 정책이 있으면 재사용.

## candidate status 예
- discovered
- eligible
- duplicate
- filtered
- review_required
- selected
- queued
- published
- skipped
- failed
