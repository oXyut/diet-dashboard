import React from 'react';
import { formatDateLabel } from '@/lib/utils/chartData';

// dataKey ごとの表示単位。系列名は Recharts の name をそのまま使う
const UNIT_BY_DATA_KEY: Record<string, string> = {
  weight: 'kg',
  linearTarget: 'kg',
  targetWeight: 'kg',
  muscleMass: 'kg',
  bodyFat: '%',
  calories: 'kcal',
  intakeCalories: 'kcal',
  protein: 'g',
  fat: 'g',
  carbohydrate: 'g',
  steps: '歩',
};

interface TooltipPayloadEntry {
  value?: number | string | null;
  name?: string;
  dataKey?: string | number;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  /** dataKey → 補足テキスト(目標範囲など)を返す。あれば値の下に薄く表示 */
  extraByDataKey?: Record<string, string>;
}

export function ChartTooltip({ active, payload, label, extraByDataKey }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="bg-surface-2 border border-line rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-ink-secondary mb-1.5">
        {label !== undefined ? formatDateLabel(label) : ''}
      </p>
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const unit = entry.dataKey != null ? UNIT_BY_DATA_KEY[String(entry.dataKey)] : undefined;
          const hasValue = entry.value !== null && entry.value !== undefined;
          const displayValue = hasValue
            ? `${typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}${unit ? ` ${unit}` : ''}`
            : '未記録';
          const extra = entry.dataKey != null ? extraByDataKey?.[String(entry.dataKey)] : undefined;

          return (
            <div key={index} className="text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-ink-secondary">{entry.name}</span>
                <span className={hasValue ? 'text-ink font-medium' : 'text-ink-muted'}>
                  {displayValue}
                </span>
              </div>
              {extra && <p className="text-ink-muted pl-3.5">{extra}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
