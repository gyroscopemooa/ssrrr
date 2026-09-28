# ChatGPT 작업 알림 VM 릴레이

메일 본문은 미리보기라 잘릴 수 있으므로 VM의 전용 Edge 프로필이 `View message` 링크를 열고 ChatGPT 대화의 마지막 전체 답변을 읽는다. 새 모델 호출이나 OpenAI API 요청은 하지 않는다. 읽은 원문은 기존 Gmail 작업 경로를 통해 경제 원고 검수함으로 전달한다.

## 최초 설정

프로젝트 폴더에서 다음을 실행한다.

```powershell
npm install
npm run chatgpt:login
./scripts/chatgpt-relay-windows.ps1 -Enable
npm run worker:windows:start
```

`chatgpt:login`이 연 전용 Edge 창에서 사용자가 직접 로그인한다. 자동화는 비밀번호, 패스키, MFA를 입력하거나 저장하지 않는다. 일반 Edge 프로필이 아닌 `.worker-runtime/chatgpt-profile`만 자동화가 재사용한다.

## 실제 링크 단독 시험

```powershell
npm run chatgpt:test -- "https://chatgpt.com/c/실제-대화-ID"
```

성공 시 원문 전체를 콘솔에 노출하지 않고 첫 줄, 글자 수, 160자 미리보기만 출력한다. 첫 줄이 정확히 `SSRRR_ECONOMY`가 아니면 사이트로 보내지 않는다.

## 로그인 만료 처리

로그인 화면이 감지되면 다음 동작을 한 번만 수행한다.

1. Windows에 `ChatGPT 재로그인 필요` 메시지를 띄운다.
2. 사이트 관리자 `처리 결과·오류`에 `BLOCKED: CHATGPT_LOGIN_REQUIRED`를 남긴다.
3. `.worker-runtime/chatgpt-login-required.json` 표시 파일을 만든다.
4. ChatGPT 릴레이만 멈추고 유머 수집·쇼츠 등 다른 worker 기능은 계속 실행한다.
5. 로그인 필요 상태가 유지되는 동안 새 Gmail 확인 작업을 만들지 않는다.

재개는 아래 명령으로 전용 창에 직접 로그인하면 된다. 로그인이 확인되면 표시 파일이 삭제되고 다음 Gmail 확인 주기부터 자동 재개된다.

```powershell
npm run chatgpt:login
```

릴레이만 끄려면 다음을 실행한 뒤 worker를 재시작한다.

```powershell
./scripts/chatgpt-relay-windows.ps1 -Disable
npm run worker:windows:stop
npm run worker:windows:start
```

## 보안 제한

- 이메일에서 추출한 링크 중 `https://chatgpt.com/` 직속 링크만 연다.
- 외부 추적·단축 URL은 따라가지 않는다.
- 가져온 전체 원고는 자동 공개하지 않고 항상 관리자 검수함에 둔다.
- 사이트 전송 전 첫 줄과 최대 본문 길이를 검사한다.
- 브라우저 프로필과 로그인 상태 파일은 Git에 포함하지 않는다.
