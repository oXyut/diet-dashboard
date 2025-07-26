import React from 'react';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded shadow-md">
        <p className="text-sm font-medium text-gray-900 mb-1">{label}</p>
        {payload.map((entry, index) => {
          const value = entry.value;
          const displayValue = value !== null && value !== undefined 
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