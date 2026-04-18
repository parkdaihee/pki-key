import { NextResponse } from 'next/server';
import { createSelfSignedCa } from '@/lib/ca';

export async function POST() {
  const result = createSelfSignedCa();
  return NextResponse.json({
    message: '생성 완료. 아래 값을 .env.local 에 넣고 서버를 재시작하세요.',
    ...result
  });
}
