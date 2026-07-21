export interface HealthData {
  id: string;
  date: string;
  weight?: number | null;
  bodyFatPercentage?: number | null;
  muscleMass?: number | null;
  steps?: number | null;
  activeCalories?: number | null;
  restingCalories?: number | null;
  totalCalories?: number | null;
  dietaryCalories?: number | null;
  // PFC栄養素
  proteinG?: number | null;
  fatG?: number | null;
  carbohydrateG?: number | null;
  // その他の栄養素
  fiberG?: number | null;
  sugarG?: number | null;
  sodiumMg?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface DailyHealthMetrics {
  date: string;
  weight: number | null;
  bodyFatPercentage: number | null;
  muscleMass: number | null;
  steps: number;
  activeCalories: number;
  restingCalories: number;
  totalCalories: number;
}

export interface WeightTrend {
  date: string;
  weight: number;
  change: number;
  changePercentage: number;
}

export interface WeightPredictionContribution {
  feature: string;
  contribution_kg: number;
}

export interface WeightPrediction {
  id: string;
  targetDate: string;
  sourceDate: string;
  status: 'ready' | 'insufficient_data' | 'awaiting_training';
  predictionKg: number | null;
  interpretationKg: number | null;
  validationMaeKg: number | null;
  modelVersion: string | null;
  mlflowRunId: string | null;
  topContributions: WeightPredictionContribution[];
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  name: string;
  description?: string | null;
  target_weight_kg?: number | null;
  starting_weight_kg?: number | null;
  protein_target_percent?: number | null;
  fat_target_percent?: number | null;
  carbohydrate_target_percent?: number | null;
  start_date: string;
  end_date: string;
  daily_calorie_intake_min?: number | null;
  daily_calorie_intake_max?: number | null;
  daily_protein_min_g?: number | null;
  daily_protein_max_g?: number | null;
  daily_fat_min_g?: number | null;
  daily_fat_max_g?: number | null;
  daily_carb_min_g?: number | null;
  daily_carb_max_g?: number | null;
  daily_steps_target?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 範囲目標（カロリー・PFC）の達成状況
export type RangeAchievement = 'under' | 'within' | 'over' | 'no_data';

// 到達目標（歩数）の達成状況
export type StepsAchievement = 'achieved' | 'not_achieved' | 'no_data';

// すべての達成状況（UIの色・テキスト表示などで使用）
export type AchievementStatus = RangeAchievement | StepsAchievement;

export interface GoalProgress {
  goal: Goal;
  currentWeight?: number | null;
  daysRemaining: number;
  totalDays: number;
  progressPercentage: number;
  isOnTrack: boolean;
  dailyAchievements: {
    calories: RangeAchievement;
    protein: RangeAchievement;
    fat: RangeAchievement;
    carbohydrate: RangeAchievement;
    steps: StepsAchievement;
  };
}
