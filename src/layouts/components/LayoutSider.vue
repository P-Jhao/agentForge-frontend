<script setup lang="ts">
import { h, computed, type Component } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { NLayoutSider, NMenu, NIcon } from 'naive-ui';
import type { MenuOption } from 'naive-ui';
import {
  HomeOutline,
  CodeSlashOutline,
  CheckmarkCircleOutline,
  SearchOutline,
  SettingsOutline,
} from '@vicons/ionicons5';
import { useThemeStore } from '@/stores';

// 接收折叠状态
const collapsed = defineModel<boolean>('collapsed', { default: false });

const route = useRoute();
const themeStore = useThemeStore();

// 当前选中的菜单（根据路由自动计算）
const activeKey = computed(() => {
  const path = route.path;
  if (path === '/') return 'home';
  return path.slice(1);
});

// 渲染图标的辅助函数
function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

// 渲染路由链接的辅助函数
function renderRouterLink(to: string, label: string) {
  return () => h(RouterLink, { to }, { default: () => label });
}

// 侧边栏菜单配置
const menuOptions: MenuOption[] = [
  {
    label: renderRouterLink('/', '首页'),
    key: 'home',
    icon: renderIcon(HomeOutline),
  },
  {
    label: renderRouterLink('/code-audit', '代码审计'),
    key: 'code-audit',
    icon: renderIcon(CodeSlashOutline),
  },
  {
    label: renderRouterLink('/scoring', '智能评分'),
    key: 'scoring',
    icon: renderIcon(CheckmarkCircleOutline),
  },
  {
    label: renderRouterLink('/rag-search', 'RAG 检索'),
    key: 'rag-search',
    icon: renderIcon(SearchOutline),
  },
  {
    label: renderRouterLink('/settings', '系统设置'),
    key: 'settings',
    icon: renderIcon(SettingsOutline),
  },
];
</script>

<template>
  <NLayoutSider
    bordered
    collapse-mode="width"
    :collapsed-width="64"
    :width="240"
    :collapsed="collapsed"
    show-trigger
    :class="
      themeStore.isDark
        ? 'bg-dark-800/80 border-r border-white/5 backdrop-blur-xl'
        : 'border-r border-gray-200 bg-white'
    "
    @collapse="collapsed = true"
    @expand="collapsed = false"
  >
    <!-- Logo 区域 -->
    <RouterLink
      to="/"
      class="flex h-16 items-center justify-center border-b"
      :class="themeStore.isDark ? 'border-white/5' : 'border-gray-200'"
    >
      <div v-if="!collapsed" class="flex items-center gap-2">
        <div
          class="from-primary-500 to-accent-purple flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br"
        >
          <span class="text-lg">🤖</span>
        </div>
        <span class="text-gradient text-lg font-bold">AgentForge</span>
      </div>
      <div
        v-else
        class="from-primary-500 to-accent-purple flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br"
      >
        <span class="text-lg">🤖</span>
      </div>
    </RouterLink>

    <!-- 导航菜单 -->
    <NMenu
      :value="activeKey"
      :collapsed="collapsed"
      :collapsed-width="64"
      :collapsed-icon-size="22"
      :options="menuOptions"
    />
  </NLayoutSider>
</template>
