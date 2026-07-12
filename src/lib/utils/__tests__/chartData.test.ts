import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildChartData, getWeightAxisDomain, formatDateLabel } from '../chartData';
import { Goal, HealthData } from '@/types/health';

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'goal-1',
    name: 'テスト目標',
    target_weight_kg: 100,
    start_date: '2026-06-01',
    end_date: '2026-12-01',
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

describe('chartData', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('buildChartData', () => {
    it('期間内のデータを日付昇順で返す', () => {
      const data = [
        makeHealthData('2026-07-14', { weight: 110 }),
        makeHealthData('2026-07-10', { weight: 111 }),
        makeHealthData('2026-05-01', { weight: 113 }), // 30日窓の外
      ];
      const result = buildChartData(data, null, 30);
      expect(result.map((r) => r.date)).toEqual(['2026-07-10', '2026-07-14']);
      expect(result[0].weight).toBe(111);
    });

    it('rangeDays が null なら全期間を返す', () => {
      const data = [
        makeHealthData('2026-07-14', { weight: 110 }),
        makeHealthData('2026-05-01', { weight: 113 }),
      ];
      const result = buildChartData(data, null, null);
      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2026-05-01');
    });

    it('摂取カロリーは実測優先・なければPFCから算出する', () => {
      const data = [
        makeHealthData('2026-07-14', { dietaryCalories: 1800, proteinG: 100 }),
        makeHealthData('2026-07-13', { proteinG: 100, fatG: 50, carbohydrateG: 200 }),
        makeHealthData('2026-07-12', {}),
      ];
      const result = buildChartData(data, null, 30);
      expect(result.find((r) => r.date === '2026-07-14')?.intakeCalories).toBe(1800);
      expect(result.find((r) => r.date === '2026-07-13')?.intakeCalories).toBeCloseTo(1650);
      expect(result.find((r) => r.date === '2026-07-12')?.intakeCalories).toBeNull();
    });

    it('goal があれば目標線データをマージする', () => {
      const goal = makeGoal();
      const data = [
        makeHealthData('2026-06-01', { weight: 112 }),
        makeHealthData('2026-07-14', { weight: 110 }),
      ];
      const result = buildChartData(data, goal, 30);
      const last = result.find((r) => r.date === '2026-07-14');
      expect(last?.targetWeight).toBe(100);
      expect(typeof last?.linearTarget).toBe('number');
    });
  });

  describe('getWeightAxisDomain', () => {
    it('実体重と目標線を含む範囲に margin 1 を付けて返す', () => {
      const rows = [
        { date: '2026-07-13', weight: 110.4, linearTarget: 108.2, targetWeight: 100 },
        { date: '2026-07-14', weight: 111.6 },
      ] as ReturnType<typeof buildChartData>;
      expect(getWeightAxisDomain(rows)).toEqual([99, 113]);
    });

    it('体重系の値がなければ dataMin/dataMax ベースの文字列を返す', () => {
      const rows = [{ date: '2026-07-14' }] as ReturnType<typeof buildChartData>;
      expect(getWeightAxisDomain(rows)).toEqual(['dataMin - 5', 'dataMax + 5']);
    });
  });

  describe('formatDateLabel', () => {
    it('YYYY-MM-DD を MM/dd に変換する', () => {
      expect(formatDateLabel('2026-07-14')).toBe('07/14');
    });
  });
});
