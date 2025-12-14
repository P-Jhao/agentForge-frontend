<script setup lang="ts">
import { h, ref, computed, type Component } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import {
  NLayout,
  NLayoutHeader,
  NLayoutSider,
  NLayoutContent,
  NMenu,
  NIcon,
  NButton,
  NSpace,
  NAvatar,
  NDropdown,
} from 'naive-ui';
import type { MenuOption } from 'naive-ui';
import {
  HomeOutline,
  CodeSlashOutline,
  CheckmarkCircleOutline,
  SearchOutline,
  SettingsOutline,
  PersonOutline,
  LogOutOutline,
} from '@vicons/ionicons5';

const route = useRoute();
const router = useRouter();

// 侧边栏折叠状态
const collapsed = ref(false);

// 当前选中的菜单（根据路由自动计算）
const activeKey = computed(() => {
  const path = route.path;
  if (path === '/') return 'home';
  // 移除开头的 /
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

// 用户下拉菜单
const userOptions = [
  {
    label: '个人中心',
    key: 'profile',
    icon: renderIcon(PersonOutline),
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: renderIcon(LogOutOutline),
  },
];

// 处理用户菜单点击
function handleUserSelect(key: string) {
  if (key === 'logout') {
    // TODO: 清除登录状态
    router.push('/login');
  } else if (key === 'profile') {
    // TODO: 跳转个人中心
  }
}
</script>

<template>
  <NLayout has-sider class="h-screen">
    <!-- 侧边栏 -->
    <NLayoutSider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="240"
      :collapsed="collapsed"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <!-- Logo 区域 -->
      <RouterLink to="/" class="flex h-16 items-center justify-center border-b border-gray-200">
        <span v-if="!collapsed" class="text-primary-600 text-xl font-bold">🤖 AgentForge</span>
        <span v-else class="text-2xl">🤖</span>
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

    <!-- 右侧主体 -->
    <NLayout>
      <!-- 顶部导航栏 -->
      <NLayoutHeader bordered class="flex h-16 items-center justify-between px-6">
        <div>AgentForge - 多功能 AI Agent 平台</div>

        <NSpace align="center">
          <NDropdown :options="userOptions" @select="handleUserSelect">
            <NButton quaternary>
              <template #icon>
                <NAvatar round size="small">U</NAvatar>
              </template>
              用户名
            </NButton>
          </NDropdown>
        </NSpace>
      </NLayoutHeader>

      <!-- 内容区域 -->
      <NLayoutContent class="p-6">
        <RouterView />
      </NLayoutContent>
    </NLayout>
  </NLayout>
</template>
