import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
  receiverId: z.string(),
  encryptedMessageHex: z.string(),
  encryptedSessionKeyHex: z.string(),
  ivHex: z.string(),
  senderSerialNumber: z.string()
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });
  }

  const senderCert = await prisma.certificate.findFirst({
    where: { userId: session.user.id, serialNumber: parsed.data.senderSerialNumber, revoked: false }
  });

  if (!senderCert) {
    return NextResponse.json({ error: '송신자 인증서 없음' }, { status: 404 });
  }

  const saved = await prisma.secureMessage.create({
    data: {
      senderId: session.user.id,
      receiverId: parsed.data.receiverId,
      senderCertificateId: senderCert.id,
      encryptedMessageHex: parsed.data.encryptedMessageHex,
      encryptedSessionKeyHex: parsed.data.encryptedSessionKeyHex,
      ivHex: parsed.data.ivHex,
      senderSerialNumber: parsed.data.senderSerialNumber
    }
  });

  return NextResponse.json({ success: true, messageId: saved.id });
}
