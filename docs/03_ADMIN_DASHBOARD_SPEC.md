# 관리자 대시보드 통합 명세

## 자동수집
### 현황 카드
활성소스 / 오늘 스캔 / 신규 / 기존 / 중복 / 필터제외 / 후보 / 게시완료 / 실패 / 검토대기 / 다음스캔 / 게시예정종료

### 소스관리
name, adapter, URL, enabled, scan limit, daily limit, new-first, fallback, max age, prefix, comment limit, media flags, weights, interval, last success/error

### 후보풀
source, title, first_seen, last_seen, published_at, score, is_new, used, duplicate, filter, status

### 게시대기
scheduled_at, title, source, new/fallback, comments, media, score, preview, next candidate, publish now, exclude

## 쇼츠 제작소
후보 / 제작대기 / 생성완료 / 업로드 / 설정 / 성과

### 후보
checkbox, thumbnail, title, post stats, content type, estimated duration, shorts history, preview, create

### 생성 Drawer
콘텐츠 / 디자인 / 오디오 / 움직임 / 출력 / 업로드
고급설정은 접어서 숨김.

### 작업
job status, progress, current stage, start time, retry, cancel

### 완료
video player, duration, size, fps, audio mode, included posts, QC, regenerate, upload, reject

## 경제메일
연결상태 / 마지막 체크 / 신규 / 처리성공 / 검토대기 / 실패 / 허용sender / subject rule / private denylist
