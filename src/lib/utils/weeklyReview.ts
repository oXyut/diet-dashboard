import { Goal, HealthData } from '@/types/health';
import { calculatePFCRatio, resolveIntakeCalories } from './calorieCalculator';
import {
  MIN_WEEKLY_DATA_DAYS,
  planDateKeys,
  requiredDailyDeficit,
  REVIEW_DAYS,
  isPlanGoal,
} from './planCalculator';

export type ReviewTone = 'good' | 'bad' | 'none';

export interface DailyReview {
  date: string;
  deficit: number | null;
  protein: number | null;
  fat: number | null;
  carbohydrate: number | null;
  pfcTone: ReviewTone;
  steps: number | null;
  stepsTone: ReviewTone;
}

export interface WeeklyReview {
  daily: DailyReview[];
  calories: {
    actualDeficit: number | null;
    requiredDeficit: number | null;
    avgBurned: number | null;
    avgIntake: number | null;
    avgResting: number | null;
    avgActive: number | null;
    budget: number | null;
    validDays: number;
    tone: ReviewTone;
  };
  pfc: {
    protein: number | null;
    fat: number | null;
    carbohydrate: number | null;
    validDays: number;
    tone: ReviewTone;
  };
  steps: { latest: number | null; average: number | null; validDays: number; achievedDays: number };
}

function pfcTone(goal: Goal, ratio: ReturnType<typeof calculatePFCRatio>): ReviewTone {
  if (!ratio || !isPlanGoal(goal)) return 'none';
  return ratio.protein >= goal.protein_target_percent &&
    ratio.fat <= goal.fat_target_percent &&
    ratio.carbohydrate <= goal.carbohydrate_target_percent
    ? 'good'
    : 'bad';
}

export function calculateWeeklyReview(
  goal: Goal,
  healthData: HealthData[],
  referenceDate: string
): WeeklyReview {
  const byDate = new Map(healthData.map((item) => [item.date, item]));
  const daily = planDateKeys(referenceDate).map((date) => {
    const item = byDate.get(date);
    const intake = item
      ? resolveIntakeCalories(item.dietaryCalories, item.proteinG, item.fatG, item.carbohydrateG)
      : null;
    const deficit =
      intake != null && item?.totalCalories != null ? item.totalCalories - intake : null;
    const ratio = item ? calculatePFCRatio(item.proteinG, item.fatG, item.carbohydrateG) : null;
    const stepTone: ReviewTone =
      item?.steps == null || goal.daily_steps_target == null
        ? 'none'
        : item.steps >= goal.daily_steps_target
          ? 'good'
          : 'bad';
    return {
      date,
      deficit,
      protein: ratio?.protein ?? null,
      fat: ratio?.fat ?? null,
      carbohydrate: ratio?.carbohydrate ?? null,
      pfcTone: pfcTone(goal, ratio),
      steps: item?.steps ?? null,
      stepsTone: stepTone,
    };
  });

  const paired = daily.filter((item) => item.deficit != null);
  const calorieItems = paired.map((item) => byDate.get(item.date)!);
  const dailyRequired = requiredDailyDeficit(goal);
  const actualDeficit =
    paired.length >= MIN_WEEKLY_DATA_DAYS
      ? (paired.reduce((sum, item) => sum + (item.deficit ?? 0), 0) / paired.length) * REVIEW_DAYS
      : null;
  const requiredDeficit = dailyRequired == null ? null : dailyRequired * REVIEW_DAYS;
  const average = (values: Array<number | null | undefined>) => {
    const actual = values.filter((value): value is number => value != null);
    return actual.length ? actual.reduce((sum, value) => sum + value, 0) / actual.length : null;
  };

  const pfcItems = daily.filter(
    (item) => item.protein != null && item.fat != null && item.carbohydrate != null
  );
  let proteinCalories = 0;
  let fatCalories = 0;
  let carbohydrateCalories = 0;
  pfcItems.forEach((item) => {
    const data = byDate.get(item.date)!;
    proteinCalories += (data.proteinG ?? 0) * 4;
    fatCalories += (data.fatG ?? 0) * 9;
    carbohydrateCalories += (data.carbohydrateG ?? 0) * 4;
  });
  const totalMacroCalories = proteinCalories + fatCalories + carbohydrateCalories;
  const pfc =
    pfcItems.length >= MIN_WEEKLY_DATA_DAYS && totalMacroCalories > 0
      ? {
          protein: (proteinCalories / totalMacroCalories) * 100,
          fat: (fatCalories / totalMacroCalories) * 100,
          carbohydrate: (carbohydrateCalories / totalMacroCalories) * 100,
        }
      : null;

  const stepsWithData = daily.filter((item) => item.steps != null);
  return {
    daily,
    calories: {
      actualDeficit,
      requiredDeficit,
      avgBurned: average(calorieItems.map((item) => item.totalCalories)),
      avgIntake: average(
        calorieItems.map((item) =>
          resolveIntakeCalories(item.dietaryCalories, item.proteinG, item.fatG, item.carbohydrateG)
        )
      ),
      avgResting: average(calorieItems.map((item) => item.restingCalories)),
      avgActive: average(calorieItems.map((item) => item.activeCalories)),
      budget:
        average(calorieItems.map((item) => item.totalCalories)) != null && dailyRequired != null
          ? (average(calorieItems.map((item) => item.totalCalories)) as number) - dailyRequired
          : null,
      validDays: paired.length,
      tone:
        actualDeficit == null || requiredDeficit == null
          ? 'none'
          : actualDeficit >= requiredDeficit
            ? 'good'
            : 'bad',
    },
    pfc: {
      protein: pfc?.protein ?? null,
      fat: pfc?.fat ?? null,
      carbohydrate: pfc?.carbohydrate ?? null,
      validDays: pfcItems.length,
      tone: pfcTone(goal, pfc),
    },
    steps: {
      latest: daily[daily.length - 1]?.steps ?? null,
      average: average(stepsWithData.map((item) => item.steps)),
      validDays: stepsWithData.length,
      achievedDays: stepsWithData.filter((item) => item.stepsTone === 'good').length,
    },
  };
}
