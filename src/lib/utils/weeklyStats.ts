import { Goal, HealthData } from '@/types/health';
import { format, parseISO, subDays } from 'date-fns';
import { resolveIntakeCalories } from './calorieCalculator';
import { evaluateRange, evaluateSteps } from './goalCalculator';

const DEFAULT_DAYS = 7;

export interface DailyRecordFlag {
  date: string;
  hasWeight: boolean;
  hasDiet: boolean;
}

/**
 * 直近N日の記録状況（体重測定・食事記録の有無）を日付昇順で返す
 */
export function getRecordingStatus(
  healthData: HealthData[],
  referenceDate: string,
  days: number = DEFAULT_DAYS
): DailyRecordFlag[] {
  const byDate = new Map(healthData.map((item) => [item.date, item]));
  const ref = parseISO(referenceDate);

  const result: DailyRecordFlag[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dateStr = format(subDays(ref, i), 'yyyy-MM-dd');
    const item = byDate.get(dateStr);
    result.push({
      date: dateStr,
      hasWeight: item?.weight != null,
      hasDiet: item
        ? resolveIntakeCalories(
            item.dietaryCalories,
            item.proteinG,
            item.fatG,
            item.carbohydrateG
          ) !== null
        : false,
    });
  }
  return result;
}

export interface CalorieBalance {
  avgIntake: number | null;
  avgBurned: number | null;
  /** avgIntake - avgBurned（負=アンダーカロリー） */
  avgBalance: number | null;
  daysWithBoth: number;
}

/**
 * 直近N日のカロリー収支を計算する（摂取・消費の両方が記録された日のみで平均）
 */
export function calculateCalorieBalance(
  healthData: HealthData[],
  referenceDate: string,
  days: number = DEFAULT_DAYS
): CalorieBalance {
  const byDate = new Map(healthData.map((item) => [item.date, item]));
  const ref = parseISO(referenceDate);

  let intakeSum = 0;
  let burnedSum = 0;
  let daysWithBoth = 0;

  for (let i = 0; i < days; i++) {
    const dateStr = format(subDays(ref, i), 'yyyy-MM-dd');
    const item = byDate.get(dateStr);
    if (!item) continue;

    const intake = resolveIntakeCalories(
      item.dietaryCalories,
      item.proteinG,
      item.fatG,
      item.carbohydrateG
    );
    const burned = item.totalCalories;
    if (intake === null || burned == null) continue;

    intakeSum += intake;
    burnedSum += burned;
    daysWithBoth += 1;
  }

  if (daysWithBoth === 0) {
    return { avgIntake: null, avgBurned: null, avgBalance: null, daysWithBoth: 0 };
  }

  const avgIntake = intakeSum / daysWithBoth;
  const avgBurned = burnedSum / daysWithBoth;
  return { avgIntake, avgBurned, avgBalance: avgIntake - avgBurned, daysWithBoth };
}

export interface AchievementCount {
  /** 目標範囲内（歩数は達成）だった日数 */
  withinDays: number;
  /** 実測と目標の両方があり評価できた日数 */
  daysWithData: number;
}

export interface WeeklyAchievements {
  calories: AchievementCount;
  protein: AchievementCount;
  fat: AchievementCount;
  carb: AchievementCount;
  steps: AchievementCount;
}

/**
 * 直近N日の目標達成日数を指標ごとにカウントする
 */
export function countWeeklyAchievements(
  goal: Goal,
  healthData: HealthData[],
  referenceDate: string,
  days: number = DEFAULT_DAYS
): WeeklyAchievements {
  const byDate = new Map(healthData.map((item) => [item.date, item]));
  const ref = parseISO(referenceDate);

  const counts: WeeklyAchievements = {
    calories: { withinDays: 0, daysWithData: 0 },
    protein: { withinDays: 0, daysWithData: 0 },
    fat: { withinDays: 0, daysWithData: 0 },
    carb: { withinDays: 0, daysWithData: 0 },
    steps: { withinDays: 0, daysWithData: 0 },
  };

  const tallyRange = (count: AchievementCount, result: ReturnType<typeof evaluateRange>) => {
    if (result === 'no_data') return;
    count.daysWithData += 1;
    if (result === 'within') count.withinDays += 1;
  };

  for (let i = 0; i < days; i++) {
    const dateStr = format(subDays(ref, i), 'yyyy-MM-dd');
    const item = byDate.get(dateStr);
    if (!item) continue;

    const intake = resolveIntakeCalories(
      item.dietaryCalories,
      item.proteinG,
      item.fatG,
      item.carbohydrateG
    );

    tallyRange(
      counts.calories,
      evaluateRange(intake, goal.daily_calorie_intake_min, goal.daily_calorie_intake_max)
    );
    tallyRange(
      counts.protein,
      evaluateRange(item.proteinG, goal.daily_protein_min_g, goal.daily_protein_max_g)
    );
    tallyRange(counts.fat, evaluateRange(item.fatG, goal.daily_fat_min_g, goal.daily_fat_max_g));
    tallyRange(
      counts.carb,
      evaluateRange(item.carbohydrateG, goal.daily_carb_min_g, goal.daily_carb_max_g)
    );

    const stepsResult = evaluateSteps(item.steps, goal.daily_steps_target);
    if (stepsResult !== 'no_data') {
      counts.steps.daysWithData += 1;
      if (stepsResult === 'achieved') counts.steps.withinDays += 1;
    }
  }

  return counts;
}
