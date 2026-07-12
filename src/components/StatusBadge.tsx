import React from 'react';

export type StatusTone = 'good' | 'warn' | 'bad' | 'none';

const TONE_COLOR: Record<StatusTone, string> = {
  good: 'var(--status-good)',
  warn: 'var(--status-warn)',
  bad: 'var(--status-bad)',
  none: 'var(--status-none)',
};

interface StatusBadgeProps {
  tone: StatusTone;
  /** 色単独に頼らないため、アイコン+テキストを必須にする */
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ tone, icon, children, className }: StatusBadgeProps) {
  const color = TONE_COLOR[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${className ?? ''}`}
      style={{ color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
    >
      {icon}
      {children}
    </span>
  );
}
