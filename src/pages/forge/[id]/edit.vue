<script setup lang="ts">
/**
 * Forge 编辑页面
 */
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NSpin, useMessage } from 'naive-ui';
import { useForgeStore } from '@/stores';
import type { UpdateForgeParams } from '@/types';
import ForgeForm from '../components/ForgeForm.vue';

const route = useRoute();
const router = useRouter();
const message = useMessage();
const forgeStore = useForgeStore();

// Forge ID
const forgeId = computed(() => parseInt(route.params.id as string, 10));

// 当前 Forge
const forge = computed(() => forgeStore.currentForge);

// 加载状态
const pageLoading = computed(() => forgeStore.loading);

// 提交状态
const submitLoading = ref(false);

// 获取 Forge 详情
const fetchForge = async () => {
  if (isNaN(forgeId.value)) {
    message.error('无效的 Forge ID');
    router.push('/forge/plaza');
    return;
  }
  try {
    const forgeData = await forgeStore.fetchForgeById(forgeId.value);
    // 检查编辑权限
    if (!forgeData.canEdit) {
      message.error('无权编辑此 Forge');
      router.push(`/forge/${forgeId.value}`);
    }
  } catch {
    message.error('获取 Forge 详情失败');
    router.push('/forge/plaza');
  }
};

// 提交表单
const handleSubmit = async (data: UpdateForgeParams) => {
  submitLoading.value = true;
  try {
    await forgeStore.updateForge(forgeId.value, data);
    message.success('保存成功');
    router.push(`/forge/${forgeId.value}`);
  } catch {
    message.error('保存失败');
  } finally {
    submitLoading.value = false;
  }
};

// 取消
const handleCancel = () => {
  router.back();
};

// 初始化
onMounted(() => {
  fetchForge();
});
</script>

<template>
  <div class="forge-edit h-full overflow-auto p-6">
    <!-- 加载状态 -->
    <div v-if="pageLoading" class="flex h-full items-center justify-center">
      <NSpin size="large" />
    </div>

    <template v-else-if="forge">
      <!-- 头部 -->
      <div class="mb-6">
        <h1 class="text-theme text-2xl font-bold">编辑 Forge</h1>
        <p class="text-theme-secondary mt-1">修改 {{ forge.displayName }} 的配置</p>
      </div>

      <!-- 表单 -->
      <ForgeForm
        mode="edit"
        :forge="forge"
        :loading="submitLoading"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </template>
  </div>
</template>
