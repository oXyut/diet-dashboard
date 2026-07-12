import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';
import { formatGoal } from '@/lib/formatters';
import { goalSchema } from '@/lib/validators/goalSchema';

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

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();

    // 許可したフィールドのみ抽出（未知のフィールドは除去される）
    const goal = goalSchema.parse(body);

    const data = await prisma.goal.create({
      data: {
        name: goal.name,
        description: goal.description,
        targetWeightKg: goal.target_weight_kg,
        startDate: new Date(`${goal.start_date}T00:00:00.000Z`),
        endDate: new Date(`${goal.end_date}T00:00:00.000Z`),
        dailyCalorieIntakeMin: goal.daily_calorie_intake_min,
        dailyCalorieIntakeMax: goal.daily_calorie_intake_max,
        dailyProteinMinG: goal.daily_protein_min_g,
        dailyProteinMaxG: goal.daily_protein_max_g,
        dailyFatMinG: goal.daily_fat_min_g,
        dailyFatMaxG: goal.daily_fat_max_g,
        dailyCarbMinG: goal.daily_carb_min_g,
        dailyCarbMaxG: goal.daily_carb_max_g,
        dailyStepsTarget: goal.daily_steps_target,
        isActive: goal.is_active,
      },
    });

    return NextResponse.json({
      success: true,
      data: formatGoal(data),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
