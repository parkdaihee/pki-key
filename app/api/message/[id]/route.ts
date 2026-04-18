import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
  }

  const item = await prisma.secureMessage.findUnique({
    where: { id: params.id }
  });

  if (!item || item.receiverId !== session.user.id) {
    return NextResponse.json({ error: '메시지 없음' }, { status: 404 });
  }

  const senderCert = await prisma.certificate.findFirst({
    where: { userId: item.senderId, serialNumber: item.senderSerialNumber }
  });

  return NextResponse.json({ item, senderCertPem: senderCert?.certPem ?? null });
}
