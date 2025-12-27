<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { NConfigProvider, NMessageProvider, NDialogProvider, zhCN, dateZhCN } from 'naive-ui';
import { useThemeStore, useUserStore, useMCPStore } from './stores';
import { darkTheme, lightTheme, darkThemeOverrides, lightThemeOverrides } from './styles/theme';

const themeStore = useThemeStore();
const userStore = useUserStore();
const mcpStore = useMCPStore();

// 根据主题状态选择对应配置
const currentTheme = computed(() => (themeStore.isDark ? darkTheme : lightTheme));
const currentOverrides = computed(() =>
  themeStore.isDark ? darkThemeOverrides : lightThemeOverrides
);

// 初始化应用状态
onMounted(() => {
  userStore.init();
  // 初始化 MCP SSE 监听器，用于实时接收 MCP 状态变化
  mcpStore.initializeSSEListener();
});
</script>

<template>
  <NConfigProvider
    :theme="currentTheme"
    :theme-overrides="currentOverrides"
    :locale="zhCN"
    :date-locale="dateZhCN"
  >
    <NMessageProvider>
      <NDialogProvider>
        <RouterView />
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>
