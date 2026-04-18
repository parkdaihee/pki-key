import './globals.css'
import Link from 'next/link'
import Providers from './providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='ko'>
      <body>
        <header className='header'>
          <nav className='nav'>
            <Link href='/'>홈</Link>
            <Link href='/login'>로그인</Link>
            <Link href='/certificate/issue'>인증서 발급</Link>
            <Link href='/certificate/me'>내 인증서</Link>
            <Link href='/sign-login'>전자서명 로그인</Link>
            <Link href='/messages/send'>전자봉투 보내기</Link>
            <Link href='/messages/inbox'>받은 메시지</Link>
          </nav>
        </header>
        <Providers>
          <main className='container'>{children}</main>
        </Providers>
      </body>
    </html>
  )
}
