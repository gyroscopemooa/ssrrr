# 미정 · 커뮤니티 V3 통합

기존 커뮤니티에 자동수집, 쇼츠 제작 워커, Gmail 경제 게시판, 운영 대시보드를 통합한 프로젝트입니다.

- 최종 구현과 검증/대기 사항: [FINAL_IMPLEMENTATION_REPORT.md](FINAL_IMPLEMENTATION_REPORT.md)
- 설치·실행·운영: [docs/OPERATIONS_RUNBOOK.md](docs/OPERATIONS_RUNBOOK.md)
- 실제 결과: [test-results/summary.json](test-results/summary.json)
- 관리자: `/admin/automation` (관리자 계정 필요)

```sh
npm ci
npm run build
npm run db:migrate:local
npm start
```

긴 작업은 별도 프로세스에서 `npm run worker`로 실행합니다. 환경변수 이름은 `.env.example`에 있습니다. 실제 credential은 제공하지 않으며 Google 계정/도메인/상시 워커 연결은 별도 설정이 필요합니다.

```sh
npm run typecheck
npm run lint
npm test
npm run test:integration -- --render
npm run test:render
```

자동수집 소스는 검증 전 OFF이며 전체 자동 게시도 초기 정지 상태입니다. 외부 접근 차단은 우회하지 않습니다. 자세한 실제 상태는 최종 보고서를 확인하세요.
