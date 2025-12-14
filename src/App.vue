<script setup lang="ts">
import { computed } from 'vue';
import { NConfigProvider, NMessageProvider } from 'naive-ui';
import { useThemeStore } from './stores';
import { darkTheme, lightTheme, darkThemeOverrides, lightThemeOverrides } from './styles/theme';

const themeStore = useThemeStore();

// 根据主题状态选择对应配置
const currentTheme = computed(() => (themeStore.isDark ? darkTheme : lightTheme));
const currentOverrides = computed(() =>
  themeStore.isDark ? darkThemeOverrides : lightThemeOverrides
);
</script>

<template>
  <NConfigProvider :theme="currentTheme" :theme-overrides="currentOverrides">
    <NMessageProvider>
      <RouterView />
    </NMessageProvider>
  </NConfigProvider>
</template>
