import React from 'react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { AlertCircle, Award, HelpCircle, PauseCircle, TrendingDown } from 'lucide-react';
import { DietStatusLevel, DietStatusSummary } from '@/lib/utils/dietStatus';
import { StatusBadge, StatusTone } from './StatusBadge';

const LEVEL_DISPLAY: Record<
  DietStatusLevel,
  { label: string; tone: StatusTone; icon: React.ReactNode }
> = {
  achieved: { label: '目標達成', tone: 'good', icon: <Award className="w-4 h-4" /> },
  on_track: { label: '順調', tone: 'good', icon: <TrendingDown className="w-4 h-4" /> },
  caution: { label: '注意', tone: 'warn', icon: <AlertCircle className="w-4 h-4" /> },
  stalled: { label: '停滞', tone: 'bad', icon: <PauseCircle className="w-4 h-4" /> },
  insufficient_data: {
    label: '判定不能',
    tone: 'none',
    icon: <HelpCircle className="w-4 h-4" />,
  },
};

function formatPace(pace: number): string {
  const sign = pace > 0 ? '+' : '';
  return `${sign}${pace.toFixed(2)}`;
}

function formatShortDate(dateStr: string): string {
  return format(parseISO(dateStr), 'M月d日', { locale: ja });
}

interface HeroStatusProps {
  status: DietStatusSummary;
  hasGoal: boolean;
}

export default function HeroStatus({ status, hasGoal }: HeroStatusProps) {
  const display = LEVEL_DISPLAY[status.level];
  const { pace } = status;

  return (
    <section className="bg-surface border border-line rounded-xl p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <StatusBadge tone={display.tone} icon={display.icon}>
          {display.label}
        </StatusBadge>
        <span className="text-xs text-ink-muted">直近7日 vs 前7日の週平均体重で判定</span>
      </div>

      {pace.paceKgPerWeek !== null ? (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-5xl sm:text-6xl font-semibold text-ink leading-none">
            {formatPace(pace.paceKgPerWeek)}
          </span>
          <span className="text-lg text-ink-secondary font-medium">kg/週</span>
          {status.targetPaceKgPerWeek !== null && (
            <span className="text-sm text-ink-muted">
              目標ペース {formatPace(status.targetPaceKgPerWeek)} kg/週
            </span>
          )}
        </div>
      ) : (
        <div className="text-ink-secondary text-sm leading-relaxed">
          週平均ペースを算出するには、直近7日と前7日にそれぞれ2日以上の体重記録が必要です
          <span className="text-ink-muted">
            （直近 {pace.recentCount} 日・前週 {pace.previousCount} 日）
          </span>
        </div>
      )}

      {status.level === 'insufficient_data' && !hasGoal && (
        <p className="mt-3 text-xs text-ink-muted">
          目標が未設定のため順調度を判定できません。目標を登録すると目標ペースとの比較が表示されます。
        </p>
      )}

      {(status.remainingKg !== null ||
        status.projectedGoalDate !== null ||
        status.daysRemaining !== null) && (
        <dl className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 border-t border-line pt-4">
          {status.remainingKg !== null && (
            <div>
              <dt className="text-xs text-ink-muted mb-0.5">目標まで</dt>
              <dd className="text-lg font-semibold text-ink">
                あと {Math.max(0, status.remainingKg).toFixed(1)}
                <span className="text-sm font-medium text-ink-secondary ml-1">kg</span>
              </dd>
            </div>
          )}
          {status.projectedGoalDate !== null && (
            <div>
              <dt className="text-xs text-ink-muted mb-0.5">現ペースでの到達予測</dt>
              <dd className="text-lg font-semibold text-ink">
                {formatShortDate(status.projectedGoalDate)}
              </dd>
            </div>
          )}
          {status.daysRemaining !== null && (
            <div>
              <dt className="text-xs text-ink-muted mb-0.5">目標期限まで</dt>
              <dd className="text-lg font-semibold text-ink">
                残り {status.daysRemaining}
                <span className="text-sm font-medium text-ink-secondary ml-1">日</span>
              </dd>
            </div>
          )}
        </dl>
      )}
    </section>
  );
}
