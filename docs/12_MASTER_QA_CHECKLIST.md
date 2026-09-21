# 최종 QA 체크리스트

## 자동수집
- [ ] 베스트/인기/개념 첫 페이지 전체 스캔
- [ ] scan_item_limit
- [ ] first_seen_at / last_seen_at / used_at
- [ ] 신규 후보 우선
- [ ] 신규 없음 fallback
- [ ] max candidate age
- [ ] daily_limit
- [ ] same-source duplicate
- [ ] cross-source duplicate
- [ ] 삭제 후 자동 재수집 방지
- [ ] 댓글 최대 5
- [ ] 이미지/GIF/영상
- [ ] 19:00 / 3분
- [ ] 긴급정지
- [ ] 수집 실패 로그/재시도
- [ ] 소스 ON/OFF

## 쇼츠 일반
- [ ] 후보 목록
- [ ] 관리자 1개/복수 선택
- [ ] text/image/multi-image/GIF/video 분석
- [ ] estimated duration
- [ ] min 미만 댓글 보강
- [ ] 필요 시 다음글
- [ ] max posts 제한
- [ ] 긴 글 split suggestion
- [ ] 전역설정과 per-job override 분리

## 렌더
- [ ] 1080x1920
- [ ] 30fps
- [ ] H.264 MP4
- [ ] safe zone
- [ ] auto scroll
- [ ] 이미지 hold
- [ ] punchline hold
- [ ] GIF 재생
- [ ] video 재생
- [ ] video audio detection
- [ ] BGM off/duck/keep
- [ ] CTA/watermark/intro/outro 설정

## QC
- [ ] file exists/size > 0
- [ ] video stream
- [ ] resolution
- [ ] duration
- [ ] audio policy
- [ ] scene completion
- [ ] error persisted
- [ ] retry
- [ ] temp cleanup

## 중복 쇼츠
- [ ] 성공 이력 자동 제외
- [ ] failed/rejected 예외
- [ ] 강제 재생성
- [ ] retry 중 duplicate output 방지

## YouTube
- [ ] OAuth server-only
- [ ] private upload
- [ ] scheduled upload
- [ ] metadata
- [ ] video id
- [ ] upload retry
- [ ] timezone

## 경제/Gmail
- [ ] 개인 Gmail 직접 읽지 않음
- [ ] 전용 Gmail
- [ ] AUTO_POST label
- [ ] Message-ID
- [ ] content hash
- [ ] privacy scan
- [ ] private denylist
- [ ] review_required
- [ ] fail closed

## 회귀
- [ ] 일반 글 작성/수정/삭제 정상
- [ ] 일반 댓글 정상
- [ ] 자동수집 정상
- [ ] 이미지/GIF/영상 표시 정상
- [ ] 쇼츠 worker 장애가 사이트에 영향 없음
- [ ] Gmail 장애가 사이트에 영향 없음
- [ ] admin guard
- [ ] lint/typecheck/build/test
