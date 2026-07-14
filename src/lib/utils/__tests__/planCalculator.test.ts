import { describe, expect, it } from 'vitest';
import { Goal, HealthData } from '@/types/health';
import { averageRecentWeight, KCAL_PER_KG_FAT, requiredDailyDeficit } from '../planCalculator';

function goal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'goal',
    name: 'plan',
    start_date: '2026-07-01',
    end_date: '2026-07-10',
    is_active: true,
    target_weight_kg: 98,
    starting_weight_kg: 100,
    protein_target_percent: 30,
    fat_target_percent: 25,
    carbohydrate_target_percent: 45,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

function data(date: string, weight: number): HealthData {
  return { id: date, date, weight, createdAt: '', updatedAt: '' };
}

describe('planCalculator', () => {
  it('開始日と期限日を含めて目標日次収支を計算する', () => {
    // 2kg * 7,700kcal / 10日
    expect(requiredDailyDeficit(goal())).toBeCloseTo((2 * KCAL_PER_KG_FAT) / 10);
  });

  it('直近7日内の体重だけで開始体重候補を平均する', () => {
    const result = averageRecentWeight(
      [data('2026-07-14', 100), data('2026-07-12', 102), data('2026-07-07', 90)],
      '2026-07-14'
    );
    expect(result).toEqual({ average: 101, count: 2 });
  });
});
