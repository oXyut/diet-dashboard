import React from 'react';

interface TooltipPayloadEntry {
  value?: number | string | null;
  name?: string;
  dataKey?: string | number;
  color?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  labelFormatter?: (label: string) => string;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  labelFormatter,
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded shadow-md">
        <p className="text-sm font-medium text-gray-900 mb-1">
          {label !== undefined && labelFormatter ? labelFormatter(label) : label}
        </p>
        {payload.map((entry, index) => {
          const value = entry.value;
          const displayValue =
            value !== null && value !== undefined
              ? `${entry.value}${entry.dataKey === 'bodyFat' ? '%' : entry.dataKey === 'weight' || entry.dataKey === 'muscleMass' ? ' kg' : entry.dataKey === 'calories' ? ' kcal' : ''}`
              : '未記録';

          return (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {displayValue}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};
