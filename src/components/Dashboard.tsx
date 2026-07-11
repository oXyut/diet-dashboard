'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, parseISO, differenceInDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  TrendingDown,
  TrendingUp,
  Activity,
  Flame,
  Weight,
  Percent,
  Beef,
  Wheat,
  Sandwich,
  Calculator,
  Info,
  Target,
  Calendar,
} from 'lucide-react';
import { HealthData, Goal, GoalProgress } from '@/types/health';
import { CustomTooltip } from './CustomTooltip';
import { calculateIntakeCalories, calculatePFCRatio } from '@/lib/utils/calorieCalculator';
import { calculateGoalProgress } from '@/lib/utils/goalCalculator';
import { getYesterdayInJST } from '@/lib/utils/dateUtils';
import { calculateLinearWeightGoal } from '@/lib/utils/weightGoalCalculator';
import { MetricsCard } from './MetricsCard';
import GoalComparisonChart from './GoalComparisonChart';
import Footer from './Footer';

export default function Dashboard() {
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalProgress, setGoalProgress] = useState<GoalProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30);
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'charts'>('overview');

  useEffect(() => {
    // goalProgressを一旦リセット
    setGoalProgress(null);
    fetchHealthData();
    fetchGoals();
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

      // 目標進捗の計算はuseEffectで行うため、ここではスキップ
      // fetchGoalsが呼ばれる時点ではhealthDataが古い可能性があるため
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    }
  };

  // 目標進捗の再計算（健康データが更新されたとき）
  useEffect(() => {
    if (goals.length > 0 && healthData.length > 0) {
      const activeGoal = goals[0];

      // 昨日の日付を取得（日本時間）
      const yesterdayStr = getYesterdayInJST();

      // 昨日のデータを優先的に使用
      let targetHealthData = healthData.find((data) => data.date === yesterdayStr);
      if (!targetHealthData) {
        targetHealthData = healthData[0];
      }

      // 目標データの妥当性確認
      if (activeGoal && activeGoal.start_date && activeGoal.end_date) {
        try {
          const progress = calculateGoalProgress(activeGoal, targetHealthData);
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
      .filter((item) => item.date && new Date(item.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 日付キーはYYYY-MM-DD形式で保持し、表示時のみMM/ddにフォーマットする
    const chartData = filteredData.map((item) => ({
      date: item.date,
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

    // 目標線データを追加
    if (goals.length > 0) {
      const goal = goals[0];
      const goalData = calculateLinearWeightGoal(goal, healthData, dateRange);

      // chartDataと目標データをマージ
      return chartData.map((item) => {
        const goalItem = goalData.find((g) => g.date === item.date);
        return {
          ...item,
          targetWeight: goalItem?.targetWeight,
          linearTarget: goalItem?.linearTarget,
        };
      });
    }

    return chartData;
  };

  // YYYY-MM-DD形式の日付キーをグラフ表示用のMM/dd形式にフォーマットする
  const formatDateLabel = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MM/dd', { locale: ja });
    } catch {
      return dateStr;
    }
  };

  // 体重グラフのY軸範囲を実データ・目標線・目標体重をすべて含む範囲から算出する
  const getWeightAxisDomain = (
    data: ReturnType<typeof processDataForCharts>
  ): [number, number] | [string, string] => {
    const weightValues = data
      .flatMap((item) => [
        item.weight,
        'targetWeight' in item ? item.targetWeight : undefined,
        'linearTarget' in item ? item.linearTarget : undefined,
      ])
      .filter((value): value is number => typeof value === 'number');

    if (weightValues.length === 0) {
      return ['dataMin - 5', 'dataMax + 5'];
    }

    const margin = 1;
    return [
      Math.floor(Math.min(...weightValues) - margin),
      Math.ceil(Math.max(...weightValues) + margin),
    ];
  };

  const getLatestMetrics = () => {
    if (healthData.length === 0) return null;

    // 昨日の日付を取得（日本時間）
    const yesterdayStr = getYesterdayInJST();

    // 昨日のデータを優先的に探す
    let targetData = healthData.find((data) => data.date === yesterdayStr);

    // 昨日のデータがなければ最新のデータを使用
    if (!targetData) {
      targetData = healthData[0];
    }

    // 前日のデータを取得（体重変化計算用）
    // 配列の隣接要素ではなく、実際の日付差が1日であることを確認する
    // （欠損日がある場合は数日分の差になってしまうため、前日比は表示しない）
    const targetIndex = healthData.findIndex((data) => data.id === targetData.id);
    const previous = healthData[targetIndex + 1];
    const isPreviousDay =
      previous?.date && targetData.date
        ? differenceInDays(parseISO(targetData.date), parseISO(previous.date)) === 1
        : false;

    const weightChange =
      isPreviousDay && targetData.weight && previous?.weight
        ? targetData.weight - previous.weight
        : 0;

    return {
      date: targetData.date,
      weight: targetData.weight,
      weightChange,
      bodyFat: targetData.bodyFatPercentage,
      steps: targetData.steps,
      calories: targetData.totalCalories,
      // PFC栄養素
      protein: targetData.proteinG,
      fat: targetData.fatG,
      carbohydrate: targetData.carbohydrateG,
      // 摂取カロリー（PFCから計算）
      intakeCalories: calculateIntakeCalories(
        targetData.proteinG,
        targetData.fatG,
        targetData.carbohydrateG
      ),
      // PFC比率
      pfcRatio: calculatePFCRatio(targetData.proteinG, targetData.fatG, targetData.carbohydrateG),
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
  const weightAxisDomain = getWeightAxisDomain(chartData);
  const latestMetrics = getLatestMetrics();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Yuto&apos;s Diet Dashboard</h1>
        </div>

        {/* タブナビゲーション */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Activity className="w-4 h-4 inline mr-2" />
                昨日の状況
              </button>
              <button
                onClick={() => setActiveTab('goals')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'goals'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Target className="w-4 h-4 inline mr-2" />
                目標比較
              </button>
              <button
                onClick={() => setActiveTab('charts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'charts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 詳細チャート
              </button>
            </nav>
          </div>
        </div>

        {/* 昨日の状況タブ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 日付表示と残り日数 */}
            {latestMetrics && latestMetrics.date && (
              <div className="text-center mb-4">
                <div className="text-lg font-medium text-gray-700">
                  {format(new Date(latestMetrics.date), 'yyyy年MM月dd日', { locale: ja })}の記録
                </div>
                {goalProgress && (
                  <div className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>目標まで残り {goalProgress.daysRemaining} 日</span>
                    <span className="text-xs">
                      (
                      {goalProgress.goal.target_weight_kg &&
                        `目標: ${goalProgress.goal.target_weight_kg}kg`}
                      )
                    </span>
                  </div>
                )}
              </div>
            )}

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
                </div>
              </div>
            </div>

            {latestMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* 体重カード */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">体重</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {latestMetrics.weight !== null && latestMetrics.weight !== undefined
                          ? `${latestMetrics.weight.toFixed(1)} kg`
                          : '-'}
                      </p>
                      {latestMetrics.weight !== null &&
                        latestMetrics.weight !== undefined &&
                        latestMetrics.weightChange !== 0 && (
                          <p
                            className={`text-sm ${latestMetrics.weightChange > 0 ? 'text-red-600' : 'text-green-600'} flex items-center mt-1`}
                          >
                            {latestMetrics.weightChange > 0 ? (
                              <TrendingUp className="w-4 h-4 mr-1" />
                            ) : (
                              <TrendingDown className="w-4 h-4 mr-1" />
                            )}
                            {Math.abs(latestMetrics.weightChange).toFixed(1)} kg
                          </p>
                        )}
                    </div>
                    <Weight className="w-8 h-8 text-blue-500" />
                  </div>
                </div>

                {/* 体脂肪率カード */}
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

                {/* 統合されたメトリクスカード */}
                <MetricsCard
                  title="歩数"
                  value={latestMetrics.steps}
                  unit="歩"
                  icon={<Activity className="w-8 h-8 text-green-500" />}
                  achievement={goalProgress?.dailyAchievements.steps}
                  targetValue={goalProgress?.goal.daily_steps_target}
                />

                <MetricsCard
                  title="摂取カロリー"
                  value={latestMetrics.intakeCalories}
                  unit="kcal"
                  icon={<Calculator className="w-8 h-8 text-indigo-500" />}
                  achievement={goalProgress?.dailyAchievements.calories}
                  targetMin={goalProgress?.goal.daily_calorie_intake_min}
                  targetMax={goalProgress?.goal.daily_calorie_intake_max}
                  ratio={latestMetrics.pfcRatio}
                />

                <MetricsCard
                  title="タンパク質"
                  value={latestMetrics.protein}
                  unit="g"
                  icon={<Beef className="w-8 h-8 text-red-500" />}
                  achievement={goalProgress?.dailyAchievements.protein}
                  targetMin={goalProgress?.goal.daily_protein_min_g}
                  targetMax={goalProgress?.goal.daily_protein_max_g}
                />

                <MetricsCard
                  title="脂質"
                  value={latestMetrics.fat}
                  unit="g"
                  icon={<Sandwich className="w-8 h-8 text-yellow-500" />}
                  achievement={goalProgress?.dailyAchievements.fat}
                  targetMin={goalProgress?.goal.daily_fat_min_g}
                  targetMax={goalProgress?.goal.daily_fat_max_g}
                />

                <MetricsCard
                  title="炭水化物"
                  value={latestMetrics.carbohydrate}
                  unit="g"
                  icon={<Wheat className="w-8 h-8 text-amber-600" />}
                  achievement={goalProgress?.dailyAchievements.carbohydrate}
                  targetMin={goalProgress?.goal.daily_carb_min_g}
                  targetMax={goalProgress?.goal.daily_carb_max_g}
                />

                {/* 消費カロリー（目標なし） */}
                <MetricsCard
                  title="消費カロリー"
                  value={latestMetrics.calories}
                  unit="kcal"
                  icon={<Flame className="w-8 h-8 text-orange-500" />}
                />
              </div>
            )}

            {/* 基本的なグラフ表示 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">体重推移（過去30日）</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDateLabel} />
                    <YAxis domain={weightAxisDomain} />
                    <Tooltip content={<CustomTooltip labelFormatter={formatDateLabel} />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#3B82F6"
                      name="実際の体重 (kg)"
                      connectNulls={false}
                      strokeWidth={2}
                    />
                    {goalProgress && (
                      <>
                        <Line
                          type="monotone"
                          dataKey="linearTarget"
                          stroke="#10B981"
                          name="目標線形減少"
                          strokeDasharray="5 5"
                          connectNulls={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="targetWeight"
                          stroke="#EF4444"
                          name="目標体重"
                          strokeDasharray="3 3"
                          connectNulls={false}
                        />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">摂取カロリー vs 消費カロリー</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDateLabel} />
                    <YAxis />
                    <Tooltip content={<CustomTooltip labelFormatter={formatDateLabel} />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="intakeCalories"
                      stroke="#6366F1"
                      name="摂取カロリー (kcal)"
                      strokeWidth={2}
                      connectNulls={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="calories"
                      stroke="#F97316"
                      name="消費カロリー (kcal)"
                      strokeWidth={2}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* 目標比較タブ */}
        {activeTab === 'goals' && (
          <div className="space-y-6">
            {goalProgress ? (
              <GoalComparisonChart
                goal={goalProgress.goal}
                healthData={healthData}
                dateRange={dateRange}
              />
            ) : (
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <p className="text-gray-500 mb-4">目標データが設定されていません</p>
                <p className="text-sm text-gray-400">
                  CockroachDBにgoalsテーブルを作成し、目標データを登録してください
                </p>
              </div>
            )}
          </div>
        )}

        {/* 詳細チャートタブ */}
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
                    <XAxis dataKey="date" tickFormatter={formatDateLabel} />
                    <YAxis domain={weightAxisDomain} />
                    <Tooltip content={<CustomTooltip labelFormatter={formatDateLabel} />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#3B82F6"
                      name="実際の体重 (kg)"
                      connectNulls={false}
                      strokeWidth={2}
                    />
                    {goalProgress && (
                      <>
                        <Line
                          type="monotone"
                          dataKey="linearTarget"
                          stroke="#10B981"
                          name="目標線形減少"
                          strokeDasharray="5 5"
                          connectNulls={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="targetWeight"
                          stroke="#EF4444"
                          name="目標体重"
                          strokeDasharray="3 3"
                          connectNulls={false}
                        />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">体組成</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDateLabel} />
                    <YAxis />
                    <Tooltip content={<CustomTooltip labelFormatter={formatDateLabel} />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="bodyFat"
                      stroke="#8B5CF6"
                      name="体脂肪率 (%)"
                      connectNulls={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="muscleMass"
                      stroke="#10B981"
                      name="筋肉量 (kg)"
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">日々の活動量</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDateLabel} />
                    <YAxis />
                    <Tooltip content={<CustomTooltip labelFormatter={formatDateLabel} />} />
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
                    <XAxis dataKey="date" tickFormatter={formatDateLabel} />
                    <YAxis />
                    <Tooltip content={<CustomTooltip labelFormatter={formatDateLabel} />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="calories"
                      stroke="#F97316"
                      fill="#F97316"
                      fillOpacity={0.6}
                      name="消費カロリー (kcal)"
                      connectNulls={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">PFC栄養素</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDateLabel} />
                    <YAxis />
                    <Tooltip content={<CustomTooltip labelFormatter={formatDateLabel} />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="protein"
                      stroke="#EF4444"
                      name="タンパク質 (g)"
                      connectNulls={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="fat"
                      stroke="#F59E0B"
                      name="脂質 (g)"
                      connectNulls={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="carbohydrate"
                      stroke="#D97706"
                      name="炭水化物 (g)"
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
                <h2 className="text-xl font-semibold mb-4">摂取カロリー vs 消費カロリー</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDateLabel} />
                    <YAxis />
                    <Tooltip content={<CustomTooltip labelFormatter={formatDateLabel} />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="intakeCalories"
                      stroke="#6366F1"
                      name="摂取カロリー (kcal)"
                      strokeWidth={2}
                      connectNulls={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="calories"
                      stroke="#F97316"
                      name="消費カロリー (kcal)"
                      strokeWidth={2}
                      connectNulls={false}
                    />
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
