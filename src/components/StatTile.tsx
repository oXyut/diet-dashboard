import React from 'react';
import { StatusBadge, StatusTone } from './StatusBadge';

interface StatTileProps {
  label: string;
  /** 表示用に整形済みの値。データなしは '-' を渡す */
  value: string;
  unit?: string;
  /** 値の下に出す補足(7日平均・目標範囲など) */
  sub?: React.ReactNode;
  badge?: {
    tone: StatusTone;
    icon: React.ReactNode;
    text: string;
  };
}

export default function StatTile({ label, value, unit, sub, badge }: StatTileProps) {
  return (
    <div className="bg-surface border border-line rounded-xl p-4 flex flex-col gap-1.5">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className="text-2xl font-semibold text-ink leading-tight">
        {value}
        {unit && value !== '-' && (
          <span className="text-sm font-medium text-ink-secondary ml-1">{unit}</span>
        )}
      </p>
      {sub && <div className="text-xs text-ink-secondary">{sub}</div>}
      {badge && (
        <div className="mt-auto pt-1">
          <StatusBadge tone={badge.tone} icon={badge.icon} className="!text-xs !px-2 !py-0.5">
            {badge.text}
          </StatusBadge>
        </div>
      )}
    </div>
  );
}
