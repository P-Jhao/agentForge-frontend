<script setup lang="ts">
/**
 * 个人中心页面
 * 使用 CSS 类自动适配深浅主题
 */
import { NCard, NAvatar, NButton, NDescriptions, NDescriptionsItem } from 'naive-ui';

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
      <h1 class="text-theme text-2xl font-bold">个人中心</h1>
      <p class="text-theme-secondary mt-1 text-sm">管理您的账户信息和偏好设置</p>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- 用户头像卡片 -->
      <NCard class="card-theme-gradient">
        <div class="flex flex-col items-center py-4">
          <NAvatar
            :size="80"
            round
            class="from-primary-500 to-accent-purple bg-linear-to-br text-2xl font-bold text-white"
          >
            U
          </NAvatar>
          <h2 class="text-theme mt-4 text-xl font-semibold">
            {{ userInfo.username }}
          </h2>
          <p class="text-theme-secondary text-sm">
            {{ userInfo.email }}
          </p>
          <NButton type="primary" class="btn-theme mt-4">编辑资料</NButton>
        </div>
      </NCard>

      <!-- 账户信息卡片 -->
      <NCard title="账户信息" class="card-theme-gradient lg:col-span-2">
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
