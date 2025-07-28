import { Goal, GoalProgress, HealthData } from '@/types/health';
import { calculateIntakeCalories } from './calorieCalculator';
import { differenceInDays, parseISO, isAfter, isBefore } from 'date-fns';

/**
 * 目標達成状況を計算する
 */
export function calculateGoalProgress(
  goal: Goal,
  latestHealthData?: HealthData | null
): GoalProgress {
  const today = new Date();
  
  // 日付文字列の安全な処理
  if (!goal.startDate || !goal.endDate) {
    throw new Error('Goal start date and end date are required');
  }
  
  const startDate = parseISO(goal.startDate);
  const endDate = parseISO(goal.endDate);
  
  const totalDays = differenceInDays(endDate, startDate) + 1;
  const daysElapsed = Math.max(0, differenceInDays(today, startDate) + 1);
  const daysRemaining = Math.max(0, differenceInDays(endDate, today));
  
  // 期間の進捗率を計算
  const progressPercentage = Math.min(100, (daysElapsed / totalDays) * 100);
  
  // 体重の進捗を評価
  let isOnTrack = true;
  if (goal.targetWeightKg && latestHealthData?.weight) {
    // 簡単な線形進捗を仮定（実際にはより複雑な計算が必要）
    const expectedProgress = progressPercentage / 100;
    // 体重減少の場合を想定
    const currentWeight = latestHealthData.weight;
    if (currentWeight > goal.targetWeightKg) {
      isOnTrack = expectedProgress > 0.5 ? currentWeight <= goal.targetWeightKg + (currentWeight - goal.targetWeightKg) * (1 - expectedProgress) : true;
    }
  }
  
  // 日々の達成状況を評価
  const dailyAchievements = evaluateDailyAchievements(goal, latestHealthData);
  
  return {
    goal,
    currentWeight: latestHealthData?.weight || null,
    daysRemaining,
    totalDays,
    progressPercentage: Math.round(progressPercentage * 10) / 10,
    isOnTrack,
    dailyAchievements,
  };
}

/**
 * 日々の達成状況を評価する
 */
function evaluateDailyAchievements(
  goal: Goal,
  healthData?: HealthData | null
): GoalProgress['dailyAchievements'] {
  if (!healthData) {
    return {
      calories: 'no_data',
      protein: 'no_data',
      fat: 'no_data',
      carbohydrate: 'no_data',
      steps: 'no_data',
    };
  }

  const intakeCalories = calculateIntakeCalories(
    healthData.proteinG,
    healthData.fatG,
    healthData.carbohydrateG
  );

  return {
    calories: evaluateRange(
      intakeCalories,
      goal.dailyCalorieIntakeMin,
      goal.dailyCalorieIntakeMax
    ),
    protein: evaluateRange(
      healthData.proteinG,
      goal.dailyProteinMinG,
      goal.dailyProteinMaxG
    ),
    fat: evaluateRange(
      healthData.fatG,
      goal.dailyFatMinG,
      goal.dailyFatMaxG
    ),
    carbohydrate: evaluateRange(
      healthData.carbohydrateG,
      goal.dailyCarbMinG,
      goal.dailyCarbMaxG
    ),
    steps: evaluateSteps(healthData.steps, goal.dailyStepsTarget),
  };
}

/**
 * 範囲内かどうかを評価する
 */
function evaluateRange(
  value: number | null | undefined,
  min: number | null | undefined,
  max: number | null | undefined
): 'under' | 'within' | 'over' | 'no_data' {
  if (value == null) return 'no_data';
  if (min == null && max == null) return 'no_data';
  
  if (min != null && value < min) return 'under';
  if (max != null && value > max) return 'over';
  return 'within';
}

/**
 * 歩数の達成状況を評価する
 */
function evaluateSteps(
  steps: number | null | undefined,
  target: number | null | undefined
): 'achieved' | 'not_achieved' | 'no_data' {
  if (steps == null || target == null) return 'no_data';
  return steps >= target ? 'achieved' : 'not_achieved';
}

/**
 * 達成状況の色を取得する
 */
export function getAchievementColor(
  status: 'under' | 'within' | 'over' | 'achieved' | 'not_achieved' | 'no_data'
): string {
  switch (status) {
    case 'within':
    case 'achieved':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'under':
    case 'not_achieved':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'over':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'no_data':
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

/**
 * 達成状況のテキストを取得する
 */
export function getAchievementText(
  status: 'under' | 'within' | 'over' | 'achieved' | 'not_achieved' | 'no_data'
): string {
  switch (status) {
    case 'within':
      return '目標範囲内';
    case 'achieved':
      return '達成';
    case 'under':
      return '不足';
    case 'over':
      return '超過';
    case 'not_achieved':
      return '未達成';
    case 'no_data':
    default:
      return 'データなし';
  }
}