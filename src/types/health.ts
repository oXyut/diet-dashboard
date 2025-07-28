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