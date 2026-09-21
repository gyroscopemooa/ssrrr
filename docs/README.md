# 시크릿아지트 유머사이트 최종 통합 핸드오프 V3

이 패키지는 기존 V2 자동수집/경제게시판 명세에
사용자가 제공한 쇼츠 자동제작 핸드오프 자료를 통합한 최종 개발 패키지다.

## 사용법
GUI/코딩 에이전트에 ZIP 전체를 전달하고:
1. `99_GUI_START_MESSAGE.txt`
2. `00_MASTER_HANDOFF_PROMPT.md`
를 먼저 읽게 한다.

그 다음 나머지 문서/참고 코드를 모두 사용한다.

## 이번 V3 핵심
- 자동수집 전체 1페이지 스캔 + 신규 우선/fallback
- 관리자에서 소스/수량/시간/필터 조절
- 댓글 최대 5 / media 처리
- 19:00부터 3분 간격 게시
- 게시글 데이터를 그대로 재사용하는 쇼츠 제작소
- Remotion + FFmpeg/ffprobe 우선 구조
- QC/재시도/중복 쇼츠 방지
- YouTube private/schedule
- economy + dedicated Gmail + privacy fail-closed
- Preview URL 독립 + 실제 도메인 전환

## 코드 폴더
`code/reference/`는 빠른 구현을 위한 참고 scaffold다.
실제 프로젝트 구조/ORM/라우팅에 맞게 수정해서 사용한다.

## reference 폴더
- 사용자가 제공한 원본 쇼츠 핸드오프를 그대로 보존
- 이전 V2 자동수집 문서도 보존
