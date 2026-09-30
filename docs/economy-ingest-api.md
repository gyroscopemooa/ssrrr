# 경제 원고 수신 API

## ChatGPT 예약 작업용 MCP 도구

배포된 사이트의 `/mcp` 엔드포인트는 ChatGPT에 연결된 SSRRR 관리자만 사용할 수 있다. `submit_economy_report`는 전체 경제 알림을 개인정보 검사 후 경제 게시판에 즉시 게시한다. 개인정보 검사에 걸린 원고만 관리자 검토 대기에 저장한다. 본문 첫 줄은 반드시 `SSRRR_ECONOMY`여야 하며, 같은 본문은 SHA-256 기반 키로 중복 방지된다. 이 경로에는 `WORKER_TOKEN`이나 OpenAI 개발자 API 키를 입력하지 않는다.

예약 작업에 추가할 정확한 지시문은 [economy-scheduled-task-addon.md](./economy-scheduled-task-addon.md)를 참고한다.

사이트 전용 경제 원고 수신 주소는 `POST /api/ingest/economy`입니다. ChatGPT의 작업 알림 메일을 거치지 않으므로 전체 본문을 그대로 받을 수 있습니다.

## 인증

기존 사이트 작업자와 같은 `WORKER_TOKEN`을 Bearer 토큰으로 사용합니다.

```http
Authorization: Bearer <WORKER_TOKEN>
Content-Type: application/json
```

## 요청

```json
{
  "idempotencyKey": "portfolio-2026-09-28-roboteknik",
  "title": "RoboTechnik 홍콩 상장 확정과 실리콘포토닉스 투자 포인트",
  "body": "전체 원고 본문",
  "mode": "review"
}
```

- `idempotencyKey`: 실행마다 고유한 8~200자 키입니다. 같은 키나 같은 본문을 다시 보내도 중복 게시되지 않습니다.
- `title`: 1~120자입니다.
- `body`: 1~30,000자입니다.
- `mode`: 기본값은 `review`이며 운영 관리의 **경제 원고**에서 승인합니다. `publish`는 개인정보 검사 통과 시 즉시 경제속보에 게시합니다.
- `receivedAt`: 선택 항목이며 밀리초 단위 Unix 시각입니다.

## 응답

새 원고는 HTTP 201과 함께 `review_required` 또는 `published` 상태를 반환합니다. 중복 원고는 HTTP 200과 `duplicate: true`를 반환합니다.
