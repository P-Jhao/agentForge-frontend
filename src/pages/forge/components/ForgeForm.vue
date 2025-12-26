<script setup lang="ts">
/**
 * Forge 表单组件
 * 科技感卡片式布局设计
 */
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue';
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
import { useMCPStore } from '@/stores';
import { uploadAvatar } from '@/utils';
import MCPToolSelector from '@/components/MCPToolSelector.vue';
import EMarkdown from '@/components/EMarkdown.vue';
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

const mcpStore = useMCPStore();
const message = useMessage();

// 头像上传状态
const avatarUploading = ref(false);

// 头像文件大小限制（5MB，与后端一致）
const AVATAR_MAX_SIZE = 5 * 1024 * 1024;

// 表单验证错误
const errors = ref<Record<string, string>>({});

// 表单是否准备好（用于延迟渲染 EMarkdown，避免第三方库报错）
const formReady = ref(false);

// 表单数据
const formData = ref({
  displayName: '',
  avatar: '',
  description: '',
  systemPrompt: '',
  mcpTools: [] as MCPToolSelection[],
  isPublic: true,
});

/**
 * 处理自动填充事件
 */
interface ForgeFormUpdateDetail {
  field: string;
  content: string;
}

const handleAutoFillEvent = (event: Event) => {
  const customEvent = event as globalThis.CustomEvent<ForgeFormUpdateDetail>;
  const { field, content } = customEvent.detail;
  if (field === 'description') {
    formData.value.description = content;
  } else if (field === 'systemPrompt') {
    formData.value.systemPrompt = content;
  } else if (field === 'name') {
    formData.value.displayName = content;
  }
};

// 监听自动填充事件（用于智能路由自动创建流程）
onMounted(async () => {
  await mcpStore.fetchMCPList();

  // 监听表单自动填充事件
  window.addEventListener('forge-form-update', handleAutoFillEvent);

  // 使用 nextTick 确保 DOM 准备好后再渲染 EMarkdown
  // 创建模式下立即准备好
  if (props.mode === 'create') {
    await nextTick();
    formReady.value = true;
  }
  // 编辑模式下，如果 forge 数据已经存在，也标记为准备好
  else if (props.mode === 'edit' && props.forge) {
    // 填充表单数据
    formData.value = {
      displayName: props.forge.displayName,
      avatar: props.forge.avatar || '',
      description: props.forge.description || '',
      systemPrompt: props.forge.systemPrompt || '',
      mcpTools: props.forge.mcpTools || [],
      isPublic: props.forge.isPublic,
    };
    await nextTick();
    formReady.value = true;
  }
});

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('forge-form-update', handleAutoFillEvent);
});

// 监听 forge 变化，填充表单（编辑模式）
// 注意：仅在 onMounted 之后 forge 数据变化时触发
watch(
  () => props.forge,
  async (forge) => {
    if (forge && props.mode === 'edit') {
      formData.value = {
        displayName: forge.displayName,
        avatar: forge.avatar || '',
        description: forge.description || '',
        systemPrompt: forge.systemPrompt || '',
        mcpTools: forge.mcpTools || [],
        isPublic: forge.isPublic,
      };
      // 如果还没准备好，等待 nextTick 后再标记
      if (!formReady.value) {
        await nextTick();
        formReady.value = true;
      }
    }
  }
  // 移除 immediate: true，改为在 onMounted 中处理初始数据
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

  // 检查文件大小
  if (file.file.size > AVATAR_MAX_SIZE) {
    message.error('头像文件大小不能超过 5MB');
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
      class="form-card relative overflow-hidden rounded-xl border p-6 transition-all"
      style="backdrop-filter: blur(8px)"
    >
      <!-- 卡片装饰线 -->
      <div class="decor-line-primary-full absolute top-0 left-0 h-1 w-full"></div>

      <!-- 标题行：基础信息 + 公开设置 -->
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="icon-bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
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
              class="upload-border group relative h-24 w-24 cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all"
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
      class="form-card relative overflow-hidden rounded-xl border p-6 transition-all"
      style="backdrop-filter: blur(8px)"
    >
      <div class="decor-line-cyan absolute top-0 left-0 h-1 w-24"></div>

      <div class="mb-4 flex items-center gap-2">
        <div class="icon-bg-cyan flex h-8 w-8 items-center justify-center rounded-lg">
          <NIcon :component="DocumentTextOutline" :size="18" class="text-accent-cyan" />
        </div>
        <h3 class="text-theme font-semibold">Forge 介绍</h3>
      </div>

      <EMarkdown
        v-if="formReady"
        v-model="formData.description"
        height="450px"
        placeholder="支持 Markdown 格式，详细介绍这个 Forge 的功能和使用场景"
        editor-id="forge-description-editor"
      />
      <div v-else class="flex h-[450px] items-center justify-center">
        <NSpin size="small" />
      </div>
      <p v-if="errors.description" class="mt-1 text-xs text-red-500">{{ errors.description }}</p>
    </div>

    <!-- 系统提示词卡片 -->
    <div
      class="form-card relative overflow-hidden rounded-xl border p-6 transition-all"
      style="backdrop-filter: blur(8px)"
    >
      <div class="decor-line-purple absolute top-0 left-0 h-1 w-24"></div>

      <div class="mb-4 flex items-center gap-2">
        <div class="icon-bg-purple flex h-8 w-8 items-center justify-center rounded-lg">
          <NIcon :component="SparklesOutline" :size="18" class="text-accent-purple" />
        </div>
        <h3 class="text-theme font-semibold">系统提示词</h3>
      </div>

      <EMarkdown
        v-if="formReady"
        v-model="formData.systemPrompt"
        height="450px"
        placeholder="定义 Forge 的行为和能力，这将作为 AI 的系统指令"
        editor-id="forge-system-prompt-editor"
      />
      <div v-else class="flex h-[450px] items-center justify-center">
        <NSpin size="small" />
      </div>
      <p v-if="errors.systemPrompt" class="mt-1 text-xs text-red-500">
        {{ errors.systemPrompt }}
      </p>
    </div>

    <!-- MCP 工具卡片 -->
    <div
      class="form-card relative overflow-hidden rounded-xl border p-6 transition-all"
      style="backdrop-filter: blur(8px)"
    >
      <div class="decor-line-emerald absolute top-0 left-0 h-1 w-24"></div>

      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="icon-bg-emerald flex h-8 w-8 items-center justify-center rounded-lg">
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
        class="btn-theme"
        data-auto-submit-btn
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
