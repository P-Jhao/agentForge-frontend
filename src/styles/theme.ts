/**
 * Naive UI 主题配置
 */
import { darkTheme, lightTheme } from 'naive-ui';
import type { GlobalThemeOverrides } from 'naive-ui';

// 导出主题
export { darkTheme, lightTheme };

// 暗色主题覆盖配置
export const darkThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#6172f3',
    primaryColorHover: '#444ce7',
    primaryColorPressed: '#3538cd',
    primaryColorSuppl: '#8098f9',
    bodyColor: '#0a0a0f',
    cardColor: '#12121a',
    modalColor: '#12121a',
    popoverColor: '#1a1a24',
    tableColor: '#12121a',
    inputColor: 'rgba(255, 255, 255, 0.05)',
  },
  Layout: {
    color: '#0a0a0f',
    siderColor: '#12121a',
    headerColor: '#12121a',
  },
  Menu: {
    color: 'transparent',
    itemTextColor: '#9ca3af',
    itemTextColorHover: '#ffffff',
    itemTextColorActive: '#6172f3',
    itemIconColor: '#9ca3af',
    itemIconColorHover: '#ffffff',
    itemIconColorActive: '#6172f3',
    itemColorActive: 'rgba(97, 114, 243, 0.1)',
    itemColorActiveHover: 'rgba(97, 114, 243, 0.15)',
  },
  Input: {
    color: 'rgba(255, 255, 255, 0.05)',
    colorFocus: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderHover: '1px solid rgba(97, 114, 243, 0.5)',
    borderFocus: '1px solid #6172f3',
    textColor: '#ffffff',
    placeholderColor: '#6b7280',
  },
  Button: {
    textColorPrimary: '#ffffff',
  },
  Card: {
    color: '#12121a',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
};

// 浅色主题覆盖配置
export const lightThemeOverrides: GlobalThemeOverrides = {
  common: {
    // 主色调 - 使用更深的蓝紫色以增强对比度
    primaryColor: '#5046e5',
    primaryColorHover: '#4338ca',
    primaryColorPressed: '#3730a3',
    primaryColorSuppl: '#6366f1',
    // 背景色 - 使用温暖的灰白色
    bodyColor: '#f8fafc',
    cardColor: '#ffffff',
    modalColor: '#ffffff',
    popoverColor: '#ffffff',
    tableColor: '#ffffff',
    // 文字颜色
    textColor1: '#1e293b',
    textColor2: '#475569',
    textColor3: '#64748b',
    // 边框颜色
    borderColor: '#e2e8f0',
    dividerColor: '#e2e8f0',
  },
  Layout: {
    color: '#f1f5f9',
    siderColor: '#ffffff',
    headerColor: '#ffffff',
  },
  Menu: {
    color: 'transparent',
    itemTextColor: '#475569',
    itemTextColorHover: '#1e293b',
    itemTextColorActive: '#5046e5',
    itemIconColor: '#64748b',
    itemIconColorHover: '#1e293b',
    itemIconColorActive: '#5046e5',
    itemColorActive: 'rgba(80, 70, 229, 0.08)',
    itemColorActiveHover: 'rgba(80, 70, 229, 0.12)',
  },
  Input: {
    color: '#ffffff',
    colorFocus: '#ffffff',
    border: '1px solid #e2e8f0',
    borderHover: '1px solid #a5b4fc',
    borderFocus: '1px solid #5046e5',
    textColor: '#1e293b',
    placeholderColor: '#94a3b8',
  },
  Button: {
    textColorPrimary: '#ffffff',
    colorPrimary: '#5046e5',
    colorHoverPrimary: '#4338ca',
    colorPressedPrimary: '#3730a3',
  },
  Card: {
    color: '#ffffff',
    borderColor: '#e2e8f0',
    titleTextColor: '#1e293b',
    textColor: '#475569',
  },
};
