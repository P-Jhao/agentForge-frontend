<script setup lang="ts">
/**
 * 个人中心页面
 */
import { NCard, NAvatar, NButton, NDescriptions, NDescriptionsItem } from 'naive-ui';
import { useThemeStore } from '@/stores';

const themeStore = useThemeStore();

// 模拟用户数据
const userInfo = {
  username: '用户名',
  email: 'user@example.com',
  role: '管理员',
  createdAt: '2024-01-01',
  lastLogin: '2024-12-15 10:30:00',
};
</script>

<template>
  <div class="p-6">
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold" :class="themeStore.isDark ? 'text-white' : 'text-gray-800'">
        个人中心
      </h1>
      <p class="mt-1 text-sm" :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'">
        管理您的账户信息和偏好设置
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- 用户头像卡片 -->
      <NCard :class="themeStore.isDark ? 'card-gradient' : ''">
        <div class="flex flex-col items-center py-4">
          <NAvatar
            :size="80"
            round
            class="from-primary-500 to-accent-purple bg-linear-to-br text-2xl font-bold text-white"
          >
            U
          </NAvatar>
          <h2
            class="mt-4 text-xl font-semibold"
            :class="themeStore.isDark ? 'text-white' : 'text-gray-800'"
          >
            {{ userInfo.username }}
          </h2>
          <p class="text-sm" :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'">
            {{ userInfo.email }}
          </p>
          <NButton
            type="primary"
            class="mt-4"
            :class="themeStore.isDark ? 'btn-glow' : 'btn-gradient'"
          >
            编辑资料
          </NButton>
        </div>
      </NCard>

      <!-- 账户信息卡片 -->
      <NCard
        title="账户信息"
        :class="themeStore.isDark ? 'card-gradient' : ''"
        class="lg:col-span-2"
      >
        <NDescriptions label-placement="left" :column="1">
          <NDescriptionsItem label="用户名">
            {{ userInfo.username }}
          </NDescriptionsItem>
          <NDescriptionsItem label="邮箱">
            {{ userInfo.email }}
          </NDescriptionsItem>
          <NDescriptionsItem label="角色">
            {{ userInfo.role }}
          </NDescriptionsItem>
          <NDescriptionsItem label="注册时间">
            {{ userInfo.createdAt }}
          </NDescriptionsItem>
          <NDescriptionsItem label="最后登录">
            {{ userInfo.lastLogin }}
          </NDescriptionsItem>
        </NDescriptions>
      </NCard>
    </div>
  </div>
</template>
