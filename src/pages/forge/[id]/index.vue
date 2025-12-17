<script setup lang="ts">
/**
 * Forge 详情页面
 * Forge 介绍 + 发送消息创建任务
 */
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NIcon, NTag, NSpin, NPopconfirm, useMessage } from 'naive-ui';
import {
  CreateOutline,
  TrashOutline,
  StarOutline,
  Star,
  FlameOutline,
  TimeOutline,
} from '@vicons/ionicons5';
import { useForgeStore, useTaskStore } from '@/stores';
import ChatInput from '@/components/ChatInput.vue';

const route = useRoute();
const router = useRouter();
const message = useMessage();
const forgeStore = useForgeStore();
const taskStore = useTaskStore();

// Forge ID
const forgeId = computed(() => parseInt(route.params.id as string, 10));

// 当前 Forge
const forge = computed(() => forgeStore.currentForge);

// 加载状态
const loading = computed(() => forgeStore.loading);

// 发送消息加载状态
const sending = ref(false);

// 输入框内容
const inputValue = ref('');

// 来源标签配置
const sourceConfig = computed(() => {
  if (!forge.value) return { text: '', type: 'default' as const };
  return forge.value.source === 'builtin'
    ? { text: '内置', type: 'info' as const }
    : { text: '用户', type: 'success' as const };
});

// 格式化日期
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// 获取 Forge 详情
const fetchForge = async () => {
  if (isNaN(forgeId.value)) {
    message.error('无效的 Forge ID');
    router.push('/forge/plaza');
    return;
  }
  try {
    await forgeStore.fetchForgeById(forgeId.value);
  } catch {
    message.error('获取 Forge 详情失败');
    router.push('/forge/plaza');
  }
};

// 收藏/取消收藏
const handleFavorite = async () => {
  if (!forge.value) return;
  try {
    await forgeStore.toggleFavorite(forge.value.id, !forge.value.isFavorite);
    message.success(forge.value.isFavorite ? '已取消收藏' : '已收藏');
  } catch {
    message.error('操作失败');
  }
};

// 编辑
const handleEdit = () => {
  router.push(`/forge/${forgeId.value}/edit`);
};

// 删除
const handleDelete = async () => {
  if (!forge.value) return;
  try {
    await forgeStore.deleteForge(forge.value.id);
    message.success('删除成功');
    router.push('/forge/plaza');
  } catch {
    message.error('删除失败');
  }
};

// 发送消息创建任务
const handleSend = async (content: string) => {
  if (!forge.value || sending.value) return;

  sending.value = true;
  try {
    // 从 Forge 创建任务
    const taskUuid = await forgeStore.createTaskFromForge(forge.value.id, content);

    // 清空输入框
    inputValue.value = '';

    // 刷新任务列表
    await taskStore.fetchTasks();

    // 跳转到任务页面
    router.push(`/task/${taskUuid}`);
  } catch {
    message.error('创建任务失败');
  } finally {
    sending.value = false;
  }
};

// 监听路由变化
watch(forgeId, () => {
  fetchForge();
});

// 初始化
onMounted(() => {
  fetchForge();
});
</script>

<template>
  <div class="forge-detail flex h-full flex-col overflow-hidden">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex h-full items-center justify-center">
      <NSpin size="large" />
    </div>

    <!-- 内容 -->
    <template v-else-if="forge">
      <!-- 详情区域（可滚动） -->
      <div class="min-h-0 flex-1 overflow-auto p-6">
        <!-- 头部信息 -->
        <div class="mb-6 flex items-start gap-4">
          <!-- 头像 -->
          <div
            class="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 text-4xl dark:from-blue-900/30 dark:to-purple-900/30"
          >
            {{ forge.avatar || '🤖' }}
          </div>

          <!-- 基本信息 -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-3">
              <h1 class="text-theme text-2xl font-bold">{{ forge.displayName }}</h1>
              <NTag size="small" :type="sourceConfig.type" round>
                {{ sourceConfig.text }}
              </NTag>
            </div>

            <div class="text-theme-secondary mt-2 flex flex-wrap items-center gap-4 text-sm">
              <span class="flex items-center gap-1">
                <NIcon :component="FlameOutline" />
                {{ forge.usageCount }} 次使用
              </span>
              <span class="flex items-center gap-1">
                <NIcon :component="TimeOutline" />
                {{ formatDate(forge.createdAt) }}
              </span>
            </div>

            <!-- 操作按钮 -->
            <div class="mt-4 flex flex-wrap gap-2">
              <NButton
                :type="forge.isFavorite ? 'warning' : 'default'"
                secondary
                @click="handleFavorite"
              >
                <template #icon>
                  <NIcon :component="forge.isFavorite ? Star : StarOutline" />
                </template>
                {{ forge.isFavorite ? '已收藏' : '收藏' }}
              </NButton>

              <NButton v-if="forge.canEdit" secondary @click="handleEdit">
                <template #icon>
                  <NIcon :component="CreateOutline" />
                </template>
                编辑
              </NButton>

              <NPopconfirm v-if="forge.canEdit" @positive-click="handleDelete">
                <template #trigger>
                  <NButton secondary type="error">
                    <template #icon>
                      <NIcon :component="TrashOutline" />
                    </template>
                    删除
                  </NButton>
                </template>
                确定要删除这个 Forge 吗？
              </NPopconfirm>
            </div>
          </div>
        </div>

        <!-- 描述 -->
        <div class="mb-6">
          <h2 class="text-theme mb-2 font-medium">描述</h2>
          <p class="text-theme-secondary">{{ forge.description || '暂无描述' }}</p>
        </div>

        <!-- 系统提示词（仅创建者可见） -->
        <div v-if="forge.isOwner && forge.systemPrompt" class="mb-6">
          <h2 class="text-theme mb-2 font-medium">系统提示词</h2>
          <div class="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
            <pre class="text-theme-secondary text-sm whitespace-pre-wrap">{{
              forge.systemPrompt
            }}</pre>
          </div>
        </div>

        <!-- 模型信息 -->
        <div class="mb-6">
          <h2 class="text-theme mb-2 font-medium">使用模型</h2>
          <NTag type="primary">
            {{ forge.model === 'qwen' ? '通义千问' : 'DeepSeek' }}
          </NTag>
        </div>
      </div>

      <!-- 输入区域（固定在底部） -->
      <div class="shrink-0 border-t border-gray-200 p-4 dark:border-gray-700">
        <ChatInput
          v-model="inputValue"
          placeholder="输入消息开始对话..."
          :loading="sending"
          @send="handleSend"
        />
      </div>
    </template>
  </div>
</template>
