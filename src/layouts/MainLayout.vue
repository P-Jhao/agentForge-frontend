<script setup lang="ts">
import { h, ref, type Component } from 'vue';
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

// 侧边栏折叠状态
const collapsed = ref(false);

// 当前选中的菜单
const activeKey = ref('home');

// 渲染图标的辅助函数
function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

// 侧边栏菜单配置
const menuOptions: MenuOption[] = [
  {
    label: '首页',
    key: 'home',
    icon: renderIcon(HomeOutline),
  },
  {
    label: '代码审计',
    key: 'code-audit',
    icon: renderIcon(CodeSlashOutline),
  },
  {
    label: '智能评分',
    key: 'scoring',
    icon: renderIcon(CheckmarkCircleOutline),
  },
  {
    label: 'RAG 检索',
    key: 'rag-search',
    icon: renderIcon(SearchOutline),
  },
  {
    label: '系统设置',
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
  // TODO: 实现用户菜单功能
  if (key === 'logout') {
    // 退出登录逻辑
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
      <div class="flex h-16 items-center justify-center border-b border-gray-200">
        <span v-if="!collapsed" class="text-primary-600 text-xl font-bold">🤖 AgentForge</span>
        <span v-else class="text-2xl">🤖</span>
      </div>

      <!-- 导航菜单 -->
      <NMenu
        v-model:value="activeKey"
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
        <slot></slot>
      </NLayoutContent>
    </NLayout>
  </NLayout>
</template>
