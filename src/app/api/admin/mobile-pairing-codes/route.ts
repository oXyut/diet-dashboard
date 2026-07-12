import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createPairingCode, hashPairingCode, pairingCodeTtlMinutes } from '@/lib/mobileCredentials';
import { withAuth } from '@/lib/middleware/auth';

const requestSchema = z
  .object({
    ttlMinutes: z.number().int().min(1).max(60).optional(),
  })
  .optional();

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json().catch(() => undefined);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid pairing code request' }, { status: 400 });
  }

  const ttlMinutes = parsed.data?.ttlMinutes ?? pairingCodeTtlMinutes();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = createPairingCode();
    const codeHash = hashPairingCode(code);

    if (!codeHash) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
      await prisma.pairingCode.create({ data: { codeHash, expiresAt } });
      return NextResponse.json(
        { code, expiresAt: expiresAt.toISOString() },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    } catch (error) {
      // ハッシュ衝突時だけ再試行する。その他の DB エラーは隠蔽しない。
      if (attempt === 2) {
        console.error('Failed to create pairing code:', error);
      }
    }
  }

  return NextResponse.json({ error: 'Failed to create pairing code' }, { status: 500 });
});
