/**
 * 格式化工具函数测试
 */
import { describe, it, expect } from 'vitest';
import { formatNumber } from './format';

describe('formatNumber', () => {
  describe('小于 1000 的数值', () => {
    it('返回原数值字符串', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(1)).toBe('1');
      expect(formatNumber(100)).toBe('100');
      expect(formatNumber(999)).toBe('999');
    });
  });

  describe('1000 到 999999 的数值', () => {
    it('边界值 1000 返回 1k', () => {
      expect(formatNumber(1000)).toBe('1k');
    });

    it('整千数返回不带小数的 k 格式', () => {
      expect(formatNumber(2000)).toBe('2k');
      expect(formatNumber(10000)).toBe('10k');
      expect(formatNumber(500000)).toBe('500k');
    });

    it('非整千数返回带一位小数的 k 格式', () => {
      expect(formatNumber(1500)).toBe('1.5k');
      expect(formatNumber(2300)).toBe('2.3k');
      expect(formatNumber(12345)).toBe('12.3k');
      expect(formatNumber(999999)).toBe('1000.0k');
    });
  });

  describe('大于等于 1000000 的数值', () => {
    it('边界值 1000000 返回 1M', () => {
      expect(formatNumber(1000000)).toBe('1M');
    });

    it('整百万数返回不带小数的 M 格式', () => {
      expect(formatNumber(2000000)).toBe('2M');
      expect(formatNumber(10000000)).toBe('10M');
    });

    it('非整百万数返回带一位小数的 M 格式', () => {
      expect(formatNumber(1500000)).toBe('1.5M');
      expect(formatNumber(2300000)).toBe('2.3M');
      expect(formatNumber(12345678)).toBe('12.3M');
    });
  });
});
