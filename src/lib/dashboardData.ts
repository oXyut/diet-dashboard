import { prisma } from '@/lib/prisma';
import { PrismaHealthDataRepository } from '@/lib/repositories/implementations/PrismaHealthDataRepository';
import { HealthDataService } from '@/lib/services/HealthDataService';
import { formatHealthData, formatGoal, formatWeightPrediction } from '@/lib/formatters';
import { HealthData, Goal, WeightPrediction } from '@/types/health';

const repository = new PrismaHealthDataRepository();
const service = new HealthDataService(repository);

// ダッシュボード(サーバーコンポーネント)用のデータ取得。
// APIルートを経由せずサービス層を直接呼ぶことで、GET APIを認証必須にできる。
export async function fetchDashboardData(): Promise<{
  healthData: HealthData[];
  goals: Goal[];
  prediction: WeightPrediction | null;
}> {
  try {
    const [rows, goals, prediction] = await Promise.all([
      service.getHealthData({ take: 100 }),
      prisma.goal.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.weightPrediction.findFirst({ orderBy: { targetDate: 'desc' } }),
    ]);

    return {
      healthData: rows.map(formatHealthData),
      goals: goals.map(formatGoal),
      prediction: prediction ? formatWeightPrediction(prediction) : null,
    };
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return { healthData: [], goals: [], prediction: null };
  }
}
