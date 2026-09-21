# YouTube 업로드 연동 명세

## 목표
렌더 완료 영상을 관리자 승인 후 YouTube에 업로드.

## 지원 모드
- 파일만 생성
- private 업로드
- unlisted 업로드
- public 업로드
- 예약 공개

## 기본 권장
처음에는 `private` 또는 예약 공개를 기본값으로 하고 운영자가 검토 후 공개.

## OAuth
- Google OAuth로 채널 연결
- refresh token 서버 저장
- token은 클라이언트 노출 금지

## 저장해야 할 값
- channel identifier
- youtube_video_id
- upload status
- privacy
- scheduled time
- title
- description
- tags
- created/published timestamp

## 제목 템플릿
예시:
`{postTitle} #shorts`

## 설명 템플릿
예시:
`시크릿아지트에서 더 보기\n{postUrl}\n\n#유머 #웃긴글 #shorts`

## 업로드 실패
- 영상 파일은 삭제하지 않음
- publication row만 failed
- retry 가능

## API quota 고려
- polling 최소화
- 성과 동기화는 일정 주기 batch

## 중요
실제 운영 전 Google API 정책/앱 검수/업로드 공개 제한 여부를 현재 시점 기준 공식 문서로 다시 확인하세요.
