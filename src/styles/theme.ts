/**
 * Naive UI 主题配置
 * 暗色科技风格
 */
import { darkTheme } from 'naive-ui';
import type { GlobalThemeOverrides } from 'naive-ui';

// 导出暗色主题
export { darkTheme };

// 主题覆盖配置
export const themeOverrides: GlobalThemeOverrides = {
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
