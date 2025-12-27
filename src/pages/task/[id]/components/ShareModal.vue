<script setup lang="ts">
/**
 * 分享任务弹窗组件
 * 支持选择分享模式（详情/回放）和有效期
 */
import { ref, computed } from 'vue';
import { NModal, NCard, NButton, NSpace, NInputNumber, NIcon, NAlert, useMessage } from 'naive-ui';
import { DocumentTextOutline, PlayOutline, LinkOutline } from '@vicons/ionicons5';
import { generateShareSign } from '@/utils/shareApi';

const props = defineProps<{
  show: boolean;
  taskId: string;
}>();

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
}>();

const message = useMessage();

// 分享模式
const shareMode = ref<'detail' | 'replay'>('detail');

// 有效期（天）
const expireDays = ref(1);

// 加载状态
const loading = ref(false);

// 控制弹窗显示
const showModal = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val),
});

// 选择分享模式
function selectMode(mode: 'detail' | 'replay') {
  shareMode.value = mode;
}

// 生成分享链接并复制
async function handleCopyLink() {
  if (!props.taskId) {
    message.error('任务 ID 无效');
    return;
  }

  loading.value = true;
  try {
    // 调用后端生成签名
    const sign = await generateShareSign(props.taskId, shareMode.value, expireDays.value);

    // 构建分享链接
    const baseUrl = window.location.origin;
    const path =
      shareMode.value === 'replay' ? `/task/${props.taskId}/replay` : `/task/${props.taskId}`;
    const shareUrl = `${baseUrl}${path}?shareSign=${encodeURIComponent(sign)}`;

    // 复制到剪贴板
    await window.navigator.clipboard.writeText(shareUrl);
    message.success('分享链接已复制到剪贴板');
    showModal.value = false;
  } catch (error) {
    const err = error as { message?: string };
    message.error(err.message || '生成分享链接失败');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <NModal v-model:show="showModal" :mask-closable="true">
    <NCard
      title="分享任务链接"
      :bordered="false"
      size="medium"
      role="dialog"
      aria-modal="true"
      style="width: 560px"
      :segmented="{ content: true, footer: 'soft' }"
    >
      <template #header-extra>
        <NButton quaternary circle size="small" @click="showModal = false">
          <template #icon>×</template>
        </NButton>
      </template>

      <div class="space-y-5">
        <!-- 提示信息 -->
        <NAlert type="info" :bordered="false">
          任何获得链接的人都可以查看该任务详情和文件，请检查是否包含敏感或隐私数据。
        </NAlert>

        <!-- 分享模式选择 -->
        <div>
          <div class="mb-2 text-sm font-medium">
            <span class="text-red-500">*</span>
            分享模式
          </div>
          <div class="grid grid-cols-2 gap-3">
            <!-- 详情模式 -->
            <div
              class="cursor-pointer rounded-lg border-2 p-4 transition-all"
              :class="
                shareMode === 'detail'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
              "
              @click="selectMode('detail')"
            >
              <div class="flex items-center gap-2">
                <NIcon :component="DocumentTextOutline" :size="20" class="text-primary-500" />
                <span class="font-medium" :class="shareMode === 'detail' ? 'text-primary-600' : ''">
                  详情模式
                </span>
              </div>
              <p class="mt-1 text-xs text-gray-500">一次性加载数据，最常用</p>
            </div>

            <!-- 回放模式 -->
            <div
              class="cursor-pointer rounded-lg border-2 p-4 transition-all"
              :class="
                shareMode === 'replay'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
              "
              @click="selectMode('replay')"
            >
              <div class="flex items-center gap-2">
                <NIcon :component="PlayOutline" :size="20" />
                <span class="font-medium" :class="shareMode === 'replay' ? 'text-primary-600' : ''">
                  回放模式
                </span>
              </div>
              <p class="mt-1 text-xs text-gray-500">使用回放的方式查看，适合演示场景</p>
            </div>
          </div>
        </div>

        <!-- 有效期设置 -->
        <div>
          <div class="mb-2 text-sm font-medium">
            <span class="text-red-500">*</span>
            分享时效
          </div>
          <div class="flex items-center gap-2">
            <NInputNumber
              v-model:value="expireDays"
              :min="1"
              :max="7"
              :show-button="false"
              style="width: 80px"
            />
            <span class="text-sm text-gray-500">天内有效（请输入 1-7 之间的整数）</span>
          </div>
        </div>
      </div>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="showModal = false">取消</NButton>
          <NButton type="primary" :loading="loading" @click="handleCopyLink">
            <template #icon>
              <NIcon :component="LinkOutline" />
            </template>
            复制分享链接
          </NButton>
        </NSpace>
      </template>
    </NCard>
  </NModal>
</template>
