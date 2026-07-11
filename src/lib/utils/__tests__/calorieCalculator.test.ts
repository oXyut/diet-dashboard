import { describe, it, expect } from 'vitest';
import { calculateIntakeCalories, calculatePFCRatio } from '../calorieCalculator';

describe('calorieCalculator', () => {
  describe('calculateIntakeCalories', () => {
    it('P4kcal/g, F9kcal/g, C4kcal/g で計算する', () => {
      // 100*4 + 50*9 + 200*4 = 400 + 450 + 800 = 1650
      expect(calculateIntakeCalories(100, 50, 200)).toBe(1650);
    });

    it('すべてnullの場合はnullを返す', () => {
      expect(calculateIntakeCalories(null, null, null)).toBeNull();
      expect(calculateIntakeCalories(undefined, undefined, undefined)).toBeNull();
    });

    it('一部がnullの場合は0として扱い計算する', () => {
      expect(calculateIntakeCalories(10, null, null)).toBe(40);
      expect(calculateIntakeCalories(null, 10, null)).toBe(90);
      expect(calculateIntakeCalories(null, null, 10)).toBe(40);
      expect(calculateIntakeCalories(100, null, 200)).toBe(1200);
    });

    it('すべて0の場合は0を返す（nullではない）', () => {
      expect(calculateIntakeCalories(0, 0, 0)).toBe(0);
    });

    it('小数点第1位に丸める', () => {
      // 10.11*4 = 40.44 → 40.4
      expect(calculateIntakeCalories(10.11, null, null)).toBe(40.4);
      // 10.12*4 = 40.48 → 40.5
      expect(calculateIntakeCalories(10.12, null, null)).toBe(40.5);
    });
  });

  describe('calculatePFCRatio', () => {
    it('各栄養素のカロリー比率（%）を返す', () => {
      // total = 1650, P: 400/1650=24.24%, F: 450/1650=27.27%, C: 800/1650=48.48%
      const ratio = calculatePFCRatio(100, 50, 200);
      expect(ratio).toEqual({
        protein: 24.2,
        fat: 27.3,
        carbohydrate: 48.5,
      });
    });

    it('比率の合計はおよそ100%になる', () => {
      const ratio = calculatePFCRatio(120, 40, 180)!;
      const sum = ratio.protein + ratio.fat + ratio.carbohydrate;
      expect(sum).toBeGreaterThan(99.5);
      expect(sum).toBeLessThan(100.5);
    });

    it('すべてnullの場合はnullを返す', () => {
      expect(calculatePFCRatio(null, null, null)).toBeNull();
    });

    it('合計カロリーが0の場合はnullを返す', () => {
      expect(calculatePFCRatio(0, 0, 0)).toBeNull();
    });

    it('単一栄養素のみの場合は100%になる', () => {
      expect(calculatePFCRatio(100, null, null)).toEqual({
        protein: 100,
        fat: 0,
        carbohydrate: 0,
      });
    });
  });
});
