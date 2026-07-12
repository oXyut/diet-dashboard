import { differenceInCalendarDays, format, parseISO, subDays } from 'date-fns';
import { Goal, HealthData } from '@/types/health';

export const KCAL_PER_KG_FAT = 7700;
export const REVIEW_DAYS = 7;
export const MIN_WEEKLY_DATA_DAYS = 5;

export function isPlanGoal(goal: Goal | null | undefined): goal is Goal & {
  target_weight_kg: number;
  starting_weight_kg: number;
  protein_target_percent: number;
  fat_target_percent: number;
  carbohydrate_target_percent: number;
} {
  return Boolean(
    goal &&
    goal.target_weight_kg != null &&
    goal.starting_weight_kg != null &&
    goal.protein_target_percent != null &&
    goal.fat_target_percent != null &&
    goal.carbohydrate_target_percent != null
  );
}

export function planDays(goal: Goal): number | null {
  if (!goal.start_date || !goal.end_date) return null;
  const days = differenceInCalendarDays(parseISO(goal.end_date), parseISO(goal.start_date)) + 1;
  return days > 0 ? days : null;
}

export function requiredDailyDeficit(goal: Goal): number | null {
  if (!isPlanGoal(goal)) return null;
  const days = planDays(goal);
  if (!days) return null;
  return ((goal.starting_weight_kg - goal.target_weight_kg) * KCAL_PER_KG_FAT) / days;
}

export function averageRecentWeight(
  healthData: HealthData[],
  referenceDate: string,
  days: number = REVIEW_DAYS
): { average: number | null; count: number } {
  const start = subDays(parseISO(referenceDate), days - 1);
  const weights = healthData
    .filter(
      (item) => item.weight != null && parseISO(item.date) >= start && item.date <= referenceDate
    )
    .map((item) => item.weight as number);
  return {
    average: weights.length
      ? weights.reduce((sum, value) => sum + value, 0) / weights.length
      : null,
    count: weights.length,
  };
}

export function planDateKeys(referenceDate: string, days: number = REVIEW_DAYS): string[] {
  const reference = parseISO(referenceDate);
  return Array.from({ length: days }, (_, index) =>
    format(subDays(reference, days - 1 - index), 'yyyy-MM-dd')
  );
}
