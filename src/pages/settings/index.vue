<script setup lang="ts">
/**
 * 系统设置页面
 * 包含大模型配置（系统内置 / 自定义）
 * API Key 使用 RSA 加密传输
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
import { http, encryptApiKey } from '@/utils';

const message = useMessage();

// 模型配置模式
type ModelConfigMode = 'builtin' | 'custom';

// 模型配置类型（前端使用）
interface ModelConfig {
  mode: ModelConfigMode;
  baseUrl?: string;
  apiKey?: string; // 显示用（脱敏后的）
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

// 新输入的 API Key（用于区分是否修改了 apiKey）
const newApiKey = ref('');
// 标记 apiKey 是否被修改
const apiKeyChanged = ref(false);

// API Key 显示/隐藏
const showApiKey = ref(false);

// 是否有未保存的更改
const hasChanges = ref(false);

// 原始配置（用于检测更改）
let originalConfig: ModelConfig | null = null;

// 计算是否可以保存（自定义模式下必填字段验证）
const canSave = computed(() => {
  if (config.value.mode === 'builtin') return true;
  // 自定义模式：baseUrl 和 model 必填，apiKey 必须有值（原有或新输入）
  const hasApiKey = apiKeyChanged.value ? !!newApiKey.value.trim() : !!config.value.apiKey;
  return config.value.baseUrl?.trim() && hasApiKey && config.value.model?.trim();
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
        apiKey: res.data.apiKey || '', // 脱敏后的值
        model: res.data.model || '',
        maxTokens: res.data.maxTokens,
        temperature: res.data.temperature,
      };
      originalConfig = { ...config.value };
      // 重置 apiKey 修改状态
      newApiKey.value = '';
      apiKeyChanged.value = false;
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
    apiKeyChanged.value || // apiKey 被修改
    c.model !== o.model ||
    c.maxTokens !== o.maxTokens ||
    c.temperature !== o.temperature;
}

// 处理 apiKey 输入变化
function handleApiKeyInput(value: string) {
  newApiKey.value = value;
  apiKeyChanged.value = true;
  checkChanges();
}

// 保存设置
async function handleSave() {
  if (!canSave.value) {
    message.warning('请填写必填字段');
    return;
  }

  saving.value = true;
  try {
    // 构建请求体
    const requestBody: Record<string, unknown> = {
      mode: config.value.mode,
      baseUrl: config.value.baseUrl,
      model: config.value.model,
      maxTokens: config.value.maxTokens,
      temperature: config.value.temperature,
    };

    // 如果是自定义模式且 apiKey 被修改，加密后发送
    if (config.value.mode === 'custom' && apiKeyChanged.value && newApiKey.value) {
      try {
        requestBody.encryptedApiKey = await encryptApiKey(newApiKey.value);
      } catch (error) {
        message.error((error as Error).message);
        saving.value = false;
        return;
      }
    } else if (config.value.mode === 'custom' && !apiKeyChanged.value && config.value.apiKey) {
      // apiKey 未修改，不发送（后端保留原值）
      // 但如果是首次设置，需要发送
      // 这里通过检查原始值是否为空来判断
      if (!originalConfig?.apiKey) {
        message.warning('请输入 API Key');
        saving.value = false;
        return;
      }
    }

    const res = await http.put('/user/model-config', requestBody);
    if (res.code === 200) {
      // 更新原始配置
      originalConfig = { ...config.value };
      if (apiKeyChanged.value && newApiKey.value) {
        // 更新显示的脱敏值
        const key = newApiKey.value;
        config.value.apiKey = key.length > 8 ? key.slice(0, 4) + '****' + key.slice(-4) : '****';
        originalConfig.apiKey = config.value.apiKey;
      }
      hasChanges.value = false;
      apiKeyChanged.value = false;
      newApiKey.value = '';
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
    apiKeyChanged.value = false;
    newApiKey.value = '';
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
                :value="apiKeyChanged ? newApiKey : config.apiKey"
                :type="showApiKey ? 'text' : 'password'"
                :placeholder="config.apiKey ? '已配置，输入新值可更新' : '您的 API Key'"
                @update:value="handleApiKeyInput"
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
              自定义模型需要兼容 OpenAI API 格式。API Key 将加密传输和存储。
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
