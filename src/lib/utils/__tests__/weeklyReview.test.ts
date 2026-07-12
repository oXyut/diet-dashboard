import { describe, expect, it } from 'vitest';
import { Goal, HealthData } from '@/types/health';
import { calculateWeeklyReview } from '../weeklyReview';

const goal: Goal = {
  id: 'goal',
  name: 'plan',
  start_date: '2026-07-01',
  end_date: '2026-08-01',
  is_active: true,
  target_weight_kg: 98,
  starting_weight_kg: 100,
  protein_target_percent: 30,
  fat_target_percent: 25,
  carbohydrate_target_percent: 45,
  daily_steps_target: 8000,
  created_at: '',
  updated_at: '',
};

function day(dayNumber: number, overrides: Partial<HealthData> = {}): HealthData {
  const date = `2026-07-${String(dayNumber).padStart(2, '0')}`;
  return {
    id: date,
    date,
    totalCalories: 2500,
    dietaryCalories: 2000,
    proteinG: 150,
    fatG: 45,
    carbohydrateG: 175,
    steps: 9000,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

describe('calculateWeeklyReview', () => {
  it('5日以上の記録を7日換算し、赤字とPFCを評価する', () => {
    const review = calculateWeeklyReview(
      goal,
      [8, 9, 10, 11, 12].map((value) => day(value)),
      '2026-07-14'
    );
    expect(review.calories.validDays).toBe(5);
    expect(review.calories.actualDeficit).toBe(3500);
    expect(review.calories.tone).toBe('good');
    expect(review.pfc.validDays).toBe(5);
    expect(review.pfc.tone).toBe('good');
    expect(review.steps.achievedDays).toBe(5);
  });

  it('5日未満のカロリー/PFC記録は判定を保留する', () => {
    const review = calculateWeeklyReview(
      goal,
      [11, 12, 13, 14].map((value) => day(value)),
      '2026-07-14'
    );
    expect(review.calories.actualDeficit).toBeNull();
    expect(review.calories.tone).toBe('none');
    expect(review.pfc.tone).toBe('none');
  });
});
