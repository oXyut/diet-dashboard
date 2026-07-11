import React from 'react';
import { getAchievementColor, getAchievementText } from '@/lib/utils/goalCalculator';
import { GoalProgress } from '@/types/health';
import { cn } from '@/lib/utils';

interface MetricsCardProps {
  title: string;
  value: number | null | undefined;
  unit: string;
  icon: React.ReactNode;
  achievement?: 'under' | 'within' | 'over' | 'achieved' | 'not_achieved' | 'no_data';
  targetMin?: number | null;
  targetMax?: number | null;
  targetValue?: number | null;
  ratio?: { protein: number; fat: number; carbohydrate: number } | null;
}

export function MetricsCard({
  title,
  value,
  unit,
  icon,
  achievement = 'no_data',
  targetMin,
  targetMax,
  targetValue,
  ratio
}: MetricsCardProps) {
  const hasTarget = targetMin !== undefined || targetMax !== undefined || targetValue !== undefined;
  const achievementColor = getAchievementColor(achievement);
  const achievementText = getAchievementText(achievement);

  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {value !== null && value !== undefined 
              ? `${typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value.toLocaleString()} ${unit}` 
              : '-'}
          </p>
          
          {/* PFC比率 */}
          {ratio && (
            <p className="text-xs text-gray-500 mt-1">
              P:{ratio.protein.toFixed(0)}% 
              F:{ratio.fat.toFixed(0)}% 
              C:{ratio.carbohydrate.toFixed(0)}%
            </p>
          )}
        </div>
        {icon}
      </div>

      {/* 目標と達成状況 */}
      {hasTarget && (
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              目標: {
                targetValue !== null && targetValue !== undefined ? (
                  `${targetValue.toLocaleString()}${unit}`
                ) : targetMin !== null && targetMin !== undefined && targetMax !== null && targetMax !== undefined ? (
                  `${targetMin}-${targetMax}${unit}`
                ) : targetMin !== null && targetMin !== undefined ? (
                  `${targetMin}${unit}以上`
                ) : targetMax !== null && targetMax !== undefined ? (
                  `${targetMax}${unit}以下`
                ) : '-'
              }
            </span>
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              achievement === 'within' || achievement === 'achieved' 
                ? "bg-green-100 text-green-700"
                : achievement === 'under' || achievement === 'not_achieved'
                ? "bg-red-100 text-red-700"
                : achievement === 'over'
                ? "bg-orange-100 text-orange-700"
                : "bg-gray-100 text-gray-500"
            )}>
              {achievementText}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}