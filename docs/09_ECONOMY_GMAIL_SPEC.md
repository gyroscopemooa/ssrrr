# 경제게시판 + Gmail 자동게시

흐름:
ChatGPT 알림 → 개인 Gmail → 특정 알림만 필터/자동전달 → 전용 빈 Gmail → 사이트 Gmail Ingest → 개인정보 검사 → economy 게시판.

사이트는 개인 Gmail 전체를 읽지 않는다.

처리조건:
- 허용 sender
- 허용 subject
- AUTO_POST label
- 미처리 상태
- Message-ID 중복 없음
- content_hash 중복 없음

파싱 제거:
tracking, 버튼, footer, 반복서명, quoted reply.

개인정보:
이메일, 전화, 주민번호형, 카드번호형, 계좌형, API key/token, 주소형 패턴, 사용자 지정 실명/개인이메일/전화/닉네임/금지문자열.

하나라도 잡히면 review_required.
검수 오류면 자동게시 금지.

기본 polling 3분.
