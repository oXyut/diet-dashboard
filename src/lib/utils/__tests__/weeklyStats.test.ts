import { describe, it, expect } from 'vitest';
import {
  getRecordingStatus,
  calculateCalorieBalance,
  countWeeklyAchievements,
} from '../weeklyStats';
import { Goal, HealthData } from '@/types/health';

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'goal-1',
    name: 'テスト目標',
    target_weight_kg: 100,
    start_date: '2026-06-01',
    end_date: '2026-12-01',
    daily_calorie_intake_min: 1500,
    daily_calorie_intake_max: 2000,
    daily_protein_min_g: 100,
    daily_protein_max_g: 160,
    daily_fat_min_g: 40,
    daily_fat_max_g: 70,
    daily_carb_min_g: 150,
    daily_carb_max_g: 250,
    daily_steps_target: 8000,
    is_active: true,
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
    ...overrides,
  };
}

function makeHealthData(date: string, overrides: Partial<HealthData> = {}): HealthData {
  return {
    id: `hd-${date}`,
    date,
    createdAt: `${date}T00:00:00Z`,
    updatedAt: `${date}T00:00:00Z`,
    ...overrides,
  };
}

const REF = '2026-07-14';

describe('getRecordingStatus', () => {
  it('直近7日を日付昇順で返し、記録有無を判定する', () => {
    const data = [
      makeHealthData('2026-07-14', { weight: 110, dietaryCalories: 1800 }),
      makeHealthData('2026-07-12', { weight: 110.5 }),
      makeHealthData('2026-07-10', { proteinG: 100, fatG: 50, carbohydrateG: 200 }),
    ];
    const status = getRecordingStatus(data, REF);

    expect(status).toHaveLength(7);
    expect(status[0].date).toBe('2026-07-08');
    expect(status[6].date).toBe('2026-07-14');

    // 07-14: 両方あり
    expect(status[6]).toMatchObject({ hasWeight: true, hasDiet: true });
    // 07-12: 体重のみ
    expect(status[4]).toMatchObject({ hasWeight: true, hasDiet: false });
    // 07-10: PFC から食事記録ありと判定
    expect(status[2]).toMatchObject({ hasWeight: false, hasDiet: true });
    // 07-09: レコードなし
    expect(status[1]).toMatchObject({ hasWeight: false, hasDiet: false });
  });

  it('データが空でも指定日数ぶん返す', () => {
    const status = getRecordingStatus([], REF, 7);
    expect(status).toHaveLength(7);
    expect(status.every((d) => !d.hasWeight && !d.hasDiet)).toBe(true);
  });
});

describe('calculateCalorieBalance', () => {
  it('摂取・消費の両方がある日だけで平均を計算する', () => {
    const data = [
      makeHealthData('2026-07-14', { dietaryCalories: 1800, totalCalories: 2800 }),
      makeHealthData('2026-07-13', { dietaryCalories: 2200, totalCalories: 3000 }),
      makeHealthData('2026-07-12', { dietaryCalories: 2000 }), // 消費なし → 除外
      makeHealthData('2026-07-11', { totalCalories: 2500 }), // 摂取なし → 除外
    ];
    const balance = calculateCalorieBalance(data, REF);
    expect(balance.daysWithBoth).toBe(2);
    expect(balance.avgIntake).toBeCloseTo(2000);
    expect(balance.avgBurned).toBeCloseTo(2900);
    expect(balance.avgBalance).toBeCloseTo(-900);
  });

  it('PFC からの推定摂取カロリーも使う', () => {
    const data = [
      makeHealthData('2026-07-14', {
        proteinG: 100,
        fatG: 50,
        carbohydrateG: 200,
        totalCalories: 2500,
      }),
    ];
    const balance = calculateCalorieBalance(data, REF);
    expect(balance.daysWithBoth).toBe(1);
    expect(balance.avgIntake).toBeCloseTo(100 * 4 + 50 * 9 + 200 * 4);
  });

  it('該当日がなければ全て null', () => {
    const balance = calculateCalorieBalance([], REF);
    expect(balance).toEqual({
      avgIntake: null,
      avgBurned: null,
      avgBalance: null,
      daysWithBoth: 0,
    });
  });

  it('窓外の日付は含めない', () => {
    const data = [
      makeHealthData('2026-07-07', { dietaryCalories: 9999, totalCalories: 9999 }), // 8日前
      makeHealthData('2026-07-08', { dietaryCalories: 1800, totalCalories: 2800 }), // 7日前(窓内)
    ];
    const balance = calculateCalorieBalance(data, REF);
    expect(balance.daysWithBoth).toBe(1);
    expect(balance.avgIntake).toBeCloseTo(1800);
  });
});

describe('countWeeklyAchievements', () => {
  it('指標ごとに範囲内日数と評価可能日数をカウントする', () => {
    const goal = makeGoal();
    const data = [
      makeHealthData('2026-07-14', {
        dietaryCalories: 1800, // within
        proteinG: 120, // within
        fatG: 80, // over
        carbohydrateG: 200, // within
        steps: 9000, // achieved
      }),
      makeHealthData('2026-07-13', {
        dietaryCalories: 2500, // over
        steps: 5000, // not achieved
      }),
      makeHealthData('2026-07-12', {
        steps: 8000, // achieved(ちょうど)
      }),
    ];
    const counts = countWeeklyAchievements(goal, data, REF);

    expect(counts.calories).toEqual({ withinDays: 1, daysWithData: 2 });
    expect(counts.protein).toEqual({ withinDays: 1, daysWithData: 1 });
    expect(counts.fat).toEqual({ withinDays: 0, daysWithData: 1 });
    expect(counts.carb).toEqual({ withinDays: 1, daysWithData: 1 });
    expect(counts.steps).toEqual({ withinDays: 2, daysWithData: 3 });
  });

  it('目標値が未設定の指標はカウントしない', () => {
    const goal = makeGoal({
      daily_protein_min_g: null,
      daily_protein_max_g: null,
      daily_steps_target: null,
    });
    const data = [makeHealthData('2026-07-14', { proteinG: 120, steps: 9000 })];
    const counts = countWeeklyAchievements(goal, data, REF);
    expect(counts.protein.daysWithData).toBe(0);
    expect(counts.steps.daysWithData).toBe(0);
  });
});
