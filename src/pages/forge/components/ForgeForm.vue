<script setup lang="ts">
/**
 * Forge 表单组件
 * 用于创建和编辑 Forge
 */
import { ref, computed, watch } from 'vue';
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
import type { ForgeDetail, CreateForgeParams, UpdateForgeParams, ForgeModel } from '@/types';

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
  name: '',
  displayName: '',
  description: '',
  systemPrompt: '',
  model: 'qwen' as ForgeModel,
  avatar: '',
  isPublic: true,
});

// 监听 forge 变化，填充表单（编辑模式）
watch(
  () => props.forge,
  (forge) => {
    if (forge && props.mode === 'edit') {
      formData.value = {
        name: forge.name,
        displayName: forge.displayName,
        description: forge.description || '',
        systemPrompt: forge.systemPrompt || '',
        model: forge.model,
        avatar: forge.avatar || '',
        isPublic: forge.isPublic,
      };
    }
  },
  { immediate: true }
);

// 模型选项
const modelOptions = [
  { label: '通义千问', value: 'qwen' },
  { label: 'DeepSeek', value: 'deepseek' },
];

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入标识名', trigger: 'blur' },
    {
      pattern: /^[a-z0-9-]+$/,
      message: '只能包含小写字母、数字和连字符',
      trigger: 'blur',
    },
    { max: 50, message: '最多 50 个字符', trigger: 'blur' },
  ],
  displayName: [
    { required: true, message: '请输入显示名称', trigger: 'blur' },
    { max: 100, message: '最多 100 个字符', trigger: 'blur' },
  ],
  description: [{ max: 500, message: '最多 500 个字符', trigger: 'blur' }],
  systemPrompt: [{ max: 10000, message: '最多 10000 个字符', trigger: 'blur' }],
  avatar: [{ max: 255, message: '最多 255 个字符', trigger: 'blur' }],
};

// 是否为编辑模式
const isEditMode = computed(() => props.mode === 'edit');

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();

    const data: CreateForgeParams | UpdateForgeParams = {
      name: formData.value.name,
      displayName: formData.value.displayName,
      description: formData.value.description || undefined,
      systemPrompt: formData.value.systemPrompt || undefined,
      model: formData.value.model,
      avatar: formData.value.avatar || undefined,
      isPublic: formData.value.isPublic,
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
    <!-- 标识名（创建时必填，编辑时只读） -->
    <NFormItem label="标识名" path="name">
      <NInput
        v-model:value="formData.name"
        placeholder="如 code-audit（小写字母、数字、连字符）"
        :disabled="isEditMode"
      />
    </NFormItem>

    <!-- 显示名称 -->
    <NFormItem label="显示名称" path="displayName">
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

    <!-- 描述 -->
    <NFormItem label="描述" path="description">
      <NInput
        v-model:value="formData.description"
        type="textarea"
        placeholder="简要描述这个 Forge 的功能"
        :autosize="{ minRows: 2, maxRows: 4 }"
      />
    </NFormItem>

    <!-- 系统提示词 -->
    <NFormItem label="系统提示词" path="systemPrompt">
      <NInput
        v-model:value="formData.systemPrompt"
        type="textarea"
        placeholder="定义 Forge 的行为和能力"
        :autosize="{ minRows: 4, maxRows: 10 }"
      />
    </NFormItem>

    <!-- 模型选择 -->
    <NFormItem label="模型" path="model">
      <NSelect v-model:value="formData.model" :options="modelOptions" style="width: 200px" />
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
