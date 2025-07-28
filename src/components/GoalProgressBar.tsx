import React from 'react';
import { Target, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { GoalProgress } from '@/types/health';

interface GoalProgressBarProps {
  progress: GoalProgress;
}

export default function GoalProgressBar({ progress }: GoalProgressBarProps) {
  const { goal, currentWeight, daysRemaining, totalDays, progressPercentage, isOnTrack } = progress;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">{goal.name}</h2>
            <p className="text-sm text-gray-600">{goal.description}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isOnTrack ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {isOnTrack ? '順調' : '要注意'}
        </div>
      </div>

      {/* 目標体重と現在の体重 */}
      {goal.target_weight_kg && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-600 mb-1">目標体重</p>
            <p className="text-2xl font-bold text-blue-900">{goal.target_weight_kg} kg</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-1">現在の体重</p>
            <p className="text-2xl font-bold text-gray-900">
              {currentWeight ? `${currentWeight} kg` : '-'}
            </p>
            {currentWeight && goal.target_weight_kg && (
              <div className="flex items-center justify-center mt-2">
                {currentWeight > goal.target_weight_kg ? (
                  <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                )}
                <span className={`text-sm ${
                  currentWeight > goal.target_weight_kg ? 'text-red-500' : 'text-green-500'
                }`}>
                  {Math.abs(currentWeight - goal.target_weight_kg).toFixed(1)} kg
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 期間の進捗 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">期間の進捗</span>
          <span className="text-sm text-gray-600">{progressPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, progressPercentage)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            <span>残り {daysRemaining} 日</span>
          </div>
          <span>全 {totalDays} 日</span>
        </div>
      </div>

    </div>
  );
}