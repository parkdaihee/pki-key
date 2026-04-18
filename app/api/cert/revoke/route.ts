import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
  }

  const cert = await prisma.certificate.findFirst({
    where: { userId: session.user.id, revoked: false },
    orderBy: { createdAt: 'desc' }
  });

  if (!cert) {
    return NextResponse.json({ error: '폐지할 인증서 없음' }, { status: 404 });
  }

  const updated = await prisma.certificate.update({
    where: { id: cert.id },
    data: { revoked: true }
  });

  return NextResponse.json({ success: true, cert: updated });
}
