<script setup lang="ts">
import { darkTheme } from 'naive-ui';
import { NConfigProvider, NMessageProvider } from 'naive-ui';

// Naive UI 主题覆盖
const themeOverrides = {
  common: {
    primaryColor: '#6172f3',
    primaryColorHover: '#444ce7',
    primaryColorPressed: '#3538cd',
    primaryColorSuppl: '#8098f9',
  },
  Menu: {
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
};
</script>

<template>
  <NConfigProvider :theme="darkTheme" :theme-overrides="themeOverrides">
    <NMessageProvider>
      <RouterView />
    </NMessageProvider>
  </NConfigProvider>
</template>
