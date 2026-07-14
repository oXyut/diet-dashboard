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
export type PfcIssue = 'protein_low' | 'fat_high' | 'carbohydrate_high';

export interface DailyReview {
  date: string;
  intake: number | null;
  burned: number | null;
  /** 摂取 - 消費。負の値は消費が摂取を上回る状態、正の値は摂取超過。 */
  calorieBalance: number | null;
  protein: number | null;
  fat: number | null;
  carbohydrate: number | null;
  pfcTone: ReviewTone;
  pfcIssues: PfcIssue[];
  steps: number | null;
  stepsTone: ReviewTone;
}

export interface WeeklyReview {
  daily: DailyReview[];
  calories: {
    /** 7日換算した摂取 - 消費。負の値は消費が摂取を上回る状態。 */
    actualBalance: number | null;
    /** 7日換算した目標カロリー差。 */
    targetBalance: number | null;
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
    issues: PfcIssue[];
  };
  steps: { latest: number | null; average: number | null; validDays: number; achievedDays: number };
}

function getPfcIssues(goal: Goal, ratio: ReturnType<typeof calculatePFCRatio>): PfcIssue[] {
  if (!ratio || !isPlanGoal(goal)) return [];
  return [
    ...(ratio.protein < goal.protein_target_percent ? (['protein_low'] as const) : []),
    ...(ratio.fat > goal.fat_target_percent ? (['fat_high'] as const) : []),
    ...(ratio.carbohydrate > goal.carbohydrate_target_percent
      ? (['carbohydrate_high'] as const)
      : []),
  ];
}

function pfcTone(goal: Goal, ratio: ReturnType<typeof calculatePFCRatio>): ReviewTone {
  if (!ratio || !isPlanGoal(goal)) return 'none';
  return getPfcIssues(goal, ratio).length === 0 ? 'good' : 'bad';
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
    const burned = item?.totalCalories ?? null;
    const calorieBalance = intake != null && burned != null ? intake - burned : null;
    const ratio = item ? calculatePFCRatio(item.proteinG, item.fatG, item.carbohydrateG) : null;
    const stepTone: ReviewTone =
      item?.steps == null || goal.daily_steps_target == null
        ? 'none'
        : item.steps >= goal.daily_steps_target
          ? 'good'
          : 'bad';
    return {
      date,
      intake,
      burned,
      calorieBalance,
      protein: ratio?.protein ?? null,
      fat: ratio?.fat ?? null,
      carbohydrate: ratio?.carbohydrate ?? null,
      pfcTone: pfcTone(goal, ratio),
      pfcIssues: getPfcIssues(goal, ratio),
      steps: item?.steps ?? null,
      stepsTone: stepTone,
    };
  });

  const paired = daily.filter((item) => item.calorieBalance != null);
  const calorieItems = paired.map((item) => byDate.get(item.date)!);
  const dailyRequired = requiredDailyDeficit(goal);
  const actualBalance =
    paired.length >= MIN_WEEKLY_DATA_DAYS
      ? (paired.reduce((sum, item) => sum + (item.calorieBalance ?? 0), 0) / paired.length) *
        REVIEW_DAYS
      : null;
  const targetBalance = dailyRequired == null ? null : -dailyRequired * REVIEW_DAYS;
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
      actualBalance,
      targetBalance,
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
        actualBalance == null || targetBalance == null
          ? 'none'
          : actualBalance <= targetBalance
            ? 'good'
            : 'bad',
    },
    pfc: {
      protein: pfc?.protein ?? null,
      fat: pfc?.fat ?? null,
      carbohydrate: pfc?.carbohydrate ?? null,
      validDays: pfcItems.length,
      tone: pfcTone(goal, pfc),
      issues: getPfcIssues(goal, pfc),
    },
    steps: {
      latest: daily[daily.length - 1]?.steps ?? null,
      average: average(stepsWithData.map((item) => item.steps)),
      validDays: stepsWithData.length,
      achievedDays: stepsWithData.filter((item) => item.stepsTone === 'good').length,
    },
  };
}
