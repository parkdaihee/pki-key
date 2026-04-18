import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { randomNonce } from '@/lib/crypto-server';

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'email 필요' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return NextResponse.json({ error: '사용자 없음' }, { status: 404 });
  }

  const cert = await prisma.certificate.findFirst({
    where: { userId: user.id, revoked: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' }
  });

  if (!cert) {
    return NextResponse.json({ error: '유효한 인증서가 없습니다.' }, { status: 404 });
  }

  const nonce = randomNonce(24);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 5);

  const challenge = await prisma.loginChallenge.create({
    data: {
      userId: user.id,
      nonce,
      expiresAt
    }
  });

  return NextResponse.json({
    challengeId: challenge.id,
    nonce,
    serialNumber: cert.serialNumber,
    certPem: cert.certPem
  });
}
