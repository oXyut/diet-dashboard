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

export interface Goal {
  id: number;
  name: string;
  description?: string | null;
  target_weight_kg?: number | null;
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

export interface GoalProgress {
  goal: Goal;
  currentWeight?: number | null;
  daysRemaining: number;
  totalDays: number;
  progressPercentage: number;
  isOnTrack: boolean;
  dailyAchievements: {
    calories: 'under' | 'within' | 'over' | 'no_data';
    protein: 'under' | 'within' | 'over' | 'no_data';
    fat: 'under' | 'within' | 'over' | 'no_data';
    carbohydrate: 'under' | 'within' | 'over' | 'no_data';
    steps: 'achieved' | 'not_achieved' | 'no_data';
  };
}