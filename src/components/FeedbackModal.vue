<script setup lang="ts">
/**
 * 反馈弹窗组件
 * 用于用户对 AI 回复进行点赞或踩的反馈
 */
import { ref, computed, watch } from 'vue';
import { NModal, NButton, NInput, NTag, useMessage } from 'naive-ui';
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
    style="width: 420px"
    :mask-closable="false"
    @update:show="emit('update:show', $event)"
  >
    <!-- 标签选择区域 -->
    <div class="mb-4">
      <div class="mb-2 text-sm text-gray-600 dark:text-gray-400">
        {{ type === 'like' ? '哪些方面让您满意？' : '哪些方面需要改进？' }}
      </div>
      <div class="flex flex-wrap gap-2">
        <NTag
          v-for="tag in tagOptions"
          :key="tag"
          :type="selectedTags.includes(tag) ? 'primary' : 'default'"
          :bordered="!selectedTags.includes(tag)"
          checkable
          :checked="selectedTags.includes(tag)"
          class="cursor-pointer"
          @click="toggleTag(tag)"
        >
          {{ tag }}
        </NTag>
      </div>
    </div>

    <!-- 详细内容输入 -->
    <div class="mb-2">
      <div class="mb-2 text-sm text-gray-600 dark:text-gray-400">详细说明（选填）</div>
      <NInput
        v-model:value="content"
        type="textarea"
        placeholder="请输入您的具体反馈..."
        :maxlength="500"
        show-count
        :rows="3"
      />
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <NButton @click="handleClose">取消</NButton>
        <NButton
          type="primary"
          :loading="loading"
          :disabled="isSubmitDisabled"
          @click="handleSubmit"
        >
          提交
        </NButton>
      </div>
    </template>
  </NModal>
</template>
