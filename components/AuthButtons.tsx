'use client';

import { signIn, signOut } from 'next-auth/react';

export function SignInButton() {
  return <button onClick={() => signIn('google')}>Google 로그인</button>;
}

export function SignOutButton() {
  return <button onClick={() => signOut()}>로그아웃</button>;
}
