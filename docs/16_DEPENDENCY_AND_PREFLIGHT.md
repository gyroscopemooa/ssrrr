# Dependency / Preflight

GUI는 설치 전 현재 package.json과 runtime을 먼저 확인.

## 가능 후보
- Remotion packages
- googleapis
- cheerio 또는 현재 HTML parser
- zod 또는 현재 validator
- 기존 queue package가 있으면 재사용

## 외부 binary
- ffmpeg
- ffprobe
- Chromium/Chrome (Remotion renderer 요구에 맞게)

## Preflight
- node version
- package manager
- ffmpeg -version
- ffprobe -version
- child_process 실행
- writable temp dir
- render worker에서 Chromium launch
- object storage write/read
- admin auth
- DB migration capability

serverless에서 장시간 렌더가 제한되면 렌더 worker를 별도 프로세스/서비스로 분리할 abstraction을 먼저 둔다.
