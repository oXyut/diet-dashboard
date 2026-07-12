import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  createDeviceToken,
  hashDeviceToken,
  hashPairingCode,
  normalizePairingCode,
} from '@/lib/mobileCredentials';

const requestSchema = z.object({
  code: z.string().min(1).max(64),
  deviceName: z.string().trim().min(1).max(100),
});

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid pairing request' }, { status: 400 });
  }

  const codeHash = hashPairingCode(normalizePairingCode(parsed.data.code));
  const token = createDeviceToken();
  const tokenHash = hashDeviceToken(token);

  if (!codeHash || !tokenHash) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const paired = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const pairingCode = await tx.pairingCode.findUnique({ where: { codeHash } });

    if (!pairingCode || pairingCode.usedAt || pairingCode.expiresAt <= now) {
      return null;
    }

    const claimed = await tx.pairingCode.updateMany({
      where: { id: pairingCode.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });

    if (claimed.count !== 1) {
      return null;
    }

    const device = await tx.mobileDevice.create({
      data: { name: parsed.data.deviceName, tokenHash },
      select: { id: true, name: true, createdAt: true },
    });

    await tx.pairingCode.update({
      where: { id: pairingCode.id },
      data: { deviceId: device.id },
    });

    return device;
  });

  if (!paired) {
    return NextResponse.json({ error: 'Invalid or expired pairing code' }, { status: 401 });
  }

  return NextResponse.json(
    {
      deviceToken: token,
      device: { id: paired.id, name: paired.name, createdAt: paired.createdAt.toISOString() },
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
