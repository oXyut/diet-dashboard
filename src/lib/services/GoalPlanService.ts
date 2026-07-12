import { format, parseISO, subDays } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { GoalPlanInput } from '@/lib/validators/goalSchema';
import { getTodayInJST } from '@/lib/utils/dateUtils';

export class GoalPlanError extends Error {}

export async function saveGoalPlan(input: GoalPlanInput) {
  const startDate = getTodayInJST();
  if (input.end_date <= startDate) {
    throw new GoalPlanError('期限は明日以降を指定してください');
  }

  const start = subDays(parseISO(startDate), 6);
  const weights = await prisma.healthData.findMany({
    where: { date: { gte: start, lte: parseISO(startDate) }, weight: { not: null } },
    select: { weight: true },
  });
  if (weights.length < 2) {
    throw new GoalPlanError('開始体重の算出には直近7日で2件以上の体重記録が必要です');
  }
  const startingWeightKg =
    weights.reduce((sum, item) => sum + Number(item.weight), 0) / weights.length;
  if (input.target_weight_kg >= startingWeightKg) {
    throw new GoalPlanError('目標体重は開始体重より小さくしてください');
  }

  return prisma.$transaction(async (tx) => {
    await tx.goal.updateMany({ where: { isActive: true }, data: { isActive: false } });
    return tx.goal.create({
      data: {
        name: `減量計画 ${format(parseISO(startDate), 'yyyy/MM/dd')}`,
        targetWeightKg: input.target_weight_kg,
        startingWeightKg,
        proteinTargetPercent: input.protein_target_percent,
        fatTargetPercent: input.fat_target_percent,
        carbohydrateTargetPercent: input.carbohydrate_target_percent,
        startDate: parseISO(startDate),
        endDate: parseISO(input.end_date),
        dailyStepsTarget: input.daily_steps_target ?? null,
        isActive: true,
      },
    });
  });
}
