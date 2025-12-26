<script setup lang="ts">
/**
 * 系统设置页面
 * 包含大模型配置（系统内置 / 自定义）
 */
import { ref, computed, onMounted } from 'vue';
import {
  NCard,
  NRadioGroup,
  NRadio,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NButton,
  NAlert,
  NIcon,
  NTooltip,
  NSpin,
  useMessage,
} from 'naive-ui';
import { InformationCircleOutline, EyeOutline, EyeOffOutline } from '@vicons/ionicons5';
import { http } from '@/utils';

const message = useMessage();

// 模型配置模式
type ModelConfigMode = 'builtin' | 'custom';

// 模型配置类型
interface ModelConfig {
  mode: ModelConfigMode;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// 加载状态
const loading = ref(false);
const saving = ref(false);

// 模型配置
const config = ref<ModelConfig>({
  mode: 'builtin',
  baseUrl: '',
  apiKey: '',
  model: '',
  maxTokens: undefined,
  temperature: undefined,
});

// API Key 显示/隐藏
const showApiKey = ref(false);

// 是否有未保存的更改
const hasChanges = ref(false);

// 原始配置（用于检测更改）
let originalConfig: ModelConfig | null = null;

// 计算是否可以保存（自定义模式下必填字段验证）
const canSave = computed(() => {
  if (config.value.mode === 'builtin') return true;
  return config.value.baseUrl?.trim() && config.value.apiKey?.trim() && config.value.model?.trim();
});

// 加载用户设置
async function loadSettings() {
  loading.value = true;
  try {
    const res = await http.get<ModelConfig>('/user/model-config');
    if (res.code === 200 && res.data) {
      config.value = {
        mode: res.data.mode || 'builtin',
        baseUrl: res.data.baseUrl || '',
        apiKey: res.data.apiKey || '',
        model: res.data.model || '',
        maxTokens: res.data.maxTokens,
        temperature: res.data.temperature,
      };
      originalConfig = { ...config.value };
    }
  } catch (error) {
    console.error('加载设置失败:', error);
    message.error('加载设置失败');
  } finally {
    loading.value = false;
    hasChanges.value = false;
  }
}

// 检测更改
function checkChanges() {
  if (!originalConfig) {
    hasChanges.value = true;
    return;
  }
  const c = config.value;
  const o = originalConfig;
  hasChanges.value =
    c.mode !== o.mode ||
    c.baseUrl !== o.baseUrl ||
    c.apiKey !== o.apiKey ||
    c.model !== o.model ||
    c.maxTokens !== o.maxTokens ||
    c.temperature !== o.temperature;
}

// 保存设置
async function handleSave() {
  if (!canSave.value) {
    message.warning('请填写必填字段');
    return;
  }

  saving.value = true;
  try {
    const res = await http.put('/user/model-config', config.value);
    if (res.code === 200) {
      originalConfig = { ...config.value };
      hasChanges.value = false;
      message.success('设置已保存');
    } else {
      message.error(res.message || '保存失败');
    }
  } catch (error) {
    console.error('保存设置失败:', error);
    message.error('保存失败');
  } finally {
    saving.value = false;
  }
}

// 重置为默认
function handleReset() {
  if (originalConfig) {
    config.value = { ...originalConfig };
    hasChanges.value = false;
    message.info('已恢复到上次保存的设置');
  }
}

onMounted(() => {
  loadSettings();
});
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <h1 class="text-theme mb-6 text-2xl font-bold">⚙️ 系统设置</h1>

    <NSpin :show="loading">
      <!-- 大模型配置 -->
      <NCard title="大模型配置" class="card-theme">
        <template #header-extra>
          <NTooltip>
            <template #trigger>
              <NIcon :component="InformationCircleOutline" class="text-theme-secondary" />
            </template>
            选择使用系统内置的大模型，或配置您自己的大模型
          </NTooltip>
        </template>

        <!-- 模式选择 -->
        <NRadioGroup v-model:value="config.mode" class="mb-4" @update:value="checkChanges">
          <NRadio value="builtin">系统内置</NRadio>
          <NRadio value="custom">自定义</NRadio>
        </NRadioGroup>

        <!-- 系统内置说明 -->
        <NAlert v-if="config.mode === 'builtin'" type="info" class="mb-4">
          使用系统预配置的大模型（千问 / DeepSeek），无需额外配置。
        </NAlert>

        <!-- 自定义配置表单 -->
        <template v-if="config.mode === 'custom'">
          <NForm label-placement="left" label-width="100">
            <!-- API 地址 -->
            <NFormItem label="API 地址" required>
              <NInput
                v-model:value="config.baseUrl"
                placeholder="例如：https://api.openai.com/v1"
                @update:value="checkChanges"
              />
            </NFormItem>

            <!-- API Key -->
            <NFormItem label="API Key" required>
              <NInput
                v-model:value="config.apiKey"
                :type="showApiKey ? 'text' : 'password'"
                placeholder="您的 API Key"
                @update:value="checkChanges"
              >
                <template #suffix>
                  <NIcon
                    :component="showApiKey ? EyeOffOutline : EyeOutline"
                    class="cursor-pointer"
                    @click="showApiKey = !showApiKey"
                  />
                </template>
              </NInput>
            </NFormItem>

            <!-- 模型名称 -->
            <NFormItem label="模型名称" required>
              <NInput
                v-model:value="config.model"
                placeholder="例如：gpt-4o、claude-3-sonnet"
                @update:value="checkChanges"
              />
            </NFormItem>

            <!-- 最大 Token -->
            <NFormItem label="最大 Token">
              <NInputNumber
                v-model:value="config.maxTokens"
                :min="1"
                :max="128000"
                placeholder="可选，默认使用模型默认值"
                class="w-full"
                @update:value="checkChanges"
              />
            </NFormItem>

            <!-- 温度 -->
            <NFormItem label="温度">
              <NInputNumber
                v-model:value="config.temperature"
                :min="0"
                :max="2"
                :step="0.1"
                placeholder="可选，默认 0.7"
                class="w-full"
                @update:value="checkChanges"
              />
            </NFormItem>
          </NForm>

          <NAlert type="info" class="mt-2">
            <div class="text-xs opacity-80">
              自定义模型需要兼容 OpenAI API 格式（大多数国产模型如千问、DeepSeek、智谱等都支持）。
            </div>
          </NAlert>
        </template>

        <!-- 操作按钮 -->
        <div class="mt-6 flex gap-3">
          <NButton
            type="primary"
            :disabled="!canSave || !hasChanges"
            :loading="saving"
            @click="handleSave"
          >
            保存设置
          </NButton>
          <NButton :disabled="!hasChanges" @click="handleReset">重置</NButton>
        </div>
      </NCard>
    </NSpin>
  </div>
</template>
