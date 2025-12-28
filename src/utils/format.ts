/**
 * 格式化工具函数
 */

/**
 * 格式化数值为易读格式
 * - n < 1000: 返回原数值
 * - 1000 <= n < 1000000: 返回 Xk 格式（保留一位小数）
 * - n >= 1000000: 返回 XM 格式（保留一位小数）
 */
export function formatNumber(value: number): string {
  if (value < 1000) {
    return value.toString();
  }
  if (value < 1000000) {
    const k = value / 1000;
    // 如果是整数则不显示小数
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  const m = value / 1000000;
  return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
}
