import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';
import { formatGoal } from '@/lib/formatters';

// 目標データの読み取りもAPIキー必須。
// ダッシュボードはサーバーコンポーネントで直接取得する(src/lib/dashboardData.ts)。
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');

    const goals = await prisma.goal.findMany({
      where: active === 'true' ? { isActive: true } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: goals.map(formatGoal),
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = withAuth(async () => {
  return NextResponse.json(
    { error: 'このエンドポイントは廃止されました。PUT /api/goals/active を使用してください。' },
    { status: 405 }
  );
});
