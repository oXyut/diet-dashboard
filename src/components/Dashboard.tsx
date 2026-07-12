'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { AlertCircle, CheckCircle2, ChevronRight, Minus, Settings, X } from 'lucide-react';
import { Goal, HealthData } from '@/types/health';
import { buildChartData } from '@/lib/utils/chartData';
import { getYesterdayInJST } from '@/lib/utils/dateUtils';
import { calculateWeeklyWeightPace } from '@/lib/utils/dietStatus';
import { averageRecentWeight, isPlanGoal, requiredDailyDeficit } from '@/lib/utils/planCalculator';
import { calculateWeeklyReview, ReviewTone } from '@/lib/utils/weeklyReview';
import Footer from './Footer';
import RangeSelector, { ChartRange } from './RangeSelector';
import SectionCard from './SectionCard';
import { StatusBadge, StatusTone } from './StatusBadge';
import DeficitChart from './charts/DeficitChart';
import PFCCompositionChart from './charts/PFCCompositionChart';
import StepsChart from './charts/StepsChart';
import WeightChart from './charts/WeightChart';

interface DashboardProps {
  healthData: HealthData[];
  goals: Goal[];
}
type DetailPanel = 'calories' | 'pfc' | 'steps' | null;

const toneFor = (tone: ReviewTone): StatusTone =>
  tone === 'good' ? 'good' : tone === 'bad' ? 'bad' : 'none';
const iconFor = (tone: ReviewTone) =>
  tone === 'good' ? (
    <CheckCircle2 className="h-3.5 w-3.5" />
  ) : tone === 'bad' ? (
    <AlertCircle className="h-3.5 w-3.5" />
  ) : (
    <Minus className="h-3.5 w-3.5" />
  );
const formatKcal = (value: number | null) =>
  value == null ? '—' : `${Math.round(value).toLocaleString()} kcal`;
const formatPercent = (value: number | null) => (value == null ? '—' : `${value.toFixed(1)}%`);

function ReviewBadge({ tone, good, bad }: { tone: ReviewTone; good: string; bad: string }) {
  return (
    <StatusBadge tone={toneFor(tone)} icon={iconFor(tone)}>
      {tone === 'good' ? good : tone === 'bad' ? bad : 'データ不足'}
    </StatusBadge>
  );
}

function MacroOverview({
  name,
  actual,
  target,
  minimum,
}: {
  name: string;
  actual: number | null;
  target: number;
  minimum: boolean;
}) {
  const difference = actual == null ? null : minimum ? actual - target : target - actual;
  const good = difference != null && difference >= 0;
  const delta =
    difference == null
      ? 'データなし'
      : good
        ? `${Math.abs(difference).toFixed(1)}pt余裕`
        : minimum
          ? `あと${Math.abs(difference).toFixed(1)}pt不足`
          : `${Math.abs(difference).toFixed(1)}pt超過`;
  const visualRatio =
    actual == null || target === 0 ? 0 : Math.min((actual / target / 1.5) * 100, 100);
  const color =
    difference == null
      ? 'var(--status-none)'
      : good
        ? 'var(--status-good)'
        : minimum
          ? 'var(--status-warn)'
          : 'var(--status-bad)';
  const status = difference == null ? '未記録' : good ? '適正' : minimum ? '不足' : '過剰';
  return (
    <div className="grid grid-cols-[4.75rem_minmax(0,1fr)_5.75rem] items-center gap-3 py-2.5">
      <div>
        <p className="text-xs font-semibold text-ink-secondary">{name}</p>
        <span
          className={
            difference == null
              ? 'mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold text-ink-muted bg-surface-2'
              : good
                ? 'mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold text-status-good bg-status-good/15'
                : minimum
                  ? 'mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold text-status-warn bg-status-warn/15'
                  : 'mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold text-status-bad bg-status-bad/15'
          }
        >
          {status}
        </span>
      </div>
      <div className="relative h-3 overflow-visible rounded-full bg-surface-2">
        <div
          className="h-full rounded-full"
          style={{ width: `${visualRatio}%`, backgroundColor: color }}
        />
        <span className="absolute inset-y-[-4px] w-px bg-ink-muted" style={{ left: '66.667%' }} />
      </div>
      <div className="text-right">
        <p className="whitespace-nowrap text-base font-semibold tracking-tight text-ink">
          {actual == null ? '—' : actual.toFixed(1)}
          <span className="ml-0.5 text-[11px] font-medium text-ink-muted">% / {target}%</span>
        </p>
        <p
          className={
            difference == null
              ? 'mt-0.5 whitespace-nowrap text-[10px] text-ink-muted'
              : good
                ? 'mt-0.5 whitespace-nowrap text-[10px] font-medium text-status-good'
                : minimum
                  ? 'mt-0.5 whitespace-nowrap text-[10px] font-medium text-status-warn'
                  : 'mt-0.5 whitespace-nowrap text-[10px] font-medium text-status-bad'
          }
        >
          {delta}
        </p>
      </div>
    </div>
  );
}

function DailyCheck({ review }: { review: ReturnType<typeof calculateWeeklyReview> }) {
  return (
    <SectionCard
      title="日別チェック"
      action={<span className="text-xs text-ink-muted">直近7日</span>}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="text-xs text-ink-muted">
            <tr className="border-b border-line text-left">
              <th className="pb-2 font-medium">日付</th>
              <th className="pb-2 font-medium">赤字</th>
              <th className="pb-2 font-medium">PFC</th>
              <th className="pb-2 font-medium">歩数</th>
              <th className="pb-2 font-medium">記録</th>
            </tr>
          </thead>
          <tbody>
            {review.daily.map((day) => {
              const hasRecord = day.deficit != null || day.protein != null || day.steps != null;
              return (
                <tr key={day.date} className="border-b border-line/60 last:border-0">
                  <td className="py-2.5 text-ink-secondary">
                    {format(parseISO(day.date), 'M/d (E)', { locale: ja })}
                  </td>
                  <td
                    className={
                      day.deficit == null
                        ? 'text-ink-muted'
                        : day.deficit >= 0
                          ? 'text-status-good'
                          : 'text-status-bad'
                    }
                  >
                    {day.deficit == null
                      ? '—'
                      : `${day.deficit >= 0 ? '+' : ''}${Math.round(day.deficit).toLocaleString()} kcal`}
                  </td>
                  <td>
                    <ReviewBadge tone={day.pfcTone} good="達成" bad="要調整" />
                  </td>
                  <td>
                    <ReviewBadge
                      tone={day.stepsTone}
                      good={day.steps?.toLocaleString() ?? '達成'}
                      bad={day.steps?.toLocaleString() ?? '未達'}
                    />
                  </td>
                  <td className="text-xs text-ink-muted">{hasRecord ? '記録あり' : '未記録'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function DetailModal({
  panel,
  onClose,
  children,
}: {
  panel: DetailPanel;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!panel) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [panel, onClose]);
  if (!panel) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/60 p-0 sm:items-center sm:justify-center sm:p-4"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="詳細数値"
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl border border-line bg-surface p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">
            {panel === 'calories'
              ? 'カロリー収支の詳細'
              : panel === 'pfc'
                ? 'PFCバランスの詳細'
                : '歩数習慣の詳細'}
          </h2>
          <button
            type="button"
            aria-label="閉じる"
            onClick={onClose}
            className="rounded-lg p-2 text-ink-muted hover:bg-surface-2 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function DetailRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-5 border-b border-line py-3 last:border-0">
      <span className="text-sm text-ink-muted">{label}</span>
      <span
        className={
          emphasis ? 'text-base font-semibold text-ink' : 'text-sm font-medium text-ink-secondary'
        }
      >
        {value}
      </span>
    </div>
  );
}

export default function Dashboard({ healthData, goals }: DashboardProps) {
  const [range, setRange] = useState<ChartRange>(90);
  const [detailPanel, setDetailPanel] = useState<DetailPanel>(null);
  const activeGoal = goals[0] ?? null;
  const referenceDate = getYesterdayInJST();
  const chartData = useMemo(
    () => buildChartData(healthData, activeGoal, range),
    [healthData, activeGoal, range]
  );
  const plan = isPlanGoal(activeGoal) ? activeGoal : null;
  const review = useMemo(
    () => (plan ? calculateWeeklyReview(plan, healthData, referenceDate) : null),
    [plan, healthData, referenceDate]
  );
  const recentWeight = useMemo(
    () => averageRecentWeight(healthData, referenceDate),
    [healthData, referenceDate]
  );
  const pace = useMemo(
    () => calculateWeeklyWeightPace(healthData, referenceDate),
    [healthData, referenceDate]
  );
  const dailyDeficit = plan ? requiredDailyDeficit(plan) : null;
  const latestDate = healthData[0]?.date ?? null;

  if (!plan || !review) {
    return (
      <div className="min-h-screen">
        <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
          <header className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-ink">Yuto&apos;s Diet Dashboard</h1>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-ink-secondary hover:text-ink"
            >
              <Settings className="h-4 w-4" /> 目標を設定
            </Link>
          </header>
          <section className="mt-6 rounded-xl border border-line bg-surface p-6 sm:p-8">
            <p className="text-sm font-semibold text-ink">新しい減量計画を設定してください</p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
              目標体重と期限から必要なカロリー赤字を算出し、週次のカロリー収支とPFCバランスで進捗を確認します。
            </p>
            <Link
              href="/settings"
              className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-accent"
            >
              目標設定を開く <ChevronRight className="h-4 w-4" />
            </Link>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  const remaining =
    recentWeight.average == null ? null : Math.max(0, recentWeight.average - plan.target_weight_kg);
  const targetPace =
    ((plan.target_weight_kg - plan.starting_weight_kg) /
      ((new Date(plan.end_date).getTime() - new Date(plan.start_date).getTime()) / 86_400_000 +
        1)) *
    7;
  const weightTone: ReviewTone =
    pace.paceKgPerWeek == null ? 'none' : pace.paceKgPerWeek <= targetPace * 0.75 ? 'good' : 'bad';

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:py-10">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-ink">Yuto&apos;s Diet Dashboard</h1>
            {latestDate && (
              <p className="mt-1 text-xs text-ink-muted">
                最終同期: {format(parseISO(latestDate), 'yyyy年M月d日', { locale: ja })}
              </p>
            )}
          </div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-secondary hover:text-ink"
          >
            <Settings className="h-4 w-4" /> 目標を編集
          </Link>
        </header>

        <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
          <div className="grid gap-7 lg:grid-cols-2">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink">体重計画</p>
                <ReviewBadge tone={weightTone} good="順調" bad="ペースを要調整" />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-ink-muted">開始時7日平均</p>
                  <p className="mt-1 text-xl font-semibold text-ink">
                    {plan.starting_weight_kg.toFixed(1)}
                    <span className="ml-1 text-sm font-medium text-ink-secondary">kg</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">現在7日平均</p>
                  <p className="mt-1 text-xl font-semibold text-ink">
                    {recentWeight.average?.toFixed(1) ?? '—'}
                    <span className="ml-1 text-sm font-medium text-ink-secondary">kg</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">目標まで</p>
                  <p className="mt-1 text-xl font-semibold text-ink">
                    {remaining?.toFixed(1) ?? '—'}
                    <span className="ml-1 text-sm font-medium text-ink-secondary">kg</span>
                  </p>
                </div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full bg-accent"
                  style={{
                    width: `${recentWeight.average == null ? 0 : Math.min(100, Math.max(0, ((plan.starting_weight_kg - recentWeight.average) / (plan.starting_weight_kg - plan.target_weight_kg)) * 100))}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                目標 {plan.target_weight_kg} kg ・ 期限{' '}
                {format(parseISO(plan.end_date), 'yyyy年M月d日', { locale: ja })} ・ 実績{' '}
                {pace.paceKgPerWeek?.toFixed(2) ?? '—'} / 計画 {targetPace.toFixed(2)} kg/週
              </p>
            </div>
            <div className="border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink">今週のエネルギー計画</p>
                <ReviewBadge tone={review.calories.tone} good="赤字を達成" bad="赤字が不足" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-ink-muted">必要日次赤字</p>
                  <p className="mt-1 text-xl font-semibold text-ink">{formatKcal(dailyDeficit)}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">摂取カロリー目安</p>
                  <p className="mt-1 text-xl font-semibold text-ink">
                    {formatKcal(review.calories.budget)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">今週の実績赤字</p>
                  <p className="mt-1 text-xl font-semibold text-ink">
                    {formatKcal(review.calories.actualDeficit)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">今週の目標赤字</p>
                  <p className="mt-1 text-xl font-semibold text-ink">
                    {formatKcal(review.calories.requiredDeficit)}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs text-ink-muted">
                総消費 {formatKcal(review.calories.avgBurned)} / 摂取{' '}
                {formatKcal(review.calories.avgIntake)}（{review.calories.validDays}/7日で算出）
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-3">
          <SectionCard
            title="今週のカロリー収支"
            onClick={() => setDetailPanel('calories')}
            ariaLabel="カロリー収支の詳細を開く"
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-2xl font-semibold text-ink">
                {formatKcal(review.calories.actualDeficit)}
              </p>
              <ReviewBadge tone={review.calories.tone} good="達成" bad="不足" />
            </div>
            <p className="mt-2 text-xs text-ink-muted">
              目標 {formatKcal(review.calories.requiredDeficit)} ・ 記録 {review.calories.validDays}
              /7日
            </p>
            <div className="mt-4 space-y-1 text-xs text-ink-secondary">
              <p>安静時 {formatKcal(review.calories.avgResting)}</p>
              <p>活動 {formatKcal(review.calories.avgActive)}</p>
            </div>
            <p className="mt-4 text-xs font-medium text-accent">クリックして詳細を見る</p>
          </SectionCard>
          <SectionCard
            title="今週のPFCバランス"
            onClick={() => setDetailPanel('pfc')}
            ariaLabel="PFCバランスの詳細を開く"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-ink-muted">{review.pfc.validDays}/7日平均</p>
              <ReviewBadge tone={review.pfc.tone} good="すべて達成" bad="要調整" />
            </div>
            <div className="mt-4 divide-y divide-line">
              <MacroOverview
                name="たんぱく質"
                actual={review.pfc.protein}
                target={plan.protein_target_percent}
                minimum
              />
              <MacroOverview
                name="脂質"
                actual={review.pfc.fat}
                target={plan.fat_target_percent}
                minimum={false}
              />
              <MacroOverview
                name="炭水化物"
                actual={review.pfc.carbohydrate}
                target={plan.carbohydrate_target_percent}
                minimum={false}
              />
            </div>
            <p className="mt-3 text-xs text-ink-muted">
              縦線が目標位置です。タップして日別の詳細を見る
            </p>
          </SectionCard>
          <SectionCard
            title="歩数習慣"
            onClick={() => setDetailPanel('steps')}
            ariaLabel="歩数習慣の詳細を開く"
          >
            <p className="text-2xl font-semibold text-ink">
              {review.steps.average == null
                ? '—'
                : Math.round(review.steps.average).toLocaleString()}
              <span className="ml-1 text-sm font-medium text-ink-secondary">歩/日</span>
            </p>
            <p className="mt-2 text-xs text-ink-muted">
              目標 {plan.daily_steps_target?.toLocaleString() ?? '未設定'} 歩 ・ 達成{' '}
              {review.steps.achievedDays}/{review.steps.validDays}日
            </p>
            <p className="mt-4 text-xs text-ink-secondary">
              直近日: {review.steps.latest?.toLocaleString() ?? '—'} 歩
            </p>
            <p className="mt-4 text-xs font-medium text-accent">クリックして詳細を見る</p>
          </SectionCard>
        </div>

        <DailyCheck review={review} />

        <div className="flex items-center justify-between pt-1">
          <h2 className="text-base font-semibold text-ink">推移</h2>
          <RangeSelector value={range} onChange={setRange} />
        </div>
        <SectionCard
          title="体重の推移"
          action={<span className="text-xs text-ink-muted">7日平均を主表示</span>}
        >
          <WeightChart data={chartData} targetWeightKg={plan.target_weight_kg} height={320} />
        </SectionCard>
        <div className="grid gap-4 md:grid-cols-2">
          <SectionCard
            title="今週の日別赤字"
            action={<span className="text-xs text-ink-muted">総消費 − 摂取</span>}
          >
            <DeficitChart data={chartData} targetDeficit={dailyDeficit} />
          </SectionCard>
          <SectionCard
            title="PFCの7日推移"
            action={<span className="text-xs text-ink-muted">破線: 目標 / 点: 日別判定</span>}
          >
            <PFCCompositionChart data={chartData} goal={plan} />
          </SectionCard>
          <SectionCard title="歩数" className="md:col-span-2">
            <StepsChart data={chartData} targetSteps={plan.daily_steps_target} />
          </SectionCard>
        </div>
        <DetailModal panel={detailPanel} onClose={() => setDetailPanel(null)}>
          {detailPanel === 'calories' && (
            <div>
              <DetailRow
                label="週次実績赤字"
                value={formatKcal(review.calories.actualDeficit)}
                emphasis
              />
              <DetailRow label="週次目標赤字" value={formatKcal(review.calories.requiredDeficit)} />
              <DetailRow label="必要日次赤字" value={formatKcal(dailyDeficit)} />
              <DetailRow label="摂取カロリー目安" value={formatKcal(review.calories.budget)} />
              <DetailRow label="総消費平均" value={formatKcal(review.calories.avgBurned)} />
              <DetailRow label="摂取平均" value={formatKcal(review.calories.avgIntake)} />
              <DetailRow label="安静時消費平均" value={formatKcal(review.calories.avgResting)} />
              <DetailRow label="活動消費平均" value={formatKcal(review.calories.avgActive)} />
              <DetailRow label="判定に使った日数" value={`${review.calories.validDays}/7日`} />
            </div>
          )}
          {detailPanel === 'pfc' && (
            <div>
              <DetailRow
                label="週次P"
                value={`${formatPercent(review.pfc.protein)}（目標以上 ${plan.protein_target_percent}%）`}
                emphasis
              />
              <DetailRow
                label="週次F"
                value={`${formatPercent(review.pfc.fat)}（目標以下 ${plan.fat_target_percent}%）`}
              />
              <DetailRow
                label="週次C"
                value={`${formatPercent(review.pfc.carbohydrate)}（目標以下 ${plan.carbohydrate_target_percent}%）`}
              />
              <DetailRow label="判定に使った日数" value={`${review.pfc.validDays}/7日`} />
              <div className="mt-5 rounded-lg bg-surface-2 p-4">
                <p className="text-xs font-semibold text-ink-secondary">直近日のPFC比率</p>
                <p className="mt-2 text-sm text-ink">
                  P {formatPercent(review.daily[review.daily.length - 1]?.protein ?? null)} / F{' '}
                  {formatPercent(review.daily[review.daily.length - 1]?.fat ?? null)} / C{' '}
                  {formatPercent(review.daily[review.daily.length - 1]?.carbohydrate ?? null)}
                </p>
              </div>
            </div>
          )}
          {detailPanel === 'steps' && (
            <div>
              <DetailRow
                label="直近日の歩数"
                value={
                  review.steps.latest == null ? '—' : `${review.steps.latest.toLocaleString()} 歩`
                }
                emphasis
              />
              <DetailRow
                label="7日平均"
                value={
                  review.steps.average == null
                    ? '—'
                    : `${Math.round(review.steps.average).toLocaleString()} 歩/日`
                }
              />
              <DetailRow
                label="日次目標"
                value={
                  plan.daily_steps_target == null
                    ? '未設定'
                    : `${plan.daily_steps_target.toLocaleString()} 歩`
                }
              />
              <DetailRow
                label="達成日数"
                value={`${review.steps.achievedDays}/${review.steps.validDays}日`}
              />
              <div className="mt-5 space-y-2">
                {review.daily.map((day) => (
                  <div key={day.date} className="flex justify-between text-sm">
                    <span className="text-ink-muted">
                      {format(parseISO(day.date), 'M/d (E)', { locale: ja })}
                    </span>
                    <span
                      className={
                        day.stepsTone === 'good'
                          ? 'font-medium text-status-good'
                          : day.stepsTone === 'bad'
                            ? 'font-medium text-status-bad'
                            : 'text-ink-muted'
                      }
                    >
                      {day.steps == null ? '未記録' : `${day.steps.toLocaleString()} 歩`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DetailModal>
      </main>
      <Footer />
    </div>
  );
}
