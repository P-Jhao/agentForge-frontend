<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { NConfigProvider, NMessageProvider, NDialogProvider } from 'naive-ui';
import { useThemeStore, useUserStore } from './stores';
import { darkTheme, lightTheme, darkThemeOverrides, lightThemeOverrides } from './styles/theme';

const themeStore = useThemeStore();
const userStore = useUserStore();

// 根据主题状态选择对应配置
const currentTheme = computed(() => (themeStore.isDark ? darkTheme : lightTheme));
const currentOverrides = computed(() =>
  themeStore.isDark ? darkThemeOverrides : lightThemeOverrides
);

// 初始化用户状态
onMounted(() => {
  userStore.init();
});
</script>

<template>
  <NConfigProvider :theme="currentTheme" :theme-overrides="currentOverrides">
    <NMessageProvider>
      <NDialogProvider>
        <RouterView />
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>
