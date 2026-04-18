export default function HomePage() {
  return (
    <div className='card'>
      <h1>PKI 웹 서비스 데모</h1>
      <ol>
        <li>소셜 로그인</li>
        <li>클라이언트 키쌍 생성 + 서버 인증서 발급</li>
        <li>전자서명 로그인</li>
        <li>전자봉투 송수신</li>
        <li>인증서 조회/폐지</li>
      </ol>
      <p className='muted'>주의: 전자서명 로그인은 검증 API까지만 구현</p>
    </div>
  )
}
