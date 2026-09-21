# Source Adapter 가이드

## 공통 인터페이스
```ts
export interface SourceAdapter {
  scanList(source: AutoSource): Promise<SourceListItem[]>;
  loadDetail(item: SourceListItem, source: AutoSource): Promise<SourceDetail>;
}
```

## GenericHtmlAdapter
관리자 selector config를 이용해 일반 HTML 목록/상세 페이지 지원.

지원 config 예:
- listItemSelector
- titleSelector
- linkSelector
- dateSelector
- viewsSelector
- likesSelector
- commentsCountSelector
- bodySelector
- mediaSelector
- commentSelector

## DcinsideAdapter
공통 adapter 하나에 gallery url/id config.
개념글/추천글 목록 모드.
Prefix는 source config.

## 처리 실패
selector mismatch:
- source만 failed
- last_error 기록
- 사이트 전체 작업 중단 금지

로그인/CAPTCHA/봇차단:
- BLOCKED
- 우회 금지
