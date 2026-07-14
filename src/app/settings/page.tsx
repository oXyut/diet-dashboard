import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import GoalSettingsForm from '@/components/GoalSettingsForm';
import { DASHBOARD_SESSION_COOKIE, isDashboardSessionValid } from '@/lib/dashboardAuth';
import { prisma } from '@/lib/prisma';
import { formatGoal } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  if (!isDashboardSessionValid(cookies().get(DASHBOARD_SESSION_COOKIE)?.value)) {
    redirect('/settings/login');
  }
  const goal = await prisma.goal.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10">
      <a href="/" className="text-sm text-ink-muted hover:text-ink">
        ← ダッシュボードへ戻る
      </a>
      <section className="mt-5 rounded-xl border border-line bg-surface p-5 sm:p-7">
        <h1 className="text-2xl font-bold text-ink">減量計画を設定</h1>
        <p className="mt-2 text-sm text-ink-muted">
          体重目標から目標カロリー収支を自動で計算します。
        </p>
        <div className="mt-7">
          <GoalSettingsForm goal={goal ? formatGoal(goal) : null} />
        </div>
      </section>
    </main>
  );
}
