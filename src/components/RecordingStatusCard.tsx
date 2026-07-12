import React from 'react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Scale, UtensilsCrossed } from 'lucide-react';
import { DailyRecordFlag } from '@/lib/utils/weeklyStats';

interface RecordingStatusCardProps {
  records: DailyRecordFlag[];
}

function DotRow({
  icon,
  label,
  records,
  getFlag,
}: {
  icon: React.ReactNode;
  label: string;
  records: DailyRecordFlag[];
  getFlag: (record: DailyRecordFlag) => boolean;
}) {
  const count = records.filter(getFlag).length;
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 w-20 sm:w-24 flex-shrink-0 text-ink-secondary">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="flex gap-1.5">
        {records.map((record) => {
          const recorded = getFlag(record);
          return (
            <span
              key={record.date}
              title={`${format(parseISO(record.date), 'M/d (E)', { locale: ja })}: ${recorded ? '記録あり' : '未記録'}`}
              className={`w-4 h-4 rounded-full ${
                recorded ? 'bg-accent' : 'border border-line bg-surface-2'
              }`}
            />
          );
        })}
      </div>
      <span className="text-xs text-ink-secondary font-medium ml-auto tabular-nums">
        {count}/{records.length}日
      </span>
    </div>
  );
}

export default function RecordingStatusCard({ records }: RecordingStatusCardProps) {
  return (
    <section className="bg-surface border border-line rounded-xl p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-ink-secondary mb-3">記録状況（直近7日）</h2>
      <div className="space-y-2.5">
        {/* 曜日ヘッダー(ドット列と同じ構造で整列させる) */}
        <div className="flex items-center gap-3" aria-hidden="true">
          <div className="w-20 sm:w-24 flex-shrink-0" />
          <div className="flex gap-1.5">
            {records.map((record) => (
              <span
                key={record.date}
                className="w-4 text-center text-[10px] leading-none text-ink-muted"
              >
                {format(parseISO(record.date), 'EEEEE', { locale: ja })}
              </span>
            ))}
          </div>
        </div>
        <DotRow
          icon={<Scale className="w-3.5 h-3.5" />}
          label="体重測定"
          records={records}
          getFlag={(record) => record.hasWeight}
        />
        <DotRow
          icon={<UtensilsCrossed className="w-3.5 h-3.5" />}
          label="食事記録"
          records={records}
          getFlag={(record) => record.hasDiet}
        />
      </div>
    </section>
  );
}
