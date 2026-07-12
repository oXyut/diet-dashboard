import React from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title?: string;
  /** タイトル行の右側に置く要素(期間セレクタなど) */
  action?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
  children: React.ReactNode;
}

export default function SectionCard({
  title,
  action,
  className,
  onClick,
  ariaLabel,
  children,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        'bg-surface border border-line rounded-xl p-4 sm:p-5',
        onClick &&
          'cursor-pointer transition-colors hover:bg-surface-2 focus:outline-none focus:ring-2 focus:ring-accent',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
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
