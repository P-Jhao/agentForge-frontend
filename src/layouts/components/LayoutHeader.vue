<script setup lang="ts">
import { h, type Component } from 'vue';
import { useRouter } from 'vue-router';
import { NLayoutHeader, NButton, NSpace, NAvatar, NDropdown, NIcon, NBadge } from 'naive-ui';
import { PersonOutline, LogOutOutline, NotificationsOutline } from '@vicons/ionicons5';

const router = useRouter();

// 渲染图标的辅助函数
function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

// 用户下拉菜单
const userOptions = [
  {
    label: '个人中心',
    key: 'profile',
    icon: renderIcon(PersonOutline),
  },
  {
    type: 'divider',
    key: 'd1',
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
  <NLayoutHeader
    class="bg-dark-800/80 flex h-16 items-center justify-between border-b border-white/5 px-6 backdrop-blur-xl"
  >
    <!-- 左侧标题 -->
    <div class="flex items-center gap-3">
      <span class="text-lg font-medium text-white">AgentForge</span>
      <span class="bg-primary-500/20 text-primary-400 rounded-full px-2 py-0.5 text-xs">Beta</span>
    </div>

    <!-- 右侧操作区 -->
    <NSpace align="center" :size="16">
      <!-- 通知 -->
      <NBadge :value="3" :max="9">
        <NButton quaternary circle>
          <template #icon>
            <NIcon :component="NotificationsOutline" :size="20" />
          </template>
        </NButton>
      </NBadge>

      <!-- 用户 -->
      <NDropdown :options="userOptions" @select="handleUserSelect">
        <div
          class="flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pr-3 pl-1 transition-colors hover:bg-white/10"
        >
          <NAvatar round size="small" class="from-primary-500 to-accent-purple bg-linear-to-br">
            U
          </NAvatar>
          <span class="text-sm text-gray-300">用户名</span>
        </div>
      </NDropdown>
    </NSpace>
  </NLayoutHeader>
</template>
