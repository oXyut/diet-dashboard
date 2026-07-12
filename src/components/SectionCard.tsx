import React from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title?: string;
  /** タイトル行の右側に置く要素(期間セレクタなど) */
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export default function SectionCard({ title, action, className, children }: SectionCardProps) {
  return (
    <section className={cn('bg-surface border border-line rounded-xl p-4 sm:p-5', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {title && <h2 className="text-sm font-semibold text-ink-secondary">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
