import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
  }

  const cert = await prisma.certificate.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({ cert });
}
