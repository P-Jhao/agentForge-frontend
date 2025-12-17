<script setup lang="ts">
/**
 * Forge 表单组件
 * 用于创建和编辑 Forge
 */
import { ref, watch } from 'vue';
import {
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSwitch,
  NButton,
  NIcon,
  type FormInst,
  type FormRules,
} from 'naive-ui';
import { SaveOutline } from '@vicons/ionicons5';
import { useThemeStore } from '@/stores';
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

// 表单引用
const formRef = ref<FormInst | null>(null);

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
  avatar: [{ max: 255, message: '最多 255 个字符', trigger: 'blur' }],
};

// 是否为编辑模式
const isEditMode = props.mode === 'edit';

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

    <!-- 头像 -->
    <NFormItem label="头像" path="avatar">
      <NInput v-model:value="formData.avatar" placeholder="输入 emoji 或图片 URL" />
      <template #feedback>
        <span v-if="formData.avatar" class="ml-2 text-2xl">
          {{ formData.avatar }}
        </span>
      </template>
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
