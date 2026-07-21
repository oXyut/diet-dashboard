import Dashboard from '@/components/Dashboard';
import { fetchDashboardData } from '@/lib/dashboardData';

// リクエストごとに最新データを取得する(ビルド時の静的化を防ぐ)
export const dynamic = 'force-dynamic';

export default async function Home() {
  const { healthData, goals } = await fetchDashboardData();

  return <Dashboard healthData={healthData} goals={goals} />;
}
