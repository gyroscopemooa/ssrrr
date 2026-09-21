# 렌더 엔진 상세 설계

## 1. 기본 출력

- 1080 x 1920
- 30fps
- H.264 MP4
- AAC audio

## 2. 기본 화면 구조

상단 브랜드 영역
- 로고
- 시크릿아지트

중앙 콘텐츠 safe zone
- 제목
- 본문
- 이미지/GIF/영상
- 댓글

하단 브랜드/CTA 영역
- 사이트명 또는 CTA

우측 Shorts UI에 가려질 수 있는 영역은 중요 정보 배치 금지.

## 3. 장면 모델

예시 Scene 타입:
- intro
- post_title
- post_body_scroll
- image_hold
- gif_play
- video_play
- comments
- transition
- outro

각 scene:
- type
- durationFrames
- payload
- transition
- audioPolicy

## 4. 예상 읽기시간

정확한 수치는 운영 데이터로 조정하되 초기값 예:

- 제목 최소 1.2~1.8초
- 본문: 한국어 문자수/줄수 기반
- 이미지: 1.5~3초
- 핵심문장: +0.8~1.5초
- 댓글: 댓글 길이에 따라 1.5~3초

단순 px/s 하나로만 계산하지 말고 `읽기시간 -> 필요한 스크롤 거리 -> 평균속도`로 역산.

## 5. 스크롤

- easeInOut 적용
- 시작/끝 감속
- 이미지 중앙 정지
- 펀치라인/마지막 문장 정지
- 다음 콘텐츠 전환 전 0.3~0.7초 여백

## 6. 짧은 글 조합

예상 길이가 minDuration 미만이면:

1. best comments 추가
2. 여전히 짧으면 next eligible post 탐색
3. maxPostsPerShort까지 추가
4. 그래도 짧으면 그대로 생성하되 QC warning

## 7. 긴 글

- 목표길이에 맞춰 약간 빠르게
- 너무 빠른 읽기 속도는 금지
- maxDuration 초과 시 split suggestion
- 자동 분할 활성화 시 part 1/2 생성 가능

## 8. 오디오 정책

### 텍스트/이미지
BGM ON(default)

### GIF
BGM ON(default)

### 영상 + 오디오 있음
기본 BGM OFF

### 영상 + 무음
BGM ON

### duck mode
원본 음성 구간에서 BGM gain 낮춤

## 9. 브랜드 일관성

- 배경 기본 고정
- 로고 위치 고정
- 폰트 고정
- 전환 효과 종류 제한
- 과도한 애니메이션 금지

## 10. 렌더 입력 JSON 예시

```json
{
  "jobId": "...",
  "brand": {
    "name": "시크릿아지트",
    "background": "/shorts/bg/default.png",
    "logo": "/shorts/logo/main.png"
  },
  "audio": {
    "bgmEnabled": true,
    "bgm": "/shorts/music/main.mp3",
    "bgmVolume": 0.12,
    "videoAudioPolicy": "off"
  },
  "scenes": []
}
```
