import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatHealthData } from '@/lib/formatters';
import { withAuth } from '@/lib/middleware/auth';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_LIMIT = 180;
const MAX_LIMIT = 365;

function parseDate(value: string | null, name: string): Date | null {
  if (value == null) return null;
  if (!DATE_PATTERN.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))) {
    throw new Error(`${name} must be YYYY-MM-DD`);
  }
  return new Date(`${value}T00:00:00.000Z`);
}

// 学習用途専用。取得範囲を固定でき、カーソルで安定して再取得できる。
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const start = parseDate(searchParams.get('start'), 'start');
    const end = parseDate(searchParams.get('end'), 'end');
    const cursor = parseDate(searchParams.get('cursor'), 'cursor');
    const requestedLimit = Number(searchParams.get('limit') ?? DEFAULT_LIMIT);
    if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > MAX_LIMIT) {
      return NextResponse.json(
        { error: `limit must be between 1 and ${MAX_LIMIT}` },
        { status: 400 }
      );
    }
    if (start && end && start > end) {
      return NextResponse.json({ error: 'start must not be after end' }, { status: 400 });
    }

    // cursor がある場合は開始日より後だけを返し、開始日より古い cursor は無視する。
    const after = cursor && (!start || cursor > start) ? cursor : null;
    const rows = await prisma.healthData.findMany({
      where: {
        date: {
          ...(after ? { gt: after } : start ? { gte: start } : {}),
          ...(end ? { lte: end } : {}),
        },
      },
      orderBy: { date: 'asc' },
      take: requestedLimit + 1,
    });
    const hasNextPage = rows.length > requestedLimit;
    const data = rows.slice(0, requestedLimit).map(formatHealthData);
    return NextResponse.json({
      data,
      nextCursor: hasNextPage ? (data[data.length - 1]?.date ?? null) : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid query';
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
