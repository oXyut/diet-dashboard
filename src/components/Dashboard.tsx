'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { TrendingDown, TrendingUp, Activity, Flame, Weight, Percent, Beef, Wheat, Sandwich, Calculator, Info, Target } from 'lucide-react';
import { HealthData, DailyHealthMetrics, Goal, GoalProgress } from '@/types/health';
import { CustomTooltip } from './CustomTooltip';
import { calculateIntakeCalories, calculatePFCRatio } from '@/lib/utils/calorieCalculator';
import { calculateGoalProgress } from '@/lib/utils/goalCalculator';
import GoalProgressBar from './GoalProgressBar';
import GoalComparisonChart from './GoalComparisonChart';
import Footer from './Footer';

export default function Dashboard() {
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalProgress, setGoalProgress] = useState<GoalProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30);
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'charts'>('goals');

  useEffect(() => {
    fetchHealthData();
    fetchGoals();
    // 5秒ごとに自動更新（デバッグ用）
    const interval = setInterval(() => {
      fetchHealthData();
      fetchGoals();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealthData(data.data || []);
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals?active=true');
      const data = await response.json();
      const goalsData = data.data || [];
      setGoals(goalsData);
      
      // アクティブな目標の進捗を計算
      if (goalsData.length > 0 && healthData.length > 0) {
        const activeGoal = goalsData[0]; // 最初のアクティブな目標を使用
        const latestHealthData = healthData[0];
        
        // 目標データの妥当性確認
        if (activeGoal && activeGoal.startDate && activeGoal.endDate) {
          try {
            const progress = calculateGoalProgress(activeGoal, latestHealthData);
            setGoalProgress(progress);
          } catch (error) {
            console.error('Failed to calculate goal progress:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    }
  };

  // 目標進捗の再計算（健康データが更新されたとき）
  useEffect(() => {
    if (goals.length > 0 && healthData.length > 0) {
      const activeGoal = goals[0];
      const latestHealthData = healthData[0];
      
      // 目標データの妥当性確認
      if (activeGoal && activeGoal.startDate && activeGoal.endDate) {
        try {
          const progress = calculateGoalProgress(activeGoal, latestHealthData);
          setGoalProgress(progress);
        } catch (error) {
          console.error('Failed to calculate goal progress:', error);
        }
      }
    }
  }, [goals, healthData]);

  const processDataForCharts = () => {
    const cutoffDate = subDays(new Date(), dateRange);
    
    const filteredData = healthData
      .filter(item => item.date && new Date(item.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return filteredData.map(item => ({
      date: item.date ? format(new Date(item.date), 'MM/dd', { locale: ja }) : '-',
      weight: item.weight,
      bodyFat: item.bodyFatPercentage,
      muscleMass: item.muscleMass,
      steps: item.steps,
      calories: item.totalCalories,
      // PFC栄養素
      protein: item.proteinG,
      fat: item.fatG,
      carbohydrate: item.carbohydrateG,
      // 摂取カロリー（PFCから計算）
      intakeCalories: calculateIntakeCalories(item.proteinG, item.fatG, item.carbohydrateG),
      // その他の栄養素
      fiber: item.fiberG,
      sugar: item.sugarG,
      sodium: item.sodiumMg,
    }));
  };

  const getLatestMetrics = () => {
    if (healthData.length === 0) return null;
    
    const latest = healthData[0];
    const previous = healthData[1];
    
    const weightChange = latest.weight && previous?.weight 
      ? latest.weight - previous.weight 
      : 0;
    
    return {
      weight: latest.weight,
      weightChange,
      bodyFat: latest.bodyFatPercentage,
      steps: latest.steps,
      calories: latest.totalCalories,
      // PFC栄養素
      protein: latest.proteinG,
      fat: latest.fatG,
      carbohydrate: latest.carbohydrateG,
      // 摂取カロリー（PFCから計算）
      intakeCalories: calculateIntakeCalories(latest.proteinG, latest.fatG, latest.carbohydrateG),
      // PFC比率
      pfcRatio: calculatePFCRatio(latest.proteinG, latest.fatG, latest.carbohydrateG),
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  const chartData = processDataForCharts();
  const latestMetrics = getLatestMetrics();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ダイエットダッシュボード</h1>
        </div>
        
        <div className="mb-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">食事の詳細情報について</p>
              <p>
                詳しい食事内容や栄養バランスは
                <a 
                  href="https://www.asken.jp" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline font-medium hover:text-blue-900"
                >
                  「あすけん」アプリ
                </a>
                でご確認いただけます。
              </p>
              {process.env.NEXT_PUBLIC_ASKEN_MEMBER_ID && (
                <p className="mt-1 text-xs">会員ID: {process.env.NEXT_PUBLIC_ASKEN_MEMBER_ID}</p>
              )}
            </div>
          </div>
          
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value={7}>過去7日間</option>
            <option value={30}>過去30日間</option>
            <option value={90}>過去90日間</option>
          </select>
        </div>

        {latestMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">体重</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {latestMetrics.weight !== null && latestMetrics.weight !== undefined 
                      ? `${latestMetrics.weight.toFixed(1)} kg` 
                      : '-'}
                  </p>
                  {latestMetrics.weight !== null && latestMetrics.weight !== undefined && latestMetrics.weightChange !== 0 && (
                    <p className={`text-sm ${latestMetrics.weightChange > 0 ? 'text-red-600' : 'text-green-600'} flex items-center mt-1`}>
                      {latestMetrics.weightChange > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                      {Math.abs(latestMetrics.weightChange).toFixed(1)} kg
                    </p>
                  )}
                </div>
                <Weight className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">体脂肪率</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {latestMetrics.bodyFat !== null && latestMetrics.bodyFat !== undefined 
                      ? `${latestMetrics.bodyFat.toFixed(1)}%` 
                      : '-'}
                  </p>
                </div>
                <Percent className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">歩数</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {latestMetrics.steps !== null && latestMetrics.steps !== undefined 
                      ? latestMetrics.steps.toLocaleString() 
                      : '-'}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">消費カロリー</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {latestMetrics.calories !== null && latestMetrics.calories !== undefined 
                      ? `${latestMetrics.calories.toLocaleString()} kcal` 
                      : '-'}
                  </p>
                </div>
                <Flame className="w-8 h-8 text-orange-500" />
              </div>
            </div>

            {/* PFC栄養素カード */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">タンパク質</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {latestMetrics.protein !== null && latestMetrics.protein !== undefined 
                      ? `${latestMetrics.protein.toFixed(1)}g` 
                      : '-'}
                  </p>
                </div>
                <Beef className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">脂質</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {latestMetrics.fat !== null && latestMetrics.fat !== undefined 
                      ? `${latestMetrics.fat.toFixed(1)}g` 
                      : '-'}
                  </p>
                </div>
                <Sandwich className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">炭水化物</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {latestMetrics.carbohydrate !== null && latestMetrics.carbohydrate !== undefined 
                      ? `${latestMetrics.carbohydrate.toFixed(1)}g` 
                      : '-'}
                  </p>
                </div>
                <Wheat className="w-8 h-8 text-amber-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">摂取カロリー</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {latestMetrics.intakeCalories !== null && latestMetrics.intakeCalories !== undefined 
                      ? `${latestMetrics.intakeCalories.toFixed(0)} kcal` 
                      : '-'}
                  </p>
                  {latestMetrics.pfcRatio && (
                    <p className="text-xs text-gray-500 mt-1">
                      P:{latestMetrics.pfcRatio.protein.toFixed(0)}% 
                      F:{latestMetrics.pfcRatio.fat.toFixed(0)}% 
                      C:{latestMetrics.pfcRatio.carbohydrate.toFixed(0)}%
                    </p>
                  )}
                </div>
                <Calculator className="w-8 h-8 text-indigo-500" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="space-y-6">
            <div className="mb-6">
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value={7}>過去7日間</option>
                <option value={30}>過去30日間</option>
                <option value={90}>過去90日間</option>
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">体重推移</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="weight" stroke="#3B82F6" name="体重 (kg)" connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">体組成</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="bodyFat" stroke="#8B5CF6" name="体脂肪率 (%)" connectNulls={false} />
                    <Line type="monotone" dataKey="muscleMass" stroke="#10B981" name="筋肉量 (kg)" connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">日々の活動量</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="steps" fill="#10B981" name="歩数" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">消費カロリー</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="calories" stroke="#F97316" fill="#F97316" fillOpacity={0.6} name="消費カロリー (kcal)" connectNulls={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">PFC栄養素</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="protein" stroke="#EF4444" name="タンパク質 (g)" connectNulls={false} />
                    <Line type="monotone" dataKey="fat" stroke="#F59E0B" name="脂質 (g)" connectNulls={false} />
                    <Line type="monotone" dataKey="carbohydrate" stroke="#D97706" name="炭水化物 (g)" connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
                <h2 className="text-xl font-semibold mb-4">摂取カロリー vs 消費カロリー</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="intakeCalories" stroke="#6366F1" name="摂取カロリー (kcal)" strokeWidth={2} connectNulls={false} />
                    <Line type="monotone" dataKey="calories" stroke="#F97316" name="消費カロリー (kcal)" strokeWidth={2} connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}