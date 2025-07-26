export interface HealthData {
  id: string;
  date: string;
  weight?: number;
  bodyFatPercentage?: number;
  muscleMass?: number;
  steps?: number;
  activeCalories?: number;
  restingCalories?: number;
  totalCalories?: number;
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