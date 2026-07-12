import { Goal, HealthData } from '@/types/health';
import { parseISO, differenceInDays, subDays, format } from 'date-fns';

/**
 * 目標開始時点の体重を推定する（最も古いデータを使用、または現在の減量ペースから逆算）
 * 体重データがない場合は推定できないため null を返す
 */
export function estimateStartWeight(goal: Goal, healthData: HealthData[]): number | null {
  if (!goal.start_date) {
    return null;
  }

  const startDate = parseISO(goal.start_date);

  const sortedHealthData = [...healthData]
    .filter((d) => d.weight !== null && d.weight !== undefined)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sortedHealthData.length === 0) {
    return null;
  }

  // 最古のデータを開始時の体重として使用
  const oldestData = sortedHealthData[0];
  let startWeight = oldestData.weight!;

  // もし開始日より後のデータしかない場合は、現在の減量ペースから逆算
  const oldestDate = new Date(oldestData.date);
  if (oldestDate > startDate && sortedHealthData.length > 1) {
    const recentData = sortedHealthData[sortedHealthData.length - 1];
    const daysBetween = differenceInDays(new Date(recentData.date), oldestDate);
    if (daysBetween > 0) {
      const weightLossRate = (oldestData.weight! - recentData.weight!) / daysBetween;
      const daysFromStartToOldest = differenceInDays(oldestDate, startDate);
      startWeight = oldestData.weight! + weightLossRate * daysFromStartToOldest;
    }
  }

  return startWeight;
}

/**
 * 線形減少の目標線データを計算する
 */
export function calculateLinearWeightGoal(
  goal: Goal,
  healthData: HealthData[],
  dateRange: number = 30
): Array<{ date: string; targetWeight: number; linearTarget: number }> {
  if (!goal.target_weight_kg || !goal.start_date || !goal.end_date) {
    return [];
  }

  const startDate = parseISO(goal.start_date);
  const endDate = parseISO(goal.end_date);

  const startWeight = estimateStartWeight(goal, healthData);
  if (startWeight === null) {
    return [];
  }

  const totalDays = differenceInDays(endDate, startDate);
  const dailyWeightLoss = (startWeight - goal.target_weight_kg) / totalDays;

  // 表示範囲の日付を生成（健康データと同じ形式に合わせる）
  const result: Array<{ date: string; targetWeight: number; linearTarget: number }> = [];

  // dateRangeの日数分データを生成
  for (let i = 0; i <= dateRange; i++) {
    const currentDate = subDays(new Date(), dateRange - i);

    // 目標期間外は計算しない
    if (currentDate < startDate || currentDate > endDate) {
      continue;
    }

    // 年情報を保持するためYYYY-MM-DD形式で保持し、表示時のみMM/ddにフォーマットする
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const daysSinceStart = differenceInDays(currentDate, startDate);
    const linearTarget = startWeight - dailyWeightLoss * daysSinceStart;

    result.push({
      date: dateStr,
      targetWeight: goal.target_weight_kg,
      linearTarget: Math.max(goal.target_weight_kg, linearTarget),
    });
  }

  return result;
}
