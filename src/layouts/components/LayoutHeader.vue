<script setup lang="ts">
import { h, watch, type Component } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { NLayoutHeader, NButton, NSpace, NAvatar, NDropdown, NIcon, NTooltip } from 'naive-ui';
import { PersonOutline, LogOutOutline, SunnyOutline, MoonOutline } from '@vicons/ionicons5';
import { useThemeStore, useUserStore, useTaskStore } from '@/stores';
import NotificationPopover from '@/components/NotificationPopover.vue';

const router = useRouter();
const route = useRoute();
const themeStore = useThemeStore();
const userStore = useUserStore();
const taskStore = useTaskStore();

// 监听路由变化，离开任务页面时清除当前任务
watch(
  () => route.path,
  (newPath) => {
    if (!newPath.startsWith('/task/') || newPath === '/task/list') {
      taskStore.clearCurrentTask();
    }
  },
  { immediate: true }
);

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
    userStore.logout();
    router.push('/login');
  } else if (key === 'profile') {
    router.push('/profile');
  }
}

// 跳转登录页
function goLogin() {
  router.push('/login');
}
</script>

<template>
  <NLayoutHeader class="header-container flex h-16 items-center justify-between border-b px-6">
    <!-- 左侧标题 -->
    <div class="flex min-w-0 flex-1 items-center gap-3">
      <NTooltip v-if="taskStore.hasCurrentTask" :delay="500">
        <template #trigger>
          <span class="text-theme max-w-[400px] truncate text-lg font-medium">
            {{ taskStore.currentTaskName }}
          </span>
        </template>
        {{ taskStore.currentTaskName }}
      </NTooltip>
      <span v-else class="text-theme text-lg font-medium">AgentForge</span>
      <span
        v-if="!taskStore.hasCurrentTask"
        class="bg-primary-500/20 text-primary-500 shrink-0 rounded-full px-2 py-0.5 text-xs"
      >
        Beta
      </span>
    </div>

    <!-- 右侧操作区 -->
    <NSpace align="center" :size="16">
      <!-- 主题切换 -->
      <NTooltip>
        <template #trigger>
          <NButton quaternary circle @click="themeStore.toggleTheme">
            <template #icon>
              <NIcon :component="themeStore.isDark ? SunnyOutline : MoonOutline" :size="20" />
            </template>
          </NButton>
        </template>
        {{ themeStore.isDark ? '切换到浅色模式' : '切换到深色模式' }}
      </NTooltip>

      <!-- 通知 -->
      <NotificationPopover />

      <!-- 用户（已登录） -->
      <NDropdown v-if="userStore.isLoggedIn" :options="userOptions" @select="handleUserSelect">
        <div
          class="user-capsule flex cursor-pointer items-center gap-2 rounded-full border py-1 pr-3 pl-1 transition-colors"
        >
          <!-- 有头像时显示图片 -->
          <NAvatar
            v-if="userStore.userInfo?.avatar"
            round
            size="small"
            :src="userStore.userInfo.avatar"
            class="header-avatar"
          />
          <!-- 无头像时显示首字母 -->
          <NAvatar
            v-else
            round
            size="small"
            class="from-primary-500 to-accent-purple bg-linear-to-br"
          >
            {{ userStore.userInfo?.username?.charAt(0)?.toUpperCase() || 'U' }}
          </NAvatar>
          <span class="sider-item-text text-sm">
            {{ userStore.userInfo?.username || '用户' }}
          </span>
        </div>
      </NDropdown>

      <!-- 未登录 -->
      <div
        v-else
        class="user-capsule flex cursor-pointer items-center gap-2 rounded-full border py-1 pr-3 pl-1 transition-colors"
        @click="goLogin"
      >
        <NAvatar round size="small" class="bg-gray-400">?</NAvatar>
        <span class="sider-item-text text-sm">未登录</span>
      </div>

      <!-- 任务页展开/收起按钮 -->
    </NSpace>
  </NLayoutHeader>
</template>

<style scoped>
/* 头像图片保持比例裁剪 */
.header-avatar :deep(img) {
  object-fit: cover;
}
</style>
