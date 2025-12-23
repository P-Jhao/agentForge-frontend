/**
 * 增强模式 localStorage 存储工具
 */

// 增强模式类型
export type EnhanceMode = 'off' | 'quick' | 'smart' | 'multi';

// localStorage 存储 key
const ENHANCE_MODE_KEY = 'agentforge_enhance_mode';

// 有效的增强模式值
const VALID_MODES: EnhanceMode[] = ['off', 'quick', 'smart', 'multi'];

/**
 * 获取当前增强模式
 * @returns 当前增强模式，默认为 'off'
 */
export function getEnhanceMode(): EnhanceMode {
  try {
    const stored = localStorage.getItem(ENHANCE_MODE_KEY);
    if (stored && VALID_MODES.includes(stored as EnhanceMode)) {
      return stored as EnhanceMode;
    }
  } catch {
    // localStorage 不可用时忽略错误
  }
  return 'off';
}

/**
 * 设置增强模式
 * @param mode 要设置的增强模式
 */
export function setEnhanceMode(mode: EnhanceMode): void {
  try {
    if (VALID_MODES.includes(mode)) {
      localStorage.setItem(ENHANCE_MODE_KEY, mode);
    }
  } catch {
    // localStorage 不可用时忽略错误
  }
}

/**
 * 增强模式选项（用于 UI 选择器）
 */
export const enhanceModeOptions = [
  { value: 'off' as const, label: '关闭' },
  { value: 'quick' as const, label: '快速增强' },
  { value: 'smart' as const, label: '智能迭代' },
  { value: 'multi' as const, label: '多角度增强' },
];

/**
 * 获取增强模式的显示标签
 * @param mode 增强模式
 * @returns 显示标签
 */
export function getEnhanceModeLabel(mode: EnhanceMode): string {
  const option = enhanceModeOptions.find((opt) => opt.value === mode);
  return option?.label ?? '关闭';
}
