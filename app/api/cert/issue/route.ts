import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { issueUserCertificate } from '@/lib/ca';
import { z } from 'zod';

const bodySchema = z.object({
  publicKeyPem: z.string().min(1)
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });
  }

  const existing = await prisma.certificate.findFirst({
    where: { userId: session.user.id, revoked: false },
    orderBy: { createdAt: 'desc' }
  });

  if (existing) {
    return NextResponse.json({ error: '이미 유효한 인증서가 있습니다.' }, { status: 409 });
  }

  const issued = issueUserCertificate(parsed.data.publicKeyPem, session.user.email);

  const certificate = await prisma.certificate.create({
    data: {
      userId: session.user.id,
      serialNumber: issued.serialNumber,
      subjectCn: session.user.email,
      publicKeyPem: parsed.data.publicKeyPem,
      certPem: issued.certPem,
      issuedAt: issued.issuedAt,
      expiresAt: issued.expiresAt
    }
  });

  return NextResponse.json({
    id: certificate.id,
    serialNumber: certificate.serialNumber,
    certPem: certificate.certPem,
    issuedAt: certificate.issuedAt,
    expiresAt: certificate.expiresAt
  });
}
