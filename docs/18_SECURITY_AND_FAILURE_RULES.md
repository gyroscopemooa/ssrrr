# 보안 / 장애격리 / Idempotency

- admin route server-side guard
- secrets client bundle 노출 금지
- OAuth refresh token 암호화/secret store 우선
- FFmpeg exec는 `execFile`/고정 args 방식 우선
- 사용자 입력을 shell command string에 직접 연결 금지
- media path traversal 방지
- external media fetch는 allowlist/validation 또는 기존 storage 경유
- render temp dir cleanup
- job idempotency key 고려
- retry 시 동일 output 중복 생성 금지
- mail Message-ID/content hash idempotency
- auto-post job 중복 실행 방지 lock/unique constraint
- worker 죽어도 일반 사이트 정상
- emergency pause
