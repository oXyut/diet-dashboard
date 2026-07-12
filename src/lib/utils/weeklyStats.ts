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
  /** 摂取が記録された日だけの平均 */
  avgIntake: number | null;
  intakeDays: number;
  /** 消費が記録された日だけの平均 */
  avgBurned: number | null;
  burnedDays: number;
  /** 摂取・消費の両方が記録された日だけの (摂取−消費) 平均（負=アンダーカロリー） */
  avgBalance: number | null;
  daysWithBoth: number;
}

/**
 * 直近N日のカロリー収支を計算する
 * 摂取・消費の平均はそれぞれ記録がある日で計算し、収支は両方が揃った日のみで計算する
 */
export function calculateCalorieBalance(
  healthData: HealthData[],
  referenceDate: string,
  days: number = DEFAULT_DAYS
): CalorieBalance {
  const byDate = new Map(healthData.map((item) => [item.date, item]));
  const ref = parseISO(referenceDate);

  let intakeSum = 0;
  let intakeDays = 0;
  let burnedSum = 0;
  let burnedDays = 0;
  let balanceSum = 0;
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

    if (intake !== null) {
      intakeSum += intake;
      intakeDays += 1;
    }
    if (burned != null) {
      burnedSum += burned;
      burnedDays += 1;
    }
    if (intake !== null && burned != null) {
      balanceSum += intake - burned;
      daysWithBoth += 1;
    }
  }

  return {
    avgIntake: intakeDays > 0 ? intakeSum / intakeDays : null,
    intakeDays,
    avgBurned: burnedDays > 0 ? burnedSum / burnedDays : null,
    burnedDays,
    avgBalance: daysWithBoth > 0 ? balanceSum / daysWithBoth : null,
    daysWithBoth,
  };
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
  /** P/F/C の3つ全てが評価可能で、全て範囲内だった日数 */
  pfcAll: AchievementCount;
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
    pfcAll: { withinDays: 0, daysWithData: 0 },
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

    const proteinResult = evaluateRange(
      item.proteinG,
      goal.daily_protein_min_g,
      goal.daily_protein_max_g
    );
    const fatResult = evaluateRange(item.fatG, goal.daily_fat_min_g, goal.daily_fat_max_g);
    const carbResult = evaluateRange(
      item.carbohydrateG,
      goal.daily_carb_min_g,
      goal.daily_carb_max_g
    );

    tallyRange(
      counts.calories,
      evaluateRange(intake, goal.daily_calorie_intake_min, goal.daily_calorie_intake_max)
    );
    tallyRange(counts.protein, proteinResult);
    tallyRange(counts.fat, fatResult);
    tallyRange(counts.carb, carbResult);

    const pfcResults = [proteinResult, fatResult, carbResult];
    if (pfcResults.every((result) => result !== 'no_data')) {
      counts.pfcAll.daysWithData += 1;
      if (pfcResults.every((result) => result === 'within')) {
        counts.pfcAll.withinDays += 1;
      }
    }

    const stepsResult = evaluateSteps(item.steps, goal.daily_steps_target);
    if (stepsResult !== 'no_data') {
      counts.steps.daysWithData += 1;
      if (stepsResult === 'achieved') counts.steps.withinDays += 1;
    }
  }

  return counts;
}
