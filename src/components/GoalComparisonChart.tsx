import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Goal, HealthData } from '@/types/health';
import { calculateIntakeCalories } from '@/lib/utils/calorieCalculator';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface GoalComparisonChartProps {
  goal: Goal;
  healthData: HealthData[];
  dateRange: number;
}

export default function GoalComparisonChart({ goal, healthData, dateRange }: GoalComparisonChartProps) {
  const processChartData = () => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - dateRange);
    
    return healthData
      .filter(item => new Date(item.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(item => ({
        date: format(new Date(item.date), 'MM/dd', { locale: ja }),
        actualCalories: calculateIntakeCalories(item.proteinG, item.fatG, item.carbohydrateG),
        actualProtein: item.proteinG,
        actualFat: item.fatG,
        actualCarb: item.carbohydrateG,
        actualSteps: item.steps,
        targetCaloriesMin: goal.dailyCalorieIntakeMin,
        targetCaloriesMax: goal.dailyCalorieIntakeMax,
        targetProteinMin: goal.dailyProteinMinG,
        targetProteinMax: goal.dailyProteinMaxG,
        targetFatMin: goal.dailyFatMinG,
        targetFatMax: goal.dailyFatMaxG,
        targetCarbMin: goal.dailyCarbMinG,
        targetCarbMax: goal.dailyCarbMaxG,
        targetSteps: goal.dailyStepsTarget,
      }));
  };

  const chartData = processChartData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value !== null ? entry.value.toFixed(1) : '-'}
              {entry.dataKey.includes('Calories') ? 'kcal' : 
               entry.dataKey.includes('Steps') ? '歩' : 'g'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* カロリー比較チャート */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">摂取カロリー vs 目標</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine 
              y={goal.dailyCalorieIntakeMin || 0} 
              stroke="#10B981" 
              strokeDasharray="5 5" 
              label="最小目標"
            />
            <ReferenceLine 
              y={goal.dailyCalorieIntakeMax || 0} 
              stroke="#EF4444" 
              strokeDasharray="5 5" 
              label="最大目標"
            />
            <Bar dataKey="actualCalories" fill="#3B82F6" name="実際の摂取カロリー" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* PFC栄養素比較チャート */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">PFC栄養素 vs 目標</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="actualProtein" fill="#EF4444" name="タンパク質 (実際)" />
            <Bar dataKey="actualFat" fill="#F59E0B" name="脂質 (実際)" />
            <Bar dataKey="actualCarb" fill="#D97706" name="炭水化物 (実際)" />
          </BarChart>
        </ResponsiveContainer>
        
        {/* 目標範囲の表示 */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="text-center p-2 bg-red-50 rounded">
            <p className="font-medium text-red-700">タンパク質目標</p>
            <p className="text-red-600">
              {goal.dailyProteinMinG?.toFixed(1)} - {goal.dailyProteinMaxG?.toFixed(1)}g
            </p>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded">
            <p className="font-medium text-yellow-700">脂質目標</p>
            <p className="text-yellow-600">
              {goal.dailyFatMinG?.toFixed(1)} - {goal.dailyFatMaxG?.toFixed(1)}g
            </p>
          </div>
          <div className="text-center p-2 bg-orange-50 rounded">
            <p className="font-medium text-orange-700">炭水化物目標</p>
            <p className="text-orange-600">
              {goal.dailyCarbMinG?.toFixed(1)} - {goal.dailyCarbMaxG?.toFixed(1)}g
            </p>
          </div>
        </div>
      </div>

      {/* 歩数比較チャート */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">歩数 vs 目標</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine 
              y={goal.dailyStepsTarget || 0} 
              stroke="#10B981" 
              strokeDasharray="5 5" 
              label="目標歩数"
            />
            <Bar dataKey="actualSteps" fill="#10B981" name="実際の歩数" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}