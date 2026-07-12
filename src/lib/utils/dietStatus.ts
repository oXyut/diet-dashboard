import { Goal, HealthData } from '@/types/health';
import { addDays, differenceInDays, format, parseISO, subDays } from 'date-fns';
import { estimateStartWeight } from './weightGoalCalculator';

// 実績ペース / 目標ペースの比率がこの値以上なら「順調」
export const ON_TRACK_PACE_RATIO = 0.75;
// この値以上なら「注意」、未満なら「停滞」
export const CAUTION_PACE_RATIO = 0.25;
// 各7日窓にこの日数以上の実測がないとペースを算出しない
export const DEFAULT_MIN_SAMPLES_PER_WINDOW = 2;
// 予測到達日がこの日数より先なら表示しない
const MAX_PROJECTION_DAYS = 730;

export type DietStatusLevel = 'achieved' | 'on_track' | 'caution' | 'stalled' | 'insufficient_data';

export interface WeeklyWeightPace {
  /** 直近7日窓 [ref-6, ref] の体重平均 */
  recentAvg: number | null;
  /** 前7日窓 [ref-13, ref-7] の体重平均 */
  previousAvg: number | null;
  /** recentAvg - previousAvg（負=減少） */
  paceKgPerWeek: number | null;
  recentCount: number;
  previousCount: number;
}

/**
 * 週平均体重の変化ペースを計算する
 * 欠測に頑健: 窓内に存在する実測値のみを平均し、実測数が minSamplesPerWindow 未満の窓は null
 */
export function calculateWeeklyWeightPace(
  healthData: HealthData[],
  referenceDate: string,
  minSamplesPerWindow: number = DEFAULT_MIN_SAMPLES_PER_WINDOW
): WeeklyWeightPace {
  const ref = parseISO(referenceDate);
  const recentStart = subDays(ref, 6);
  const previousStart = subDays(ref, 13);
  const previousEnd = subDays(ref, 7);

  const recentWeights: number[] = [];
  const previousWeights: number[] = [];

  for (const item of healthData) {
    if (item.weight == null || !item.date) continue;
    const date = parseISO(item.date);
    if (date >= recentStart && date <= ref) {
      recentWeights.push(item.weight);
    } else if (date >= previousStart && date <= previousEnd) {
      previousWeights.push(item.weight);
    }
  }

  const average = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;
  const recentAvg = recentWeights.length >= minSamplesPerWindow ? average(recentWeights) : null;
  const previousAvg =
    previousWeights.length >= minSamplesPerWindow ? average(previousWeights) : null;

  return {
    recentAvg,
    previousAvg,
    paceKgPerWeek: recentAvg !== null && previousAvg !== null ? recentAvg - previousAvg : null,
    recentCount: recentWeights.length,
    previousCount: previousWeights.length,
  };
}

/**
 * 目標から逆算した週あたりの目標減量ペースを計算する（負=減少）
 */
export function calculateTargetPaceKgPerWeek(goal: Goal, healthData: HealthData[]): number | null {
  if (!goal.target_weight_kg || !goal.start_date || !goal.end_date) {
    return null;
  }

  const startWeight = estimateStartWeight(goal, healthData);
  if (startWeight === null) {
    return null;
  }

  const totalDays = differenceInDays(parseISO(goal.end_date), parseISO(goal.start_date));
  if (totalDays <= 0) {
    return null;
  }

  return ((goal.target_weight_kg - startWeight) / totalDays) * 7;
}

export interface DietStatusSummary {
  level: DietStatusLevel;
  pace: WeeklyWeightPace;
  targetPaceKgPerWeek: number | null;
  /** paceKgPerWeek / targetPace（両方負なら正の比。1以上=目標ペース超過） */
  paceRatio: number | null;
  /** recentAvg - target_weight_kg */
  remainingKg: number | null;
  /** 現ペースで線形外挿した到達予測日（2年超先・増加中は null） */
  projectedGoalDate: string | null;
  /** 目標期間の残り日数 */
  daysRemaining: number | null;
}

/**
 * ダイエットの順調度を総合判定する
 */
export function evaluateDietStatus(
  goal: Goal | null,
  healthData: HealthData[],
  referenceDate: string
): DietStatusSummary {
  const pace = calculateWeeklyWeightPace(healthData, referenceDate);
  const targetPaceKgPerWeek = goal ? calculateTargetPaceKgPerWeek(goal, healthData) : null;
  const daysRemaining = goal?.end_date
    ? Math.max(0, differenceInDays(parseISO(goal.end_date), parseISO(referenceDate)))
    : null;
  const remainingKg =
    goal?.target_weight_kg != null && pace.recentAvg !== null
      ? pace.recentAvg - goal.target_weight_kg
      : null;

  const base: Omit<DietStatusSummary, 'level'> = {
    pace,
    targetPaceKgPerWeek,
    paceRatio: null,
    remainingKg,
    projectedGoalDate: null,
    daysRemaining,
  };

  // 目標なし・目標ペースが減量方向でない場合は判定不能
  if (
    !goal ||
    goal.target_weight_kg == null ||
    targetPaceKgPerWeek === null ||
    targetPaceKgPerWeek >= 0
  ) {
    return { ...base, level: 'insufficient_data' };
  }

  // 目標体重に到達していれば、ペースが算出できなくても達成
  if (remainingKg !== null && remainingKg <= 0) {
    return { ...base, level: 'achieved' };
  }

  // 窓の実測不足でペースが算出できない場合は判定不能
  if (pace.paceKgPerWeek === null) {
    return { ...base, level: 'insufficient_data' };
  }

  const paceRatio = pace.paceKgPerWeek / targetPaceKgPerWeek;

  let projectedGoalDate: string | null = null;
  if (pace.paceKgPerWeek < 0 && remainingKg !== null) {
    const daysToGoal = (remainingKg / -pace.paceKgPerWeek) * 7;
    if (daysToGoal <= MAX_PROJECTION_DAYS) {
      projectedGoalDate = format(
        addDays(parseISO(referenceDate), Math.ceil(daysToGoal)),
        'yyyy-MM-dd'
      );
    }
  }

  let level: DietStatusLevel;
  if (pace.paceKgPerWeek >= 0) {
    level = 'stalled';
  } else if (paceRatio >= ON_TRACK_PACE_RATIO) {
    level = 'on_track';
  } else if (paceRatio >= CAUTION_PACE_RATIO) {
    level = 'caution';
  } else {
    level = 'stalled';
  }

  return { ...base, level, paceRatio, projectedGoalDate };
}
