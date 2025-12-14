/**
 * 主题状态管理
 */
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export type ThemeMode = 'light' | 'dark';

export const useThemeStore = defineStore('theme', () => {
  // 从 localStorage 读取主题，默认暗色
  const mode = ref<ThemeMode>((localStorage.getItem('theme') as ThemeMode) || 'dark');

  // 是否为暗色模式
  const isDark = computed(() => mode.value === 'dark');

  // 切换主题
  function toggleTheme() {
    mode.value = mode.value === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', mode.value);
    updateHtmlClass();
  }

  // 设置主题
  function setTheme(newMode: ThemeMode) {
    mode.value = newMode;
    localStorage.setItem('theme', newMode);
    updateHtmlClass();
  }

  // 更新 html 标签的 class（用于 Tailwind dark 模式）
  function updateHtmlClass() {
    if (mode.value === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // 初始化时设置 class
  updateHtmlClass();

  return {
    mode,
    isDark,
    toggleTheme,
    setTheme,
  };
});
