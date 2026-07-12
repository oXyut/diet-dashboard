import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';

export const GET = withAuth(async () => {
  const devices = await prisma.mobileDevice.findMany({
    select: { id: true, name: true, createdAt: true, lastUsedAt: true, revokedAt: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    devices: devices.map((device) => ({
      ...device,
      createdAt: device.createdAt.toISOString(),
      lastUsedAt: device.lastUsedAt?.toISOString() ?? null,
      revokedAt: device.revokedAt?.toISOString() ?? null,
    })),
  });
});
