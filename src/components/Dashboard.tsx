'use client';

import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ArrowDown, ArrowUp, CheckCircle2, Minus } from 'lucide-react';
import { Goal, HealthData } from '@/types/health';
import { buildChartData } from '@/lib/utils/chartData';
import { getYesterdayInJST } from '@/lib/utils/dateUtils';
import { evaluateDietStatus } from '@/lib/utils/dietStatus';
import {
  AchievementCount,
  calculateCalorieBalance,
  countWeeklyAchievements,
  getRecordingStatus,
} from '@/lib/utils/weeklyStats';
import Footer from './Footer';
import HeroStatus from './HeroStatus';
import RangeSelector, { ChartRange } from './RangeSelector';
import RecordingStatusCard from './RecordingStatusCard';
import SectionCard from './SectionCard';
import StatTile from './StatTile';
import { StatusTone } from './StatusBadge';
import BodyCompositionCharts from './charts/BodyCompositionCharts';
import CalorieChart from './charts/CalorieChart';
import PFCChart from './charts/PFCChart';
import StepsChart from './charts/StepsChart';
import WeightChart from './charts/WeightChart';

interface DashboardProps {
  healthData: HealthData[];
  goals: Goal[];
}

// 週間達成率からバッジの色調を決める
function achievementTone(count: AchievementCount): StatusTone {
  if (count.daysWithData === 0) return 'none';
  const ratio = count.withinDays / count.daysWithData;
  if (ratio >= 0.7) return 'good';
  if (ratio >= 0.4) return 'warn';
  return 'bad';
}

function achievementBadge(count: AchievementCount, verb = '範囲内') {
  const tone = achievementTone(count);
  return {
    tone,
    icon: tone === 'good' ? <CheckCircle2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />,
    text:
      count.daysWithData > 0 ? `${count.withinDays}/${count.daysWithData}日 ${verb}` : 'データなし',
  };
}

function EmptyChart() {
  return (
    <div className="h-40 flex items-center justify-center text-sm text-ink-muted">
      表示できるデータがありません
    </div>
  );
}

export default function Dashboard({ healthData, goals }: DashboardProps) {
  const [range, setRange] = useState<ChartRange>(30);

  const activeGoal = goals[0] ?? null;
  // データは23:50送信のため「今日」は常に空。基準日は昨日(JST)
  const referenceDate = getYesterdayInJST();

  const dietStatus = useMemo(
    () => evaluateDietStatus(activeGoal, healthData, referenceDate),
    [activeGoal, healthData, referenceDate]
  );
  const records = useMemo(
    () => getRecordingStatus(healthData, referenceDate),
    [healthData, referenceDate]
  );
  const balance = useMemo(
    () => calculateCalorieBalance(healthData, referenceDate),
    [healthData, referenceDate]
  );
  const weekly = useMemo(
    () => (activeGoal ? countWeeklyAchievements(activeGoal, healthData, referenceDate) : null),
    [activeGoal, healthData, referenceDate]
  );
  const chartData = useMemo(
    () => buildChartData(healthData, activeGoal, range),
    [healthData, activeGoal, range]
  );

  const latestDate = healthData[0]?.date ?? null;
  const referenceData = healthData.find((item) => item.date === referenceDate) ?? null;

  const balanceBadge = (() => {
    if (balance.avgBalance === null) {
      return {
        tone: 'none' as StatusTone,
        icon: <Minus className="w-3 h-3" />,
        text: 'データなし',
      };
    }
    return balance.avgBalance <= 0
      ? {
          tone: 'good' as StatusTone,
          icon: <ArrowDown className="w-3 h-3" />,
          text: 'アンダーカロリー',
        }
      : {
          tone: 'bad' as StatusTone,
          icon: <ArrowUp className="w-3 h-3" />,
          text: 'オーバーカロリー',
        };
  })();

  return (
    <div className="min-h-screen">
      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-10 space-y-4 sm:space-y-5">
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink">Yuto&apos;s Diet Dashboard</h1>
          {latestDate && (
            <p className="text-xs text-ink-muted">
              最終記録: {format(parseISO(latestDate), 'yyyy年M月d日', { locale: ja })}
            </p>
          )}
        </header>

        <HeroStatus status={dietStatus} hasGoal={activeGoal !== null} />

        <RecordingStatusCard records={records} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatTile
            label="カロリー収支（7日平均）"
            value={
              balance.avgBalance !== null
                ? `${balance.avgBalance > 0 ? '+' : ''}${Math.round(balance.avgBalance).toLocaleString()}`
                : '-'
            }
            unit="kcal"
            sub={
              balance.daysWithBoth > 0
                ? `摂取と消費が揃った${balance.daysWithBoth}日で計算`
                : '摂取と消費が両方記録された日がありません'
            }
            badge={balanceBadge}
          />
          <StatTile
            label="摂取カロリー（7日平均）"
            value={
              balance.avgIntake !== null ? Math.round(balance.avgIntake).toLocaleString() : '-'
            }
            unit="kcal"
            sub={
              activeGoal?.daily_calorie_intake_min != null &&
              activeGoal?.daily_calorie_intake_max != null
                ? `目標 ${activeGoal.daily_calorie_intake_min.toLocaleString()}–${activeGoal.daily_calorie_intake_max.toLocaleString()} kcal/日`
                : balance.intakeDays > 0
                  ? `記録がある${balance.intakeDays}日で計算`
                  : undefined
            }
            badge={weekly ? achievementBadge(weekly.calories) : undefined}
          />
          <StatTile
            label="PFC同時達成（直近7日）"
            value={weekly && weekly.pfcAll.daysWithData > 0 ? `${weekly.pfcAll.withinDays}` : '-'}
            unit={weekly && weekly.pfcAll.daysWithData > 0 ? '日' : undefined}
            sub={
              weekly
                ? `P ${weekly.protein.withinDays}/${weekly.protein.daysWithData}・F ${weekly.fat.withinDays}/${weekly.fat.daysWithData}・C ${weekly.carb.withinDays}/${weekly.carb.daysWithData}`
                : undefined
            }
            badge={weekly ? achievementBadge(weekly.pfcAll, '達成') : undefined}
          />
          <StatTile
            label={`歩数（${format(parseISO(referenceDate), 'M/d', { locale: ja })}）`}
            value={referenceData?.steps != null ? referenceData.steps.toLocaleString() : '-'}
            unit="歩"
            sub={
              activeGoal?.daily_steps_target != null
                ? `目標 ${activeGoal.daily_steps_target.toLocaleString()} 歩/日`
                : undefined
            }
            badge={weekly ? achievementBadge(weekly.steps, '達成') : undefined}
          />
        </div>

        {/* 期間セレクタは以下の全チャートに効く */}
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-base font-semibold text-ink">推移チャート</h2>
          <RangeSelector value={range} onChange={setRange} />
        </div>

        <SectionCard title="体重推移 (kg)">
          {chartData.length > 0 ? (
            <WeightChart
              data={chartData}
              targetWeightKg={activeGoal?.target_weight_kg}
              height={320}
            />
          ) : (
            <EmptyChart />
          )}
        </SectionCard>

        <div className="grid md:grid-cols-2 gap-4">
          <SectionCard title="摂取 vs 消費カロリー (kcal)">
            {chartData.length > 0 ? <CalorieChart data={chartData} /> : <EmptyChart />}
          </SectionCard>
          <SectionCard title="PFC栄養素 (g)">
            {chartData.length > 0 ? (
              <PFCChart data={chartData} goal={activeGoal} />
            ) : (
              <EmptyChart />
            )}
          </SectionCard>
          {chartData.length > 0 && <BodyCompositionCharts data={chartData} />}
          <SectionCard title="歩数" className="md:col-span-2">
            {chartData.length > 0 ? (
              <StepsChart data={chartData} targetSteps={activeGoal?.daily_steps_target} />
            ) : (
              <EmptyChart />
            )}
          </SectionCard>
        </div>
      </main>
      <Footer />
    </div>
  );
}
