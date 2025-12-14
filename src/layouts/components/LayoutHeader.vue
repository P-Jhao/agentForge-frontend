<script setup lang="ts">
import { h, type Component } from 'vue';
import { useRouter } from 'vue-router';
import { NLayoutHeader, NButton, NSpace, NAvatar, NDropdown, NIcon } from 'naive-ui';
import { PersonOutline, LogOutOutline } from '@vicons/ionicons5';

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
</template>
