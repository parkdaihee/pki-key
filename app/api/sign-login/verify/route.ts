import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySignature } from '@/lib/crypto-server';
import { verifyCertWithCa } from '@/lib/ca';
import { z } from 'zod';

const schema = z.object({
  challengeId: z.string(),
  signatureBase64: z.string(),
  certPem: z.string()
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });
  }

  const challenge = await prisma.loginChallenge.findUnique({ where: { id: parsed.data.challengeId } });
  if (!challenge || challenge.used || challenge.expiresAt < new Date()) {
    return NextResponse.json({ error: 'challenge 가 유효하지 않습니다.' }, { status: 400 });
  }

  const cert = await prisma.certificate.findFirst({
    where: { userId: challenge.userId, certPem: parsed.data.certPem, revoked: false }
  });
  if (!cert) {
    return NextResponse.json({ error: '인증서 미등록' }, { status: 404 });
  }

  if (!verifyCertWithCa(cert.certPem)) {
    return NextResponse.json({ error: 'CA 검증 실패' }, { status: 400 });
  }

  const verified = verifySignature({
    message: challenge.nonce,
    signatureBase64: parsed.data.signatureBase64,
    certPem: cert.certPem
  });

  if (!verified) {
    return NextResponse.json({ error: '서명 검증 실패' }, { status: 401 });
  }

  await prisma.loginChallenge.update({ where: { id: challenge.id }, data: { used: true } });

  return NextResponse.json({
    success: true,
    message: '전자서명 검증 성공',
    loginHint: '실제 제출에서는 여기서 세션 쿠키를 발급하거나 auth 시스템과 연결하면 됩니다.'
  });
}
