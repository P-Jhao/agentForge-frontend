<script setup lang="ts">
/**
 * Forge 创建页面
 */
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { NButton, NIcon, useMessage } from 'naive-ui';
import { ArrowBackOutline } from '@vicons/ionicons5';
import { useForgeStore } from '@/stores';
import type { CreateForgeParams, UpdateForgeParams } from '@/types';
import ForgeForm from '../components/ForgeForm.vue';

const router = useRouter();
const message = useMessage();
const forgeStore = useForgeStore();

// 提交状态
const loading = ref(false);

// 提交表单
const handleSubmit = async (data: CreateForgeParams | UpdateForgeParams) => {
  loading.value = true;
  try {
    const forgeId = await forgeStore.createForge(data as CreateForgeParams);
    message.success('创建成功');
    router.push(`/forge/${forgeId}`);
  } catch {
    message.error('创建失败');
  } finally {
    loading.value = false;
  }
};

// 取消
const handleCancel = () => {
  router.back();
};
</script>

<template>
  <div class="forge-create h-full overflow-auto p-6">
    <!-- 头部 -->
    <div class="mb-6 flex items-start gap-4">
      <NButton quaternary circle size="small" @click="handleCancel">
        <template #icon>
          <NIcon :component="ArrowBackOutline" />
        </template>
      </NButton>
      <div>
        <h1 class="text-theme text-2xl font-bold">新建 Forge</h1>
        <p class="text-theme-secondary mt-1">创建你的专属 AI 助手</p>
      </div>
    </div>

    <!-- 表单 -->
    <ForgeForm mode="create" :loading="loading" @submit="handleSubmit" @cancel="handleCancel" />
  </div>
</template>
