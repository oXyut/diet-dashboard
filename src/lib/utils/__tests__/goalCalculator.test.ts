import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  calculateGoalProgress,
  getAchievementColor,
  getAchievementText,
} from '../goalCalculator';
import { Goal, HealthData } from '@/types/health';

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 1,
    name: 'テスト目標',
    start_date: '2026-01-01',
    end_date: '2026-01-31',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeHealthData(overrides: Partial<HealthData> = {}): HealthData {
  return {
    id: 'hd-1',
    date: '2026-01-10',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-01-10T00:00:00Z',
    ...overrides,
  };
}

describe('goalCalculator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 実装内のデバッグ用 console.log を抑制
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('calculateGoalProgress - 日数計算', () => {
    it('期間中: 総日数・経過日数・残り日数・進捗率を計算する', () => {
      vi.setSystemTime(new Date('2026-01-10T12:00:00Z'));
      const result = calculateGoalProgress(makeGoal());

      // 1/1〜1/31 は両端含めて31日
      expect(result.totalDays).toBe(31);
      // 1/10 時点の残りは 1/11〜1/31 相当の20日
      expect(result.daysRemaining).toBe(20);
      // 経過10日 / 31日 = 32.3%
      expect(result.progressPercentage).toBe(32.3);
    });

    it('開始日当日: 進捗は初日分のみ', () => {
      vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
      const result = calculateGoalProgress(makeGoal());

      expect(result.totalDays).toBe(31);
      expect(result.daysRemaining).toBe(29);
      // 経過1日 / 31日 = 3.2%
      expect(result.progressPercentage).toBe(3.2);
    });

    it('終了日以降: 残り日数は0、進捗率は100%を超えない', () => {
      vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));
      const result = calculateGoalProgress(makeGoal());

      expect(result.daysRemaining).toBe(0);
      expect(result.progressPercentage).toBe(100);
    });

    it('開始前: 経過日数は0にクランプされ進捗0%', () => {
      vi.setSystemTime(new Date('2025-12-25T12:00:00Z'));
      const result = calculateGoalProgress(makeGoal());

      expect(result.progressPercentage).toBe(0);
      expect(result.daysRemaining).toBeGreaterThan(31 - 1);
    });

    it('start_date / end_date が無い場合は例外を投げる', () => {
      expect(() =>
        calculateGoalProgress(makeGoal({ start_date: '' }))
      ).toThrow('Goal start date and end date are required');
      expect(() =>
        calculateGoalProgress(makeGoal({ end_date: '' }))
      ).toThrow('Goal start date and end date are required');
    });
  });

  describe('calculateGoalProgress - 現在体重と達成判定', () => {
    it('最新データの体重を currentWeight に反映する', () => {
      vi.setSystemTime(new Date('2026-01-10T12:00:00Z'));
      const result = calculateGoalProgress(
        makeGoal({ target_weight_kg: 70 }),
        makeHealthData({ weight: 78.5 })
      );
      expect(result.currentWeight).toBe(78.5);
    });

    it('健康データが無い場合 currentWeight は null', () => {
      vi.setSystemTime(new Date('2026-01-10T12:00:00Z'));
      const result = calculateGoalProgress(makeGoal());
      expect(result.currentWeight).toBeNull();
    });

    it('期間前半（進捗50%以下）は体重に関わらず isOnTrack=true', () => {
      vi.setSystemTime(new Date('2026-01-10T12:00:00Z'));
      const result = calculateGoalProgress(
        makeGoal({ target_weight_kg: 70 }),
        makeHealthData({ weight: 95 })
      );
      expect(result.isOnTrack).toBe(true);
    });

    it('目標体重を達成済みなら isOnTrack=true', () => {
      vi.setSystemTime(new Date('2026-01-25T12:00:00Z'));
      const result = calculateGoalProgress(
        makeGoal({ target_weight_kg: 70 }),
        makeHealthData({ weight: 69.5 })
      );
      expect(result.isOnTrack).toBe(true);
    });
  });

  describe('calculateGoalProgress - dailyAchievements', () => {
    const goalWithTargets = makeGoal({
      daily_calorie_intake_min: 1500,
      daily_calorie_intake_max: 1800,
      daily_protein_min_g: 100,
      daily_protein_max_g: 150,
      daily_fat_min_g: 40,
      daily_fat_max_g: 60,
      daily_carb_min_g: 150,
      daily_carb_max_g: 250,
      daily_steps_target: 8000,
    });

    it('健康データが無い場合はすべて no_data', () => {
      vi.setSystemTime(new Date('2026-01-10T12:00:00Z'));
      const result = calculateGoalProgress(goalWithTargets, null);
      expect(result.dailyAchievements).toEqual({
        calories: 'no_data',
        protein: 'no_data',
        fat: 'no_data',
        carbohydrate: 'no_data',
        steps: 'no_data',
      });
    });

    it('すべて範囲内なら within / achieved', () => {
      vi.setSystemTime(new Date('2026-01-10T12:00:00Z'));
      // カロリー: 120*4 + 50*9 + 180*4 = 480+450+720 = 1650（範囲内）
      const result = calculateGoalProgress(
        goalWithTargets,
        makeHealthData({
          proteinG: 120,
          fatG: 50,
          carbohydrateG: 180,
          steps: 10000,
        })
      );
      expect(result.dailyAchievements).toEqual({
        calories: 'within',
        protein: 'within',
        fat: 'within',
        carbohydrate: 'within',
        steps: 'achieved',
      });
    });

    it('下限未満は under、上限超過は over', () => {
      vi.setSystemTime(new Date('2026-01-10T12:00:00Z'));
      // カロリー: 90*4 + 70*9 + 300*4 = 360+630+1200 = 2190（超過）
      const result = calculateGoalProgress(
        goalWithTargets,
        makeHealthData({
          proteinG: 90, // 下限100未満 → under
          fatG: 70, // 上限60超過 → over
          carbohydrateG: 300, // 上限250超過 → over
          steps: 5000, // 目標8000未満 → not_achieved
        })
      );
      expect(result.dailyAchievements.protein).toBe('under');
      expect(result.dailyAchievements.fat).toBe('over');
      expect(result.dailyAchievements.carbohydrate).toBe('over');
      expect(result.dailyAchievements.calories).toBe('over');
      expect(result.dailyAchievements.steps).toBe('not_achieved');
    });

    it('境界値ちょうどは within / achieved', () => {
      vi.setSystemTime(new Date('2026-01-10T12:00:00Z'));
      const result = calculateGoalProgress(
        goalWithTargets,
        makeHealthData({
          proteinG: 100, // 下限ちょうど
          fatG: 60, // 上限ちょうど
          carbohydrateG: 250, // 上限ちょうど
          steps: 8000, // 目標ちょうど
        })
      );
      expect(result.dailyAchievements.protein).toBe('within');
      expect(result.dailyAchievements.fat).toBe('within');
      expect(result.dailyAchievements.carbohydrate).toBe('within');
      expect(result.dailyAchievements.steps).toBe('achieved');
    });

    it('目標値が未設定の項目は no_data', () => {
      vi.setSystemTime(new Date('2026-01-10T12:00:00Z'));
      const result = calculateGoalProgress(
        makeGoal(), // 各種目標未設定
        makeHealthData({ proteinG: 120, steps: 10000 })
      );
      expect(result.dailyAchievements.protein).toBe('no_data');
      expect(result.dailyAchievements.steps).toBe('no_data');
    });

    it('値が欠損している項目は no_data', () => {
      vi.setSystemTime(new Date('2026-01-10T12:00:00Z'));
      const result = calculateGoalProgress(
        goalWithTargets,
        makeHealthData({ proteinG: null, steps: null })
      );
      expect(result.dailyAchievements.protein).toBe('no_data');
      expect(result.dailyAchievements.steps).toBe('no_data');
      // PFCすべてnull → カロリーもno_data
      expect(result.dailyAchievements.calories).toBe('no_data');
    });
  });

  describe('getAchievementColor', () => {
    it('ステータスに応じた色クラスを返す', () => {
      expect(getAchievementColor('within')).toContain('green');
      expect(getAchievementColor('achieved')).toContain('green');
      expect(getAchievementColor('under')).toContain('red');
      expect(getAchievementColor('not_achieved')).toContain('red');
      expect(getAchievementColor('over')).toContain('orange');
      expect(getAchievementColor('no_data')).toContain('gray');
    });
  });

  describe('getAchievementText', () => {
    it('ステータスに応じたテキストを返す', () => {
      expect(getAchievementText('within')).toBe('目標範囲内');
      expect(getAchievementText('achieved')).toBe('達成');
      expect(getAchievementText('under')).toBe('不足');
      expect(getAchievementText('over')).toBe('超過');
      expect(getAchievementText('not_achieved')).toBe('未達成');
      expect(getAchievementText('no_data')).toBe('データなし');
    });
  });
});
