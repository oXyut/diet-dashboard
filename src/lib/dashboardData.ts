import { prisma } from '@/lib/prisma';
import { PrismaHealthDataRepository } from '@/lib/repositories/implementations/PrismaHealthDataRepository';
import { HealthDataService } from '@/lib/services/HealthDataService';
import { formatHealthData, formatGoal } from '@/lib/formatters';
import { HealthData, Goal } from '@/types/health';

const repository = new PrismaHealthDataRepository();
const service = new HealthDataService(repository);

// ダッシュボード(サーバーコンポーネント)用のデータ取得。
// APIルートを経由せずサービス層を直接呼ぶことで、GET APIを認証必須にできる。
export async function fetchDashboardData(): Promise<{
  healthData: HealthData[];
  goals: Goal[];
}> {
  try {
    const [rows, goals] = await Promise.all([
      service.getHealthData({ take: 100 }),
      prisma.goal.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      healthData: rows.map(formatHealthData),
      goals: goals.map(formatGoal),
    };
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return { healthData: [], goals: [] };
  }
}
