import React from 'react';
import { cn } from '@/lib/utils';

export type ChartRange = number | null;

const OPTIONS: Array<{ label: string; value: ChartRange }> = [
  { label: '30日', value: 30 },
  { label: '90日', value: 90 },
  { label: '全期間', value: null },
];

interface RangeSelectorProps {
  value: ChartRange;
  onChange: (value: ChartRange) => void;
}

export default function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <div
      role="group"
      aria-label="表示期間"
      className="inline-flex rounded-lg border border-line bg-surface-2 p-0.5"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.label}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-md transition-colors',
            value === option.value
              ? 'bg-surface text-ink border border-line'
              : 'text-ink-muted hover:text-ink-secondary'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
