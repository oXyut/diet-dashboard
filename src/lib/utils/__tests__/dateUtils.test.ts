import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getTodayInJST, getYesterdayInJST } from '../dateUtils';

/**
 * dateUtils のテスト
 *
 * vitest.config.ts で TZ=UTC を設定しているため、
 * システムのローカルタイムゾーンに依存せず JST 変換ロジックを検証できる。
 */
describe('dateUtils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getTodayInJST', () => {
    it('UTC正午（JST同日夜）は同じ日付を返す', () => {
      // UTC 2026-07-11 03:00 = JST 2026-07-11 12:00
      vi.setSystemTime(new Date('2026-07-11T03:00:00Z'));
      expect(getTodayInJST()).toBe('2026-07-11');
    });

    it('UTC 14:59（JST 23:59、日付境界の直前）は同じ日付を返す', () => {
      // UTC 2026-07-11 14:59:59 = JST 2026-07-11 23:59:59
      vi.setSystemTime(new Date('2026-07-11T14:59:59Z'));
      expect(getTodayInJST()).toBe('2026-07-11');
    });

    it('UTC 15:00（JSTでは翌日 00:00）は翌日の日付を返す', () => {
      // UTC 2026-07-11 15:00:00 = JST 2026-07-12 00:00:00
      vi.setSystemTime(new Date('2026-07-11T15:00:00Z'));
      expect(getTodayInJST()).toBe('2026-07-12');
    });

    it('UTC深夜（JST朝9時）は同じ日付を返す', () => {
      // UTC 2026-07-11 00:00:00 = JST 2026-07-11 09:00:00
      vi.setSystemTime(new Date('2026-07-11T00:00:00Z'));
      expect(getTodayInJST()).toBe('2026-07-11');
    });

    it('年境界: UTC 12/31 15:00 は JST 1/1 を返す', () => {
      // UTC 2025-12-31 15:00:00 = JST 2026-01-01 00:00:00
      vi.setSystemTime(new Date('2025-12-31T15:00:00Z'));
      expect(getTodayInJST()).toBe('2026-01-01');
    });

    it('月境界: UTC 2/28 15:00（非うるう年）は JST 3/1 を返す', () => {
      // 2026年はうるう年ではない
      vi.setSystemTime(new Date('2026-02-28T15:00:00Z'));
      expect(getTodayInJST()).toBe('2026-03-01');
    });

    it('うるう年: UTC 2/28 15:00（2028年）は JST 2/29 を返す', () => {
      vi.setSystemTime(new Date('2028-02-28T15:00:00Z'));
      expect(getTodayInJST()).toBe('2028-02-29');
    });

    it('YYYY-MM-DD形式（ゼロ埋め）で返す', () => {
      vi.setSystemTime(new Date('2026-03-05T00:00:00Z'));
      expect(getTodayInJST()).toBe('2026-03-05');
      expect(getTodayInJST()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getYesterdayInJST', () => {
    it('JST今日の前日を返す', () => {
      // UTC 2026-07-11 03:00 = JST 2026-07-11 → 昨日は 2026-07-10
      vi.setSystemTime(new Date('2026-07-11T03:00:00Z'));
      expect(getYesterdayInJST()).toBe('2026-07-10');
    });

    it('UTC 15:00（JSTでは翌日）ではJST基準の昨日を返す', () => {
      // UTC 2026-07-11 15:00 = JST 2026-07-12 → 昨日は 2026-07-11
      vi.setSystemTime(new Date('2026-07-11T15:00:00Z'));
      expect(getYesterdayInJST()).toBe('2026-07-11');
    });

    it('月初: JST 7/1 の昨日は 6/30', () => {
      // UTC 2026-06-30 15:00 = JST 2026-07-01
      vi.setSystemTime(new Date('2026-06-30T15:00:00Z'));
      expect(getYesterdayInJST()).toBe('2026-06-30');
    });

    it('年始: JST 1/1 の昨日は前年の 12/31', () => {
      // UTC 2025-12-31 15:00 = JST 2026-01-01
      vi.setSystemTime(new Date('2025-12-31T15:00:00Z'));
      expect(getYesterdayInJST()).toBe('2025-12-31');
    });

    it('うるう年: JST 3/1（2028年）の昨日は 2/29', () => {
      // UTC 2028-02-29 15:00 = JST 2028-03-01
      vi.setSystemTime(new Date('2028-02-29T15:00:00Z'));
      expect(getYesterdayInJST()).toBe('2028-02-29');
    });

    it('getTodayInJSTと常に1日差になる', () => {
      const times = ['2026-07-11T14:59:59Z', '2026-07-11T15:00:00Z', '2026-01-01T00:00:00Z'];
      for (const t of times) {
        vi.setSystemTime(new Date(t));
        const today = new Date(`${getTodayInJST()}T00:00:00Z`);
        const yesterday = new Date(`${getYesterdayInJST()}T00:00:00Z`);
        expect(today.getTime() - yesterday.getTime()).toBe(24 * 60 * 60 * 1000);
      }
    });
  });
});
