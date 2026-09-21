# 소스별 수집 모드 검수 보고서

작성: 2026-09-21T22:09:12.919Z
기본 카탈로그 27개 중 11개 PASS. 실제 운영 DB의 사용자 수정 설정을 덮어쓰거나 ON으로 변경하지 않았습니다.

## 판정 기준

- AUTO 기본 필수: 제목, 원문 URL, 게시글 ID, 본문/요약, 이미지(사진 수집 ON). 상세의 이미지 본문도 본문으로 인정합니다.
- AUTO는 필수 데이터를 얻는 가장 적은 단계를 사용합니다. 선택 댓글·영상을 얻기 위한 추가 요청은 하지 않습니다.
- 첫 목록 페이지 전체를 파싱합니다. 상세/미디어 검사는 최대 5개 글에서, 글마다 최대 3개 미디어를 시도해 필요한 유형의 대표 1개를 확인합니다. 실제 수집은 설정한 글 수와 미디어 설정을 따릅니다.
- PASS는 해당 시점에 필수 항목을 함께 갖춘 실제 글이 확인됐다는 뜻이며 모든 글의 성공을 보장하지 않습니다. 게시 직전에도 필수 미디어를 검사합니다.
- 상세·댓글·미디어가 불필요한 모드에서는 해당 요청을 실행하지 않습니다.
- robots/403 등 접근 제한은 우회하지 않습니다. 목록으로 확보한 제목·링크 대안은 본문·이미지 PASS와 구분합니다.

| 사이트 | 판별 모드 | 목록 | 상세 | 댓글 | 미디어 | ON 가능 | 확보 필드 | 부족 필드 | 정확한 원인 |
|---|---|---:|---|---|---|---|---|---|---|
| 엠봉 | DETAIL_NO_COMMENTS | 성공 20 | 사용 | 사용 안 함 | 사용 | 가능 | title, sourceUrl, sourcePostId, body, image | - | - |
| 개드립 | DETAIL_NO_COMMENTS | 성공 23 | 사용 | 사용 안 함 | 사용 | 가능 | recommends, title, sourceUrl, sourcePostId, body, image | - | - |
| 더쿠 | DETAIL_NO_COMMENTS | 성공 20 | 사용 | 사용 안 함 | 사용 | 가능 | views, title, sourceUrl, sourcePostId, createdAt, body, image | - | - |
| 루리웹 | DETAIL_NO_COMMENTS | 성공 28 | 사용 | 사용 안 함 | 사용 | 가능 | views, recommends, title, sourceUrl, sourcePostId, body, image | - | - |
| 인벤 | DETAIL_NO_COMMENTS | 성공 50 | 사용 | 사용 안 함 | 사용 | 가능 | views, recommends, title, sourceUrl, sourcePostId, body, image | - | - |
| 막갤 | DETAIL_NO_COMMENTS | 성공 49 | 사용 | 사용 안 함 | 사용 | 가능 | views, recommends, title, sourceUrl, sourcePostId, createdAt, author, body, image | - | - |
| 코갤 | DETAIL_NO_COMMENTS | 성공 50 | 사용 | 사용 안 함 | 사용 | 가능 | views, recommends, title, sourceUrl, sourcePostId, createdAt, author, body, image | - | - |
| 우울갤 | DETAIL_NO_COMMENTS | 성공 50 | 사용 | 사용 안 함 | 사용 | 가능 | views, recommends, title, sourceUrl, sourcePostId, createdAt, author, body, image | - | - |
| 롤갤 | DETAIL_NO_COMMENTS | 성공 49 | 사용 | 사용 안 함 | 사용 | 가능 | views, recommends, title, sourceUrl, sourcePostId, createdAt, author, body, image | - | - |
| 웃긴대학 | DETAIL_NO_COMMENTS | 성공 50 | 사용 | 사용 안 함 | 사용 | 가능 | views, recommends, title, sourceUrl, sourcePostId, createdAt, body, image | - | - |
| 개집넷 | DETAIL_NO_COMMENTS | 성공 20 | 사용 | 사용 안 함 | 사용 | 불가 | views, recommends, title, sourceUrl, sourcePostId, createdAt, body | image | REQUIRED_FIELDS_MISSING: image; REQUIRED_FIELDS_MISSING: body, image; BLOCKED: robots.txt / |
| 오늘의유머 | DETAIL_NO_COMMENTS | 성공 30 | 사용 | 사용 안 함 | 사용 | 불가 | views, recommends, title, sourceUrl, sourcePostId, body | image | REQUIRED_FIELDS_MISSING: body, image; REQUIRED_FIELDS_MISSING: image; BLOCKED: robots.txt / |
| 아카라이브 | DETAIL_NO_COMMENTS | 성공 45 | 사용 | 사용 안 함 | 사용 | 불가 | views, recommends, title, sourceUrl, sourcePostId, createdAt, body | image | REQUIRED_FIELDS_MISSING: image; REQUIRED_FIELDS_MISSING: body, image; BLOCKED: HTTP 403 |
| 야갤 | DETAIL_NO_COMMENTS | 성공 49 | 사용 | 사용 안 함 | 사용 | 불가 | views, recommends, title, sourceUrl, sourcePostId, createdAt, author, body | image | REQUIRED_FIELDS_MISSING: image; REQUIRED_FIELDS_MISSING: body, image; BLOCKED: HTTP 403 |
| 치지직 | DETAIL_NO_COMMENTS | 성공 50 | 사용 | 사용 안 함 | 사용 | 불가 | views, recommends, title, sourceUrl, sourcePostId, createdAt, author, body | image | REQUIRED_FIELDS_MISSING: image; REQUIRED_FIELDS_MISSING: body, image; BLOCKED: HTTP 403 |
| 싱글벙글 | DETAIL_NO_COMMENTS | 성공 50 | 사용 | 사용 안 함 | 사용 | 불가 | views, recommends, title, sourceUrl, sourcePostId, createdAt, author, body | image | REQUIRED_FIELDS_MISSING: image; REQUIRED_FIELDS_MISSING: body, image; BLOCKED: HTTP 403 |
| FM코리아 | DETAIL_NO_COMMENTS | 성공 24 | 사용 | 사용 안 함 | 사용 | 불가 | recommends, title, sourceUrl, sourcePostId, author | body, image | BLOCKED: robots.txt / |
| 보배드림 | AUTO | 실패 0 | 판별 전 | 판별 전 | 판별 전 | 불가 | - | title, sourceUrl, sourcePostId, body, image | HTTP 406 |
| 뽐뿌 | AUTO | 실패 0 | 판별 전 | 판별 전 | 판별 전 | 불가 | - | title, sourceUrl, sourcePostId, body, image | BLOCKED: HTTP 403 |
| 인스티즈 | DETAIL_NO_COMMENTS | 성공 35 | 사용 | 사용 안 함 | 사용 | 가능 | views, recommends, title, sourceUrl, sourcePostId, body, image | - | - |
| 클리앙 | AUTO | 실패 0 | 판별 전 | 판별 전 | 판별 전 | 불가 | - | title, sourceUrl, sourcePostId, body, image | BLOCKED: robots.txt /service/recommend |
| 와이고수 | DETAIL_NO_COMMENTS | 성공 27 | 사용 | 사용 안 함 | 사용 | 불가 | title, sourceUrl, sourcePostId | body, image | BLOCKED: robots.txt /*?*list_context= |
| MLBPARK | AUTO | 실패 0 | 판별 전 | 판별 전 | 판별 전 | 불가 | - | title, sourceUrl, sourcePostId, body, image | BLOCKED: robots.txt / |
| 이토랜드 | AUTO | 실패 0 | 판별 전 | 판별 전 | 판별 전 | 불가 | - | title, sourceUrl, sourcePostId, body, image | UNSAFE_REDIRECT: HTTPS to HTTP |
| 인방갤 | AUTO | 실패 0 | 판별 전 | 판별 전 | 판별 전 | 불가 | - | title, sourceUrl, sourcePostId, body, image | BLOCKED: robots.txt /board/lists/?id=ib_new |
| 해축갤 | DETAIL_NO_COMMENTS | 성공 49 | 사용 | 사용 안 함 | 사용 | 불가 | views, recommends, title, sourceUrl, sourcePostId, createdAt, author, body | image | REQUIRED_FIELDS_MISSING: body, image; REQUIRED_FIELDS_MISSING: image; BLOCKED: HTTP 403 |
| 주갤 | DETAIL_NO_COMMENTS | 성공 50 | 사용 | 사용 안 함 | 사용 | 불가 | views, recommends, title, sourceUrl, sourcePostId, createdAt, author, body | image | REQUIRED_FIELDS_MISSING: image; BLOCKED: HTTP 403 |

## 사용 방법

관리자 → 가져올 사이트 → 수집 조건 변경 → 수집 방식 / 반드시 필요한 데이터 → 저장 → 수집 테스트 → 통과 후 켜기. 검사 결과에 판별 모드와 단계별 상태가 표시됩니다. 기본 규칙이 필요한 기존 소스는 기본값 적용 후 검사하세요. 이 작업은 기존 사용자 설정을 자동 초기화하지 않습니다.

## 호환성과 변경 사항

- 기존 JSON 설정에 필드를 추가했으므로 DB migration과 신규 환경변수/dependency는 없습니다. 기존 정상 v2 검증은 기존 설정에 한해 호환됩니다.
- 실제 검사 결과의 resolvedMode를 config JSON에 저장합니다. AUTO는 다음 수집에서도 목록 구조를 다시 판단합니다.
- 설정 변경 시 검증이 무효화되고 OFF가 됩니다. 과거 후보는 정책 식별자가 맞지 않으면 예약/게시하지 않으며 다시 수집해야 합니다.
- 목록형 결과는 원문 링크를 함께 게시합니다. 링크 모음 모드는 상세 요청 없이 목록 요약을 최대 500자로 제한합니다.
- DC 이미지가 application/octet-stream으로 제공돼도 실제 이미지 바이트를 확인하여 처리합니다. HTML 오류 페이지를 이미지로 인정하지 않습니다.

## 한계 및 후속 작업

- 검사 실패 소스는 ON 불가입니다. 본문/이미지가 필수이면 이를 빼서 통과 수를 부풀리지 않습니다.
- 목록 제목·링크가 확보된 소스는 원문 링크 모음 운영을 별도로 선택할 수 있습니다. 필수를 제목·URL·ID로 변경하고 다시 검사해야 합니다.
- 해축갤·주갤은 간헐적으로 빈 응답이 있었으나 재검사에서 목록을 읽었습니다. 현재 결과의 이미지 접근 제한을 확인하세요. 빈 응답은 주소 폐쇄나 선택자 오류로 단정하지 않습니다.
- 외부 서버의 응답/게시물/만료 이미지 링크는 변할 수 있으므로 운영 화면에서 자신의 저장된 설정으로 재검사해야 합니다.
- 실제 요청 URL 및 글별 필드/실패 기록은 test-results/live-sources.json, 요약은 test-results/source-modes.json에 있습니다.

## 후속 복구 검사

미통과 17개를 재검사했습니다. 이번 검사에서 추가 PASS는 없으며 총 10개 PASS입니다. 미디어 403은 해당 파일에만 적용하고 같은 URL은 재요청하지 않습니다. 429는 서버 단위로 요청을 중단합니다. 빈 HTML은 EMPTY_RESPONSE, HTTPS→HTTP 이동은 UNSAFE_REDIRECT로 구분하여 관리자 화면에 조치를 안내합니다. 이토랜드의 HTTPS 주소와 robots.txt가 HTTP로 이동함을 확인했으며 보안 검사는 유지했습니다.

후속 검증: 단위 테스트 32/32 PASS, 변경 범위 lint 오류·경고 0개, typecheck PASS, build PASS, API integration PASS. 기존 DB와 사용자 설정은 변경하지 않았습니다.
