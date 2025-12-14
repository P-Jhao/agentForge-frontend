<script setup lang="ts">
import { NConfigProvider, NMessageProvider } from 'naive-ui';
import { darkTheme, themeOverrides } from './styles/theme';
</script>

<template>
  <NConfigProvider :theme="darkTheme" :theme-overrides="themeOverrides">
    <NMessageProvider>
      <RouterView />
    </NMessageProvider>
  </NConfigProvider>
</template>
