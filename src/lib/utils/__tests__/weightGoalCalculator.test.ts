import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { calculateLinearWeightGoal } from '../weightGoalCalculator';
import { Goal, HealthData } from '@/types/health';

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 1,
    name: 'テスト目標',
    target_weight_kg: 70,
    start_date: '2026-01-01',
    end_date: '2026-01-31',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeHealthData(date: string, weight: number | null): HealthData {
  return {
    id: `hd-${date}`,
    date,
    weight,
    createdAt: `${date}T00:00:00Z`,
    updatedAt: `${date}T00:00:00Z`,
  };
}

describe('weightGoalCalculator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 実装内のデバッグ用 console.log を抑制
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('必須項目が欠けている場合', () => {
    it('target_weight_kg が無い場合は空配列を返す', () => {
      vi.setSystemTime(new Date('2026-01-20T00:00:00Z'));
      const result = calculateLinearWeightGoal(makeGoal({ target_weight_kg: null }), [
        makeHealthData('2026-01-01', 80),
      ]);
      expect(result).toEqual([]);
    });

    it('start_date / end_date が無い場合は空配列を返す', () => {
      vi.setSystemTime(new Date('2026-01-20T00:00:00Z'));
      expect(calculateLinearWeightGoal(makeGoal({ start_date: '' }), [])).toEqual([]);
      expect(calculateLinearWeightGoal(makeGoal({ end_date: '' }), [])).toEqual([]);
    });
  });

  describe('線形目標線の計算', () => {
    it('開始体重から目標体重まで線形に減少する目標線を生成する', () => {
      vi.setSystemTime(new Date('2026-01-20T00:00:00Z'));
      const result = calculateLinearWeightGoal(makeGoal(), [makeHealthData('2026-01-01', 80)]);

      // 表示範囲30日のうち目標期間内（1/1〜1/20）の20日分
      expect(result).toHaveLength(20);

      // 初日は開始体重
      expect(result[0].linearTarget).toBeCloseTo(80, 5);
      // 総日数30日で10kg減 → 1日あたり1/3kg減。19日経過時点: 80 - 19/3
      expect(result[result.length - 1].linearTarget).toBeCloseTo(80 - (10 / 30) * 19, 5);
    });

    it('targetWeight は全行で目標体重になる', () => {
      vi.setSystemTime(new Date('2026-01-20T00:00:00Z'));
      const result = calculateLinearWeightGoal(makeGoal(), [makeHealthData('2026-01-01', 80)]);
      expect(result.length).toBeGreaterThan(0);
      for (const row of result) {
        expect(row.targetWeight).toBe(70);
      }
    });

    it('linearTarget は目標体重を下回らない（クランプされる）', () => {
      vi.setSystemTime(new Date('2026-01-20T00:00:00Z'));
      const result = calculateLinearWeightGoal(makeGoal(), [makeHealthData('2026-01-01', 80)]);
      for (const row of result) {
        expect(row.linearTarget).toBeGreaterThanOrEqual(70);
      }
    });

    it('目標期間外の日付は含まれない', () => {
      // 2/10時点: 表示範囲は1/11〜2/10だが、目標期間は1/31まで
      vi.setSystemTime(new Date('2026-02-10T00:00:00Z'));
      const result = calculateLinearWeightGoal(makeGoal(), [makeHealthData('2026-01-01', 80)]);
      // 1/11〜1/31 の21日分のみ
      expect(result).toHaveLength(21);
    });

    it('dateRange を指定すると表示範囲が変わる', () => {
      vi.setSystemTime(new Date('2026-01-20T00:00:00Z'));
      const result = calculateLinearWeightGoal(makeGoal(), [makeHealthData('2026-01-01', 80)], 5);
      // 1/15〜1/20 の6日分
      expect(result).toHaveLength(6);
    });

    it('日付キーは年情報を含む yyyy-MM-dd 形式で返す', () => {
      vi.setSystemTime(new Date('2026-01-20T00:00:00Z'));
      const result = calculateLinearWeightGoal(makeGoal(), [makeHealthData('2026-01-01', 80)]);
      expect(result[0].date).toBe('2026-01-01');
      expect(result[result.length - 1].date).toBe('2026-01-20');
      for (const row of result) {
        expect(row.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });
  });

  describe('開始体重の推定', () => {
    it('開始日以降のデータしか無い場合は減量ペースから開始体重を逆算する', () => {
      vi.setSystemTime(new Date('2026-01-21T00:00:00Z'));
      // 1/11: 79kg, 1/21: 77kg → 0.2kg/日ペース
      // 開始日1/1の推定体重 = 79 + 0.2 * 10 = 81kg
      const result = calculateLinearWeightGoal(makeGoal(), [
        makeHealthData('2026-01-11', 79),
        makeHealthData('2026-01-21', 77),
      ]);

      expect(result.length).toBeGreaterThan(0);
      // 初日（1/1）の目標線は逆算された開始体重 81kg
      expect(result[0].date).toBe('2026-01-01');
      expect(result[0].linearTarget).toBeCloseTo(81, 5);
    });

    it('体重データの順序に依存せず最古のデータを開始体重に使う', () => {
      vi.setSystemTime(new Date('2026-01-20T00:00:00Z'));
      // 順序を逆にして渡す
      const result = calculateLinearWeightGoal(makeGoal(), [
        makeHealthData('2026-01-10', 77),
        makeHealthData('2026-01-01', 80),
      ]);
      expect(result[0].linearTarget).toBeCloseTo(80, 5);
    });

    it('weightがnullのデータは無視される', () => {
      vi.setSystemTime(new Date('2026-01-20T00:00:00Z'));
      const result = calculateLinearWeightGoal(makeGoal(), [
        makeHealthData('2025-12-25', null), // 無視される
        makeHealthData('2026-01-01', 80),
      ]);
      expect(result[0].linearTarget).toBeCloseTo(80, 5);
    });

    it('体重データが空の場合は開始体重を推定できないため目標線を描画しない', () => {
      vi.setSystemTime(new Date('2026-01-20T00:00:00Z'));
      const result = calculateLinearWeightGoal(makeGoal(), []);

      expect(result).toEqual([]);
    });
  });
});
