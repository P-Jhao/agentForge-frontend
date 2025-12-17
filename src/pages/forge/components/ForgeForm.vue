<script setup lang="ts">
/**
 * Forge 表单组件
 * 用于创建和编辑 Forge
 */
import { ref, watch, computed } from 'vue';
import {
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSwitch,
  NButton,
  NIcon,
  NUpload,
  NSpin,
  NAvatar,
  useMessage,
  type FormInst,
  type FormRules,
  type UploadCustomRequestOptions,
} from 'naive-ui';
import { SaveOutline, CloudUploadOutline } from '@vicons/ionicons5';
import { useThemeStore } from '@/stores';
import { uploadAvatar } from '@/utils';
import type { ForgeDetail, CreateForgeParams, UpdateForgeParams } from '@/types';

const props = defineProps<{
  // 编辑模式时传入现有数据
  forge?: ForgeDetail;
  // 模式：create 创建 / edit 编辑
  mode: 'create' | 'edit';
  // 提交中
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [data: CreateForgeParams | UpdateForgeParams];
  cancel: [];
}>();

const themeStore = useThemeStore();
const message = useMessage();

// 表单引用
const formRef = ref<FormInst | null>(null);

// 头像上传状态
const avatarUploading = ref(false);

// 表单数据
const formData = ref({
  displayName: '',
  avatar: '',
  description: '',
  systemPrompt: '',
  mcpIds: [] as number[],
  isPublic: true,
});

// 监听 forge 变化，填充表单（编辑模式）
watch(
  () => props.forge,
  (forge) => {
    if (forge && props.mode === 'edit') {
      formData.value = {
        displayName: forge.displayName,
        avatar: forge.avatar || '',
        description: forge.description || '',
        systemPrompt: forge.systemPrompt || '',
        mcpIds: [], // TODO: 从 forge 中获取关联的 MCP
        isPublic: forge.isPublic,
      };
    }
  },
  { immediate: true }
);

// 头像完整 URL（处理相对路径）
const avatarUrl = computed(() => {
  if (!formData.value.avatar) return '';
  // 如果是相对路径，拼接 API 基础路径
  if (formData.value.avatar.startsWith('/')) {
    const apiBase = import.meta.env.VITE_API_BASE || '';
    // 移除 /api 前缀
    const baseUrl = apiBase.replace(/\/api$/, '');
    return `${baseUrl}${formData.value.avatar}`;
  }
  return formData.value.avatar;
});

// MCP 选项（Mock 数据，后续从 MCP 模块获取）
const mcpOptions = [
  { label: '文件系统 MCP', value: 1 },
  { label: '数据库 MCP', value: 2 },
  { label: 'API 调用 MCP', value: 3 },
  { label: '代码执行 MCP', value: 4 },
];

// 表单验证规则
const rules: FormRules = {
  displayName: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { max: 100, message: '最多 100 个字符', trigger: 'blur' },
  ],
  description: [{ max: 10000, message: '最多 10000 个字符', trigger: 'blur' }],
  systemPrompt: [{ max: 10000, message: '最多 10000 个字符', trigger: 'blur' }],
};

// 是否为编辑模式
const isEditMode = props.mode === 'edit';

// 自定义上传请求
const customUpload = async ({ file, onFinish, onError }: UploadCustomRequestOptions) => {
  if (!file.file) {
    onError();
    return;
  }

  avatarUploading.value = true;
  try {
    const url = await uploadAvatar(file.file);
    formData.value.avatar = url;
    message.success('头像上传成功');
    onFinish();
  } catch {
    message.error('头像上传失败');
    onError();
  } finally {
    avatarUploading.value = false;
  }
};

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();

    const data: CreateForgeParams | UpdateForgeParams = {
      displayName: formData.value.displayName,
      description: formData.value.description || undefined,
      systemPrompt: formData.value.systemPrompt || undefined,
      avatar: formData.value.avatar || undefined,
      isPublic: formData.value.isPublic,
      // TODO: mcpIds 后续实现
    };

    emit('submit', data);
  } catch {
    // 验证失败
  }
};

// 取消
const handleCancel = () => {
  emit('cancel');
};
</script>

<template>
  <NForm
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-placement="left"
    label-width="100"
    require-mark-placement="right-hanging"
  >
    <!-- 名称 -->
    <NFormItem label="名称" path="displayName">
      <NInput v-model:value="formData.displayName" placeholder="如 代码审计专家" />
    </NFormItem>

    <!-- 头像上传 -->
    <NFormItem label="头像" path="avatar">
      <NUpload
        :custom-request="customUpload"
        :show-file-list="false"
        accept="image/*"
        :disabled="avatarUploading"
      >
        <div
          class="flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors"
          :class="
            themeStore.isDark
              ? 'hover:border-primary-500 border-gray-600'
              : 'hover:border-primary-500 border-gray-300'
          "
        >
          <!-- 上传中 -->
          <div v-if="avatarUploading" class="flex flex-col items-center gap-1">
            <NSpin size="small" />
            <span class="text-theme-secondary text-xs">上传中...</span>
          </div>
          <!-- 已有头像 -->
          <NAvatar
            v-else-if="avatarUrl"
            :src="avatarUrl"
            :size="92"
            object-fit="cover"
            class="rounded-lg"
          />
          <!-- 无头像，显示上传提示 -->
          <div v-else class="flex flex-col items-center gap-1">
            <NIcon :component="CloudUploadOutline" :size="24" class="text-theme-secondary" />
            <span class="text-theme-secondary text-xs">点击上传</span>
          </div>
        </div>
      </NUpload>
      <span class="text-theme-secondary ml-4 text-sm">
        支持 JPG、PNG、GIF、WebP，最大 5MB
        <br />
        不上传则使用随机默认头像
      </span>
    </NFormItem>

    <!-- Forge 介绍（Markdown） -->
    <NFormItem label="Forge 介绍" path="description">
      <NInput
        v-model:value="formData.description"
        type="textarea"
        placeholder="支持 Markdown 格式，详细介绍这个 Forge 的功能和使用场景"
        :autosize="{ minRows: 4, maxRows: 10 }"
      />
    </NFormItem>

    <!-- 系统提示词 -->
    <NFormItem label="系统提示词" path="systemPrompt">
      <NInput
        v-model:value="formData.systemPrompt"
        type="textarea"
        placeholder="定义 Forge 的行为和能力，这将作为 AI 的系统指令"
        :autosize="{ minRows: 4, maxRows: 10 }"
      />
    </NFormItem>

    <!-- MCP 选择 -->
    <NFormItem label="MCP" path="mcpIds">
      <NSelect
        v-model:value="formData.mcpIds"
        :options="mcpOptions"
        multiple
        placeholder="选择要使用的 MCP（可多选）"
        style="width: 100%"
      />
    </NFormItem>

    <!-- 是否公开 -->
    <NFormItem label="公开" path="isPublic">
      <NSwitch v-model:value="formData.isPublic" />
      <span class="text-theme-secondary ml-2 text-sm">
        {{ formData.isPublic ? '所有人可见' : '仅自己可见' }}
      </span>
    </NFormItem>

    <!-- 操作按钮 -->
    <NFormItem :show-label="false">
      <div class="flex gap-3">
        <NButton
          type="primary"
          :loading="loading"
          :class="themeStore.isDark ? 'btn-glow' : 'btn-gradient'"
          @click="handleSubmit"
        >
          <template #icon>
            <NIcon :component="SaveOutline" />
          </template>
          {{ isEditMode ? '保存修改' : '创建 Forge' }}
        </NButton>
        <NButton @click="handleCancel">取消</NButton>
      </div>
    </NFormItem>
  </NForm>
</template>
