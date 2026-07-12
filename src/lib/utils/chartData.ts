import { Goal, HealthData } from '@/types/health';
import { differenceInDays, format, parseISO, subDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { resolveIntakeCalories } from './calorieCalculator';
import { calculateLinearWeightGoal } from './weightGoalCalculator';

export interface ChartDataPoint {
  date: string;
  weight: number | null | undefined;
  bodyFat: number | null | undefined;
  muscleMass: number | null | undefined;
  steps: number | null | undefined;
  calories: number | null | undefined;
  protein: number | null | undefined;
  fat: number | null | undefined;
  carbohydrate: number | null | undefined;
  intakeCalories: number | null;
  deficit: number | null;
  weightAverage: number | null;
  targetWeight?: number;
  linearTarget?: number;
}

/**
 * チャート表示用データを構築する（rangeDays が null なら全期間）
 * 日付キーはYYYY-MM-DD形式で保持し、表示時のみMM/ddにフォーマットする
 */
export function buildChartData(
  healthData: HealthData[],
  goal: Goal | null,
  rangeDays: number | null
): ChartDataPoint[] {
  const cutoffDate = rangeDays !== null ? subDays(new Date(), rangeDays) : null;

  const allData = healthData
    .filter((item) => item.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const filteredData = allData.filter(
    (item) => cutoffDate === null || new Date(item.date) >= cutoffDate
  );

  const rollingAverages = new Map<string, number | null>();
  allData.forEach((item, index) => {
    const weights = allData
      .slice(Math.max(0, index - 6), index + 1)
      .map((entry) => entry.weight)
      .filter((weight): weight is number => weight != null);
    rollingAverages.set(
      item.date,
      weights.length ? weights.reduce((sum, weight) => sum + weight, 0) / weights.length : null
    );
  });

  const chartData: ChartDataPoint[] = filteredData.map((item) => {
    const intakeCalories = resolveIntakeCalories(
      item.dietaryCalories,
      item.proteinG,
      item.fatG,
      item.carbohydrateG
    );
    return {
      date: item.date,
      weight: item.weight,
      bodyFat: item.bodyFatPercentage,
      muscleMass: item.muscleMass,
      steps: item.steps,
      calories: item.totalCalories,
      protein: item.proteinG,
      fat: item.fatG,
      carbohydrate: item.carbohydrateG,
      intakeCalories,
      deficit:
        item.totalCalories != null && intakeCalories != null
          ? item.totalCalories - intakeCalories
          : null,
      weightAverage: rollingAverages.get(item.date) ?? null,
    };
  });

  if (!goal) {
    return chartData;
  }

  // 全期間表示のときは最古データから今日までを目標線の生成範囲にする
  const effectiveRange =
    rangeDays ??
    (filteredData.length > 0
      ? Math.max(0, differenceInDays(new Date(), new Date(filteredData[0].date)))
      : 0);

  const goalData = calculateLinearWeightGoal(goal, healthData, effectiveRange);

  return chartData.map((item) => {
    const goalItem = goalData.find((g) => g.date === item.date);
    return {
      ...item,
      targetWeight: goalItem?.targetWeight,
      linearTarget: goalItem?.linearTarget,
    };
  });
}

/**
 * 体重グラフのY軸範囲を実データ・目標線・目標体重をすべて含む範囲から算出する
 */
export function getWeightAxisDomain(data: ChartDataPoint[]): [number, number] | [string, string] {
  const weightValues = data
    .flatMap((item) => [item.weight, item.targetWeight, item.linearTarget])
    .filter((value): value is number => typeof value === 'number');

  if (weightValues.length === 0) {
    return ['dataMin - 5', 'dataMax + 5'];
  }

  const margin = 1;
  return [
    Math.floor(Math.min(...weightValues) - margin),
    Math.ceil(Math.max(...weightValues) + margin),
  ];
}

/**
 * YYYY-MM-DD形式の日付キーをグラフ表示用のMM/dd形式にフォーマットする
 */
export function formatDateLabel(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MM/dd', { locale: ja });
  } catch {
    return dateStr;
  }
}
