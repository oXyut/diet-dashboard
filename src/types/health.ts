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
  targetWeightKg?: number | null;
  startDate: string;
  endDate: string;
  dailyCalorieIntakeMin?: number | null;
  dailyCalorieIntakeMax?: number | null;
  dailyProteinMinG?: number | null;
  dailyProteinMaxG?: number | null;
  dailyFatMinG?: number | null;
  dailyFatMaxG?: number | null;
  dailyCarbMinG?: number | null;
  dailyCarbMaxG?: number | null;
  dailyStepsTarget?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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