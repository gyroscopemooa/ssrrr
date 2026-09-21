# 제품 요구사항 명세서(PRD)

## 1. 기능명
시크릿아지트 쇼츠 제작소

## 2. 사용자
- 관리자
- 운영자
- 향후 편집 권한을 가진 콘텐츠 매니저

## 3. 핵심 시나리오

### 시나리오 A: 일반 텍스트 유머글
1. 관리자가 글 선택
2. 예상 길이 34초
3. 기본 시크릿아지트 배경 사용
4. 기본 BGM ON
5. 자동 스크롤
6. 마지막 CTA
7. 렌더/QC
8. 미리보기
9. YouTube 예약 업로드

### 시나리오 B: 너무 짧은 글
1. 예상 길이 11초
2. 최소길이 25초 미만 판정
3. 베스트댓글 추가 시 18초
4. 여전히 짧음
5. 다음 후보글 1개 추가
6. 총 37초
7. 두 글 사이 전환카드 삽입

### 시나리오 C: 영상 포함글
1. 게시글 안 video asset 감지
2. 음성 track 존재 여부 분석
3. 음성 있음 → BGM 기본 OFF
4. 원본 영상 재생 구간에서는 스크롤 멈춤
5. 영상 종료 후 본문/댓글 계속

### 시나리오 D: 관리자 override
- 이번 영상만 다른 배경
- 음악 OFF
- 스크롤 느리게
- 댓글 미포함
- 45초 목표

## 4. 전역 기본설정

- 기본 배경
- 기본 BGM 파일
- BGM ON/OFF
- BGM volume
- original audio volume
- video content BGM policy: off / duck / keep
- default target duration
- min duration
- max duration
- max posts per short
- include best comments
- max comments
- intro enabled
- outro enabled
- watermark enabled
- CTA enabled
- default publish privacy
- default schedule times
- effects level

## 5. 자동 조합 규칙

권장 기본값:

- 최소 목표: 25초
- 선호 구간: 30~55초
- 긴 콘텐츠 기준: 70초 이상 예상
- 한 쇼츠 최대 게시글: 2개
- 베스트댓글 최대: 3개

자동 보강 우선순위 기본값:

1. 본문
2. 베스트댓글
3. 다음 후보글
4. 다음 글 베스트댓글

관리자에서 우선순위 변경 가능.

## 6. 쇼츠 후보 적합도

향후 자동 후보선정용 점수 예시:

- 최신성
- 추천수
- 댓글수
- 조회수
- 이미지/영상 유무
- 이미 쇼츠 제작됐는지
- 너무 긴 글인지
- 금칙어/민감 콘텐츠 여부
- 출처 상태

점수는 독립 모듈로 두고 추후 수정 가능하게 합니다.

## 7. 상태 머신

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

모든 상태 전환 시간과 오류 메시지를 기록합니다.

## 8. 실패 복구

- 렌더 실패: 최대 N회 retry
- QC 실패: 원인별 자동 수정 후 1회 재렌더
- 업로드 실패: 렌더 결과는 보존, 업로드만 retry
- BGM 파일 누락: 음악 없이 렌더 + 경고
- 이미지 누락: placeholder 대신 해당 미디어 구간 skip + 경고

## 9. 중복방지

단일 게시글은 기본적으로 한 번만 자동 후보에 노출.

다음 경우 예외:
- 운영자 수동 재생성
- 이전 쇼츠 failed/rejected
- 플랫폼별 별도 렌더
- A/B 실험 버전

## 10. 향후 확장

- TikTok/Reels 별도 출력
- 자동 썸네일
- 자막/나레이션
- TTS
- 성과 기반 자동 템플릿 추천
- 자동 예약 슬롯 배치
- 다채널 운영
