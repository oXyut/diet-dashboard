import { Goal, HealthData } from '@/types/health';
import { parseISO, differenceInDays, addDays, format } from 'date-fns';

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
  const today = new Date();
  
  // 開始時の体重を取得（最も古いデータまたは推定値）
  const sortedHealthData = [...healthData].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  let startWeight = goal.target_weight_kg + 20; // デフォルト推定値
  
  // 目標開始日に近いデータを探す
  const startDateStr = startDate.toISOString().split('T')[0];
  const nearStartData = sortedHealthData.find(data => data.date >= startDateStr);
  if (nearStartData && nearStartData.weight) {
    startWeight = nearStartData.weight;
  } else if (sortedHealthData.length > 0 && sortedHealthData[0].weight) {
    // 最古のデータを使用
    startWeight = sortedHealthData[0].weight;
  }

  const totalDays = differenceInDays(endDate, startDate) + 1;
  const weightLossPerDay = (startWeight - goal.target_weight_kg) / totalDays;

  // 表示範囲の日付を生成
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - dateRange);
  
  const result: Array<{ date: string; targetWeight: number; linearTarget: number }> = [];
  
  for (let i = 0; i <= dateRange + 30; i++) { // 未来の予測も含める
    const currentDate = addDays(cutoffDate, i);
    if (currentDate > endDate) break;
    
    const dateStr = format(currentDate, 'MM/dd');
    const daysSinceStart = Math.max(0, differenceInDays(currentDate, startDate));
    const linearTarget = startWeight - (weightLossPerDay * daysSinceStart);
    
    result.push({
      date: dateStr,
      targetWeight: goal.target_weight_kg,
      linearTarget: Math.max(goal.target_weight_kg, linearTarget)
    });
  }

  return result;
}