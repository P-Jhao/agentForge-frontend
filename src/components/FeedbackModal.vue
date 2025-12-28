<script setup lang="ts">
/**
 * 反馈弹窗组件
 * 用于用户对 AI 回复进行点赞或踩的反馈
 */
import { ref, computed, watch } from 'vue';
import { NModal, NButton, NInput, useMessage } from 'naive-ui';
import { submitFeedback } from '@/utils/feedbackApi';

// 点赞标签选项
const LIKE_TAGS = ['回答准确', '理解到位', '工具使用恰当', '响应速度快', '思路清晰', '其他'];

// 踩标签选项
const DISLIKE_TAGS = ['回答不准确', '理解有偏差', '工具调用失败', '响应太慢', '逻辑混乱', '其他'];

const props = defineProps<{
  show: boolean;
  type: 'like' | 'dislike';
  taskId: string;
  turnEndMessageId: number;
}>();

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'success', type: 'like' | 'dislike'): void;
}>();

const message = useMessage();
const loading = ref(false);

// 选中的标签
const selectedTags = ref<string[]>([]);

// 反馈内容
const content = ref('');

// 根据类型获取标签选项
const tagOptions = computed(() => (props.type === 'like' ? LIKE_TAGS : DISLIKE_TAGS));

// 弹窗标题
const modalTitle = computed(() => (props.type === 'like' ? '感谢您的认可' : '感谢您的反馈'));

// 提交按钮是否禁用
// 规则：未选择标签且未填写内容 → 禁用
// 规则：只选择"其他"标签且未填写内容 → 禁用
const isSubmitDisabled = computed(() => {
  const hasContent = content.value.trim().length > 0;
  const hasNonOtherTag = selectedTags.value.some((tag) => tag !== '其他');

  // 有内容则可提交
  if (hasContent) return false;

  // 没有内容时，必须有非"其他"标签
  return !hasNonOtherTag;
});

// 监听弹窗打开，重置表单
watch(
  () => props.show,
  (val) => {
    if (val) {
      selectedTags.value = [];
      content.value = '';
    }
  }
);

// 切换标签选中状态
function toggleTag(tag: string) {
  const index = selectedTags.value.indexOf(tag);
  if (index === -1) {
    selectedTags.value.push(tag);
  } else {
    selectedTags.value.splice(index, 1);
  }
}

// 关闭弹窗
function handleClose() {
  emit('update:show', false);
}

// 提交反馈
async function handleSubmit() {
  if (isSubmitDisabled.value) return;

  loading.value = true;
  try {
    await submitFeedback({
      taskId: props.taskId,
      turnEndMessageId: props.turnEndMessageId,
      type: props.type,
      tags: selectedTags.value.length > 0 ? selectedTags.value : undefined,
      content: content.value.trim() || undefined,
    });
    message.success('反馈成功，感谢您的宝贵反馈');
    emit('success', props.type);
    handleClose();
  } catch (error: unknown) {
    // 处理节流错误
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as { response?: { status?: number } }).response;
      if (response?.status === 429) {
        message.warning('反馈过于频繁，请稍后再试');
        return;
      }
    }
    message.error('提交反馈失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="modalTitle"
    :mask-closable="true"
    :bordered="false"
    :segmented="{ content: true, footer: true }"
    style="width: 640px"
    :content-style="{ minHeight: '360px', display: 'flex', flexDirection: 'column' }"
    @update:show="emit('update:show', $event)"
  >
    <div style="display: flex; flex-direction: column; flex: 1">
      <!-- 副标题 -->
      <div class="mb-6 text-sm text-gray-500 dark:text-gray-400">您的反馈将帮助我们持续改进</div>

      <!-- 标签选择区域 -->
      <div class="mb-6">
        <div class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ type === 'like' ? '哪些方面让您满意？' : '哪些方面需要改进？' }}
        </div>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="tag in tagOptions"
            :key="tag"
            class="cursor-pointer rounded-md border px-3 py-1.5 text-sm transition-all duration-200 select-none hover:scale-105"
            :class="
              selectedTags.includes(tag)
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-gray-300 bg-gray-50 text-gray-600 hover:border-gray-400 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-700'
            "
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </div>
        </div>
      </div>

      <!-- 详细内容输入 -->
      <div style="flex: 1; display: flex; flex-direction: column">
        <div class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          详细说明（选填）
        </div>
        <NInput
          v-model:value="content"
          type="textarea"
          placeholder="请输入您的具体反馈，帮助我们更好地改进..."
          :maxlength="500"
          show-count
          :autosize="{ minRows: 6, maxRows: 10 }"
          style="flex: 1"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <NButton size="medium" @click="handleClose">取消</NButton>
        <NButton
          type="primary"
          size="medium"
          :loading="loading"
          :disabled="isSubmitDisabled"
          @click="handleSubmit"
        >
          提交反馈
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
/* 无需额外样式 */
</style>
