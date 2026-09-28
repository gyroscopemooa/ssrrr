# Preview → 실제 도메인 전환

운영 기준: `SSRRR 스르륵` / `https://www.ssrrr.net` (canonical은 www 호스트).

개발단계:
- 내부링크 상대경로
- SITE_URL 하드코딩 금지
- SITE_NAME 중앙설정
- 자동작성자 author_id
- OAuth redirect 환경별 분리

적용 완료: SITE_URL/SITE_NAME 기본값과 배포 환경, canonical, sitemap, robots.txt, Web App Manifest, OpenGraph/X 카드 URL, 게시글 canonical, 동일-origin API 보호.

DNS 연결 후 확인: HTTPS 인증서, `www.ssrrr.net` 접속, 로그인 왕복, 첨부 업로드/Range, `robots.txt`, `sitemap.xml`, 공유 미리보기, Search Console 등록, 워커의 `WORKER_SITE_URL` 전환. apex `ssrrr.net`도 연결해 `https://www.ssrrr.net`으로 영구 리디렉션한다.
