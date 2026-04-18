# PKI WebApp Demo

강의자료의 흐름을 따라 만든 과제용 최소 골격이다.

## 구현 범위
- Google 소셜 로그인
- 클라이언트 RSA 키쌍 생성
- 서버 CA 인증서 발급 및 DB 저장
- challenge 기반 전자서명 검증
- 전자봉투 송수신
- 인증서 조회/폐지

## 실행 순서
1. `npm install`
2. MongoDB 준비 후 `.env.local` 작성
3. `npx prisma db push`
4. `npm run dev`
5. `POST /api/ca-setup` 호출해서 루트 CA 생성
6. 응답으로 나온 `certPem`, `privateKeyPem`을 `.env.local`의 `CA_CERT_PEM`, `CA_PRIVATE_KEY_PEM`에 넣고 서버 재시작
7. Google 로그인 -> 인증서 발급 -> 전자서명 로그인 -> 전자봉투 전송 순서로 테스트

## 주의
- 이 코드는 과제용 데모 골격이다.
- `전자서명 로그인`은 서명 검증까지만 구현했다. 완전한 로그인으로 만들려면 verify 성공 시 세션 발급을 추가해야 한다.
- 개인키를 localStorage에 저장하므로 실서비스 보안 수준은 아니다.
"# pki-key" 
