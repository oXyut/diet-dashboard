import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';

type RouteContext = { params: { id: string } };

export const DELETE = withAuth(async (_request: NextRequest, context: RouteContext) => {
  const result = await prisma.mobileDevice.updateMany({
    where: { id: context.params.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: 'Active device not found' }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
});
