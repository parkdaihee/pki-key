import { auth } from '@/lib/auth';
import { SignInButton, SignOutButton } from '@/components/AuthButtons';

export default async function LoginPage() {
  const session = await auth();

  return (
    <div className="card">
      <h1>소셜 로그인</h1>
      {session?.user ? (
        <>
          <p>로그인됨: {session.user.email}</p>
          <SignOutButton />
        </>
      ) : (
        <SignInButton />
      )}
    </div>
  );
}
