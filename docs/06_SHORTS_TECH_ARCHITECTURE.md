# 기술 아키텍처

## 권장 구성

- 기존 Web/App: 현재 프로젝트 유지
- Shorts Admin UI: 기존 관리자 영역에 추가
- Composition Engine: Remotion
- Final Encoding / Audio / Probe: FFmpeg + ffprobe
- Background Jobs: 현재 프로젝트에 queue가 있으면 재사용, 없으면 인터페이스부터 분리
- Storage: 기존 object storage 또는 서버 파일 저장소
- DB: 기존 DB에 shorts 관련 테이블 추가

## 처리 흐름

Admin UI
  -> POST /api/admin/shorts/jobs
  -> DB short_job created
  -> Worker picks job
  -> Analyzer
  -> Scene planner
  -> Remotion render
  -> FFmpeg finalization
  -> QC
  -> Store output
  -> ready
  -> Optional YouTube upload

## 모듈 경계

`shorts/analyzer`
- 글 내용 정규화
- media asset 분류
- 예상 읽기시간
- 영상 오디오 존재여부

`shorts/planner`
- 게시글 조합
- 댓글 보강
- 장면 타임라인 생성

`shorts/render`
- Remotion input props 생성
- renderMedia 호출

`shorts/audio`
- BGM 선택
- ducking policy
- FFmpeg audio normalize

`shorts/qc`
- duration
- resolution
- audio stream
- black frame/basic checks
- scene completion metadata

`shorts/youtube`
- OAuth
- upload
- schedule
- video metadata
- status sync

## 운영 주의사항

- 렌더용 Chromium/FFmpeg가 배포환경에서 실행 가능한지 확인
- serverless 제한이 강하면 별도 worker 서비스 권장
- API 요청에서 렌더 완료까지 기다리지 말고 job ID 즉시 반환
- 렌더 중간 산출물은 temp 디렉터리 사용 후 정리
- 최종 MP4는 영구 저장소에 업로드

## 보안

- YouTube refresh token 서버 전용 저장
- admin-only route
- 로컬 파일 path를 사용자 입력으로 직접 받지 않기
- 미디어 URL allowlist 또는 기존 storage 경유
- FFmpeg shell command injection 방지
