import { describe, it, expect } from 'vitest';
import {
  calculateWeeklyWeightPace,
  calculateTargetPaceKgPerWeek,
  evaluateDietStatus,
} from '../dietStatus';
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

function makeHealthData(date: string, weight: number | null): HealthData {
  return {
    id: `hd-${date}`,
    date,
    weight,
    createdAt: `${date}T00:00:00Z`,
    updatedAt: `${date}T00:00:00Z`,
  };
}

const REF = '2026-07-14';

describe('calculateWeeklyWeightPace', () => {
  it('直近7日と前7日の平均差をペースとして返す', () => {
    const data = [
      // 前7日窓 [07-01, 07-07]: 平均 111
      makeHealthData('2026-07-02', 111.5),
      makeHealthData('2026-07-05', 110.5),
      // 直近7日窓 [07-08, 07-14]: 平均 110.5
      makeHealthData('2026-07-09', 111.0),
      makeHealthData('2026-07-13', 110.0),
    ];
    const pace = calculateWeeklyWeightPace(data, REF);
    expect(pace.recentAvg).toBeCloseTo(110.5);
    expect(pace.previousAvg).toBeCloseTo(111.0);
    expect(pace.paceKgPerWeek).toBeCloseTo(-0.5);
    expect(pace.recentCount).toBe(2);
    expect(pace.previousCount).toBe(2);
  });

  it('窓の境界の日付が正しい窓に入る', () => {
    const data = [
      makeHealthData('2026-07-01', 112), // 前窓の下端
      makeHealthData('2026-07-07', 112), // 前窓の上端
      makeHealthData('2026-07-08', 111), // 直近窓の下端
      makeHealthData('2026-07-14', 111), // 直近窓の上端(=基準日)
      makeHealthData('2026-06-30', 999), // 窓外(無視)
    ];
    const pace = calculateWeeklyWeightPace(data, REF);
    expect(pace.recentCount).toBe(2);
    expect(pace.previousCount).toBe(2);
    expect(pace.paceKgPerWeek).toBeCloseTo(-1.0);
  });

  it('窓の実測が最低サンプル数未満なら null', () => {
    const data = [
      makeHealthData('2026-07-02', 111),
      makeHealthData('2026-07-05', 111),
      makeHealthData('2026-07-13', 110), // 直近窓は1点のみ
    ];
    const pace = calculateWeeklyWeightPace(data, REF);
    expect(pace.recentAvg).toBeNull();
    expect(pace.paceKgPerWeek).toBeNull();
    expect(pace.previousAvg).toBeCloseTo(111);
  });

  it('weight が null の日は実測に数えない', () => {
    const data = [makeHealthData('2026-07-09', null), makeHealthData('2026-07-13', 110)];
    const pace = calculateWeeklyWeightPace(data, REF);
    expect(pace.recentCount).toBe(1);
    expect(pace.recentAvg).toBeNull();
  });

  it('データが空なら全て null', () => {
    const pace = calculateWeeklyWeightPace([], REF);
    expect(pace.recentAvg).toBeNull();
    expect(pace.previousAvg).toBeNull();
    expect(pace.paceKgPerWeek).toBeNull();
  });
});

describe('calculateTargetPaceKgPerWeek', () => {
  it('開始体重と目標から週あたりペースを計算する', () => {
    // 開始体重112kg(最古データ、開始日と同日)、目標98kg、期間98日 → -1kg/週
    const goal = makeGoal({
      target_weight_kg: 98,
      start_date: '2026-06-01',
      end_date: '2026-09-07',
    });
    const data = [makeHealthData('2026-06-01', 112)];
    expect(calculateTargetPaceKgPerWeek(goal, data)).toBeCloseTo(-1.0);
  });

  it('target_weight_kg がなければ null', () => {
    const goal = makeGoal({ target_weight_kg: null });
    expect(calculateTargetPaceKgPerWeek(goal, [makeHealthData('2026-06-01', 112)])).toBeNull();
  });

  it('体重データがなければ null', () => {
    expect(calculateTargetPaceKgPerWeek(makeGoal(), [])).toBeNull();
  });
});

describe('evaluateDietStatus', () => {
  // 開始体重112kg・目標98kg・期間98日 → 目標ペース -1.0kg/週
  const goal = makeGoal({
    target_weight_kg: 98,
    start_date: '2026-06-01',
    end_date: '2026-09-07',
  });

  /** 指定ペース(kg/週)になる2窓ぶんのデータを作る */
  function dataWithPace(paceKgPerWeek: number, recentAvg = 108): HealthData[] {
    const previousAvg = recentAvg - paceKgPerWeek;
    return [
      makeHealthData('2026-06-01', 112), // 開始体重の推定用
      makeHealthData('2026-07-02', previousAvg),
      makeHealthData('2026-07-06', previousAvg),
      makeHealthData('2026-07-09', recentAvg),
      makeHealthData('2026-07-13', recentAvg),
    ];
  }

  it('goal が null なら insufficient_data', () => {
    const result = evaluateDietStatus(null, dataWithPace(-1), REF);
    expect(result.level).toBe('insufficient_data');
  });

  it('窓サンプル不足なら insufficient_data', () => {
    const data = [makeHealthData('2026-06-01', 112), makeHealthData('2026-07-13', 108)];
    const result = evaluateDietStatus(goal, data, REF);
    expect(result.level).toBe('insufficient_data');
    expect(result.targetPaceKgPerWeek).toBeCloseTo(-1.0);
  });

  it('目標体重到達済みなら achieved', () => {
    const result = evaluateDietStatus(goal, dataWithPace(-0.1, 97.5), REF);
    expect(result.level).toBe('achieved');
    expect(result.remainingKg).toBeLessThanOrEqual(0);
  });

  it('横ばい・増加なら stalled', () => {
    expect(evaluateDietStatus(goal, dataWithPace(0), REF).level).toBe('stalled');
    expect(evaluateDietStatus(goal, dataWithPace(0.5), REF).level).toBe('stalled');
  });

  it('比率 0.75 以上なら on_track（境界値含む）', () => {
    expect(evaluateDietStatus(goal, dataWithPace(-0.75), REF).level).toBe('on_track');
    expect(evaluateDietStatus(goal, dataWithPace(-1.2), REF).level).toBe('on_track');
  });

  it('比率 0.25 以上 0.75 未満なら caution（境界値含む）', () => {
    expect(evaluateDietStatus(goal, dataWithPace(-0.25), REF).level).toBe('caution');
    expect(evaluateDietStatus(goal, dataWithPace(-0.74), REF).level).toBe('caution');
  });

  it('比率 0.25 未満なら stalled', () => {
    expect(evaluateDietStatus(goal, dataWithPace(-0.1), REF).level).toBe('stalled');
  });

  it('減量中は予測到達日を線形外挿で返す', () => {
    // recentAvg 108 → 残り10kg、ペース -1kg/週 → 70日後
    const result = evaluateDietStatus(goal, dataWithPace(-1.0, 108), REF);
    expect(result.projectedGoalDate).toBe('2026-09-22');
    expect(result.paceRatio).toBeCloseTo(1.0);
    expect(result.remainingKg).toBeCloseTo(10);
  });

  it('ペースが遅すぎて2年超先なら予測到達日は null', () => {
    // 残り10kg、ペース -0.03kg/週 → 約2333日
    const result = evaluateDietStatus(goal, dataWithPace(-0.03, 108), REF);
    expect(result.projectedGoalDate).toBeNull();
  });

  it('daysRemaining は基準日から end_date までの日数', () => {
    const result = evaluateDietStatus(goal, dataWithPace(-1), REF);
    expect(result.daysRemaining).toBe(55); // 2026-07-14 → 2026-09-07
  });
});
