<script setup lang="ts">
/**
 * Forge 表单组件
 * 科技感卡片式布局设计
 */
import { ref, watch, computed, onMounted } from 'vue';
import {
  NInput,
  NSwitch,
  NButton,
  NIcon,
  NUpload,
  NSpin,
  NAvatar,
  useMessage,
  type UploadCustomRequestOptions,
} from 'naive-ui';
import {
  SaveOutline,
  CloudUploadOutline,
  SparklesOutline,
  DocumentTextOutline,
  ConstructOutline,
  EyeOutline,
  EyeOffOutline,
} from '@vicons/ionicons5';
import { useThemeStore, useMCPStore } from '@/stores';
import { uploadAvatar } from '@/utils';
import MCPToolSelector from '@/components/MCPToolSelector.vue';
import type { ForgeDetail, CreateForgeParams, UpdateForgeParams, MCPToolSelection } from '@/types';

const props = defineProps<{
  forge?: ForgeDetail;
  mode: 'create' | 'edit';
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [data: CreateForgeParams | UpdateForgeParams];
  cancel: [];
}>();

const themeStore = useThemeStore();
const mcpStore = useMCPStore();
const message = useMessage();

// 头像上传状态
const avatarUploading = ref(false);

// 表单验证错误
const errors = ref<Record<string, string>>({});

// 加载 MCP 列表
onMounted(async () => {
  await mcpStore.fetchMCPList();
});

// 表单数据
const formData = ref({
  displayName: '',
  avatar: '',
  description: '',
  systemPrompt: '',
  mcpTools: [] as MCPToolSelection[],
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
        mcpTools: forge.mcpTools || [],
        isPublic: forge.isPublic,
      };
    }
  },
  { immediate: true }
);

// 头像完整 URL
const avatarUrl = computed(() => {
  if (!formData.value.avatar) return '';
  if (formData.value.avatar.startsWith('/')) {
    const apiBase = import.meta.env.VITE_API_BASE || '';
    const baseUrl = apiBase.replace(/\/api$/, '');
    return `${baseUrl}${formData.value.avatar}`;
  }
  return formData.value.avatar;
});

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

// 验证表单
const validate = (): boolean => {
  errors.value = {};

  if (!formData.value.displayName.trim()) {
    errors.value.displayName = '请输入名称';
  } else if (formData.value.displayName.length > 100) {
    errors.value.displayName = '最多 100 个字符';
  }

  if (formData.value.description.length > 10000) {
    errors.value.description = '最多 10000 个字符';
  }

  if (formData.value.systemPrompt.length > 10000) {
    errors.value.systemPrompt = '最多 10000 个字符';
  }

  return Object.keys(errors.value).length === 0;
};

// 提交表单
const handleSubmit = async () => {
  if (!validate()) return;

  const mcpIds = formData.value.mcpTools.map((t) => t.mcpId);

  const data: CreateForgeParams | UpdateForgeParams = {
    displayName: formData.value.displayName,
    description: formData.value.description || undefined,
    systemPrompt: formData.value.systemPrompt || undefined,
    avatar: formData.value.avatar || undefined,
    isPublic: formData.value.isPublic,
    mcpIds: mcpIds.length > 0 ? mcpIds : undefined,
    mcpTools: formData.value.mcpTools.length > 0 ? formData.value.mcpTools : undefined,
  };

  emit('submit', data);
};

// 取消
const handleCancel = () => {
  emit('cancel');
};
</script>

<template>
  <div class="forge-form space-y-6">
    <!-- 基础信息卡片 -->
    <div
      class="relative overflow-hidden rounded-xl border p-6 transition-all"
      :class="
        themeStore.isDark
          ? 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600/50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      "
      style="backdrop-filter: blur(8px)"
    >
      <!-- 卡片装饰线 -->
      <div
        class="absolute top-0 left-0 h-1 w-full"
        :class="
          themeStore.isDark
            ? 'from-primary-500 via-accent-purple bg-gradient-to-r to-transparent'
            : 'from-primary-500 to-primary-300 bg-gradient-to-r'
        "
      ></div>

      <!-- 标题行：基础信息 + 公开设置 -->
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg"
            :class="themeStore.isDark ? 'bg-primary-500/20' : 'bg-primary-50'"
          >
            <NIcon :component="SparklesOutline" :size="18" class="text-primary-500" />
          </div>
          <h3 class="text-theme font-semibold">基础信息</h3>
        </div>

        <!-- 公开设置移到右上角 -->
        <div class="flex items-center gap-2">
          <NIcon
            :component="formData.isPublic ? EyeOutline : EyeOffOutline"
            :size="16"
            :class="formData.isPublic ? 'text-emerald-500' : 'text-theme-secondary'"
          />
          <span class="text-theme-secondary text-sm">
            {{ formData.isPublic ? '公开' : '私有' }}
          </span>
          <NSwitch v-model:value="formData.isPublic" size="small" />
        </div>
      </div>

      <div class="flex items-start gap-6">
        <!-- 头像上传 -->
        <div class="h-24 w-24 shrink-0">
          <NUpload
            :custom-request="customUpload"
            :show-file-list="false"
            accept="image/*"
            :disabled="avatarUploading"
          >
            <div
              class="group relative h-24 w-24 cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all"
              :class="
                themeStore.isDark
                  ? 'hover:border-primary-500/50 border-gray-600'
                  : 'hover:border-primary-500 border-gray-300'
              "
            >
              <!-- 上传中 -->
              <div
                v-if="avatarUploading"
                class="flex h-full flex-col items-center justify-center gap-1"
              >
                <NSpin size="small" />
                <span class="text-theme-secondary text-xs">上传中...</span>
              </div>
              <!-- 已有头像 -->
              <template v-else-if="avatarUrl">
                <NAvatar :src="avatarUrl" :size="92" object-fit="cover" class="rounded-xl" />
                <div
                  class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <NIcon :component="CloudUploadOutline" :size="24" class="text-white" />
                </div>
              </template>
              <!-- 无头像 -->
              <div v-else class="flex h-full flex-col items-center justify-center gap-1">
                <NIcon :component="CloudUploadOutline" :size="24" class="text-theme-secondary" />
                <span class="text-theme-secondary text-xs">上传头像</span>
              </div>
            </div>
          </NUpload>
        </div>

        <!-- 名称输入 -->
        <div class="min-w-0 flex-1">
          <label class="text-theme-secondary mb-1.5 block text-sm">
            名称
            <span class="text-red-500">*</span>
          </label>
          <NInput
            v-model:value="formData.displayName"
            placeholder="如 代码审计专家"
            size="large"
            :status="errors.displayName ? 'error' : undefined"
          />
          <p v-if="errors.displayName" class="mt-1 text-xs text-red-500">
            {{ errors.displayName }}
          </p>
        </div>
      </div>
    </div>

    <!-- Forge 介绍卡片 -->
    <div
      class="relative overflow-hidden rounded-xl border p-6 transition-all"
      :class="
        themeStore.isDark
          ? 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600/50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      "
      style="backdrop-filter: blur(8px)"
    >
      <div
        class="absolute top-0 left-0 h-1 w-24"
        :class="
          themeStore.isDark ? 'from-accent-cyan bg-gradient-to-r to-transparent' : 'bg-accent-cyan'
        "
      ></div>

      <div class="mb-4 flex items-center gap-2">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-lg"
          :class="themeStore.isDark ? 'bg-accent-cyan/20' : 'bg-cyan-50'"
        >
          <NIcon :component="DocumentTextOutline" :size="18" class="text-accent-cyan" />
        </div>
        <h3 class="text-theme font-semibold">Forge 介绍</h3>
      </div>

      <NInput
        v-model:value="formData.description"
        type="textarea"
        placeholder="支持 Markdown 格式，详细介绍这个 Forge 的功能和使用场景"
        :autosize="false"
        :rows="6"
        class="resizable-textarea"
        :status="errors.description ? 'error' : undefined"
      />
      <p v-if="errors.description" class="mt-1 text-xs text-red-500">{{ errors.description }}</p>
      <p class="text-theme-muted mt-2 text-xs">支持 Markdown 格式</p>
    </div>

    <!-- 系统提示词卡片 -->
    <div
      class="relative overflow-hidden rounded-xl border p-6 transition-all"
      :class="
        themeStore.isDark
          ? 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600/50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      "
      style="backdrop-filter: blur(8px)"
    >
      <div
        class="absolute top-0 left-0 h-1 w-24"
        :class="
          themeStore.isDark
            ? 'from-accent-purple bg-gradient-to-r to-transparent'
            : 'bg-accent-purple'
        "
      ></div>

      <div class="mb-4 flex items-center gap-2">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-lg"
          :class="themeStore.isDark ? 'bg-accent-purple/20' : 'bg-purple-50'"
        >
          <NIcon :component="SparklesOutline" :size="18" class="text-accent-purple" />
        </div>
        <h3 class="text-theme font-semibold">系统提示词</h3>
      </div>

      <NInput
        v-model:value="formData.systemPrompt"
        type="textarea"
        placeholder="定义 Forge 的行为和能力，这将作为 AI 的系统指令"
        :autosize="false"
        :rows="6"
        class="resizable-textarea"
        :status="errors.systemPrompt ? 'error' : undefined"
      />
      <p v-if="errors.systemPrompt" class="mt-1 text-xs text-red-500">
        {{ errors.systemPrompt }}
      </p>
      <p class="text-theme-muted mt-2 text-xs">定义 AI 的角色和行为规范</p>
    </div>

    <!-- MCP 工具卡片 -->
    <div
      class="relative overflow-hidden rounded-xl border p-6 transition-all"
      :class="
        themeStore.isDark
          ? 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600/50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      "
      style="backdrop-filter: blur(8px)"
    >
      <div
        class="absolute top-0 left-0 h-1 w-24"
        :class="
          themeStore.isDark ? 'bg-gradient-to-r from-emerald-500 to-transparent' : 'bg-emerald-500'
        "
      ></div>

      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg"
            :class="themeStore.isDark ? 'bg-emerald-500/20' : 'bg-emerald-50'"
          >
            <NIcon :component="ConstructOutline" :size="18" class="text-emerald-500" />
          </div>
          <h3 class="text-theme font-semibold">MCP 工具</h3>
        </div>
        <span class="text-theme-muted text-xs">
          已选择 {{ formData.mcpTools.reduce((sum, m) => sum + m.tools.length, 0) }} 个工具
        </span>
      </div>

      <MCPToolSelector v-model="formData.mcpTools" />
      <p class="text-theme-muted mt-3 text-xs">
        选择 Forge 可以使用的 MCP 工具，赋予 AI 更强大的能力
      </p>
    </div>

    <!-- 操作按钮 -->
    <div class="flex items-center justify-end gap-3 pt-2">
      <NButton size="large" @click="handleCancel">取消</NButton>
      <NButton
        type="primary"
        size="large"
        :loading="loading"
        :class="themeStore.isDark ? 'btn-glow' : 'btn-gradient'"
        @click="handleSubmit"
      >
        <template #icon>
          <NIcon :component="SaveOutline" />
        </template>
        {{ isEditMode ? '保存修改' : '创建 Forge' }}
      </NButton>
    </div>
  </div>
</template>

<style scoped>
/* 让 textarea 可以手动拖拽调整高度 */
.resizable-textarea :deep(textarea) {
  resize: vertical;
  min-height: 120px;
}
</style>
