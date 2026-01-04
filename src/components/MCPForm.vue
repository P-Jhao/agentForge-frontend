<script setup lang="ts">
/**
 * MCP 表单组件
 * 用于新建和编辑 MCP，复用表单逻辑
 * 管理员可选择所有传输方式，普通用户只能选择 SSE 和 StreamableHTTP
 */
import { computed } from 'vue';
import { NButton, NInput, NSelect, NInputNumber, NCard, NSwitch, useMessage } from 'naive-ui';
import { useThemeStore, useUserStore } from '@/stores';
import type { CreateMCPParams, UpdateMCPParams } from '@/types';

// Props 定义
interface Props {
  // 表单数据（v-model）
  modelValue: CreateMCPParams | UpdateMCPParams;
  // 模式：create 或 edit
  mode: 'create' | 'edit';
  // 提交加载状态
  loading?: boolean;
}

// Emits 定义
interface Emits {
  (e: 'update:modelValue', value: CreateMCPParams | UpdateMCPParams): void;
  (e: 'submit'): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<Emits>();

const message = useMessage();
const themeStore = useThemeStore();
const userStore = useUserStore();

// 表单数据（双向绑定）
const formData = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

// 所有传输方式选项
const allTransportOptions = [
  { value: 'stdio', label: 'Stdio（本地命令）' },
  { value: 'sse', label: 'SSE（Server-Sent Events）' },
  { value: 'streamableHttp', label: 'StreamableHTTP' },
];

// 根据用户角色过滤传输方式选项
// 管理员可选择所有方式，普通用户只能选择 SSE 和 StreamableHTTP
const transportOptions = computed(() => {
  if (userStore.isAdmin) {
    return allTransportOptions;
  }
  // 普通用户过滤掉 stdio 选项
  return allTransportOptions.filter((opt) => opt.value !== 'stdio');
});

// 是否为普通用户（需要审核才能公开）
const isRegularUser = computed(() => {
  const role = userStore.userInfo?.role;
  return role === 'user' || role === 'premium';
});

// 是否为 stdio 类型
const isStdio = computed(() => formData.value.transportType === 'stdio');

// 提交按钮文字
const submitText = computed(() => (props.mode === 'create' ? '创建' : '保存'));

// 更新表单字段
function updateField<K extends keyof (CreateMCPParams | UpdateMCPParams)>(
  key: K,
  value: (CreateMCPParams | UpdateMCPParams)[K]
) {
  emit('update:modelValue', { ...formData.value, [key]: value });
}

// 验证表单
function validateForm(): boolean {
  if (!formData.value.name?.trim()) {
    message.warning('请输入 MCP 名称');
    return false;
  }
  if (formData.value.name.length > 100) {
    message.warning('名称长度不能超过 100 字符');
    return false;
  }
  // stdio 类型验证
  if (isStdio.value) {
    if (!formData.value.command?.trim()) {
      message.warning('请输入启动命令');
      return false;
    }
    // 验证 env 是否为有效 JSON 对象
    if (formData.value.env?.trim()) {
      try {
        const parsed = JSON.parse(formData.value.env);
        if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
          message.warning('环境变量必须为 JSON 对象格式');
          return false;
        }
      } catch {
        message.warning('环境变量必须为有效的 JSON 对象格式');
        return false;
      }
    }
  } else {
    // sse/http 类型验证
    if (!formData.value.url?.trim()) {
      message.warning('请输入连接地址');
      return false;
    }
    // 验证 headers 是否为有效 JSON 对象
    if (formData.value.headers?.trim()) {
      try {
        const parsed = JSON.parse(formData.value.headers);
        if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
          message.warning('请求头必须为 JSON 对象格式');
          return false;
        }
      } catch {
        message.warning('请求头必须为有效的 JSON 对象格式');
        return false;
      }
    }
  }
  if (formData.value.timeout && formData.value.timeout <= 0) {
    message.warning('超时时间必须为正整数');
    return false;
  }
  return true;
}

// 处理提交
function handleSubmit() {
  if (!validateForm()) return;
  emit('submit');
}

// 处理取消
function handleCancel() {
  emit('cancel');
}

// 暴露验证方法给父组件
defineExpose({ validateForm });
</script>

<template>
  <NCard>
    <div class="space-y-6">
      <!-- MCP 名称（必选） -->
      <div>
        <label class="text-theme mb-2 block text-sm font-medium">
          MCP 名称
          <span class="text-red-500">*</span>
        </label>
        <NInput
          :value="formData.name"
          placeholder="请输入 MCP 名称"
          maxlength="100"
          show-count
          @update:value="updateField('name', $event)"
        />
      </div>

      <!-- 传输方式（必选） -->
      <div>
        <label class="text-theme mb-2 block text-sm font-medium">
          传输方式
          <span class="text-red-500">*</span>
        </label>
        <NSelect
          :value="formData.transportType"
          :options="transportOptions"
          placeholder="请选择传输方式"
          @update:value="updateField('transportType', $event)"
        />
      </div>

      <!-- stdio 类型：命令 + 参数 + 环境变量 -->
      <template v-if="isStdio">
        <div>
          <label class="text-theme mb-2 block text-sm font-medium">
            启动命令
            <span class="text-red-500">*</span>
          </label>
          <NInput
            :value="formData.command"
            placeholder="如: npx, node, python"
            @update:value="updateField('command', $event)"
          />
          <p class="text-theme-muted mt-1 text-xs">可执行文件或命令名称</p>
        </div>
        <div>
          <label class="text-theme mb-2 block text-sm font-medium">命令参数</label>
          <NInput
            :value="formData.args"
            type="textarea"
            placeholder="@modelcontextprotocol/server-filesystem&#10;C:/Users/path"
            :rows="3"
            @update:value="updateField('args', $event)"
          />
          <p class="text-theme-muted mt-1 text-xs">每行一个参数</p>
        </div>
        <div>
          <label class="text-theme mb-2 block text-sm font-medium">环境变量</label>
          <NInput
            :value="formData.env"
            type="textarea"
            :placeholder="`{&quot;API_KEY&quot;: &quot;xxx&quot;}`"
            :rows="3"
            @update:value="updateField('env', $event)"
          />
          <p class="text-theme-muted mt-1 text-xs">JSON 对象格式，如: {"KEY": "value"}</p>
        </div>
      </template>

      <!-- sse/http 类型：URL + 请求头 -->
      <template v-else>
        <div>
          <label class="text-theme mb-2 block text-sm font-medium">
            连接地址
            <span class="text-red-500">*</span>
          </label>
          <NInput
            :value="formData.url"
            placeholder="http://localhost:3000/sse"
            @update:value="updateField('url', $event)"
          />
          <p class="text-theme-muted mt-1 text-xs">SSE 或 HTTP 端点地址</p>
        </div>
        <div>
          <label class="text-theme mb-2 block text-sm font-medium">请求头</label>
          <NInput
            :value="formData.headers"
            type="textarea"
            :placeholder="`{&quot;Authorization&quot;: &quot;Bearer xxx&quot;}`"
            :rows="3"
            @update:value="updateField('headers', $event)"
          />
          <p class="text-theme-muted mt-1 text-xs">JSON 对象格式</p>
        </div>
      </template>

      <!-- 描述（可选） -->
      <div>
        <label class="text-theme mb-2 block text-sm font-medium">描述</label>
        <NInput
          :value="formData.description"
          type="textarea"
          placeholder="请输入 MCP 描述"
          :rows="3"
          @update:value="updateField('description', $event)"
        />
      </div>

      <!-- 超时时间（可选） -->
      <div>
        <label class="text-theme mb-2 block text-sm font-medium">超时时间（秒）</label>
        <NInputNumber
          :value="formData.timeout"
          :min="1"
          :max="300"
          placeholder="默认 30 秒"
          style="width: 200px"
          @update:value="updateField('timeout', $event ?? undefined)"
        />
      </div>

      <!-- MCP 示例（可选） -->
      <div>
        <label class="text-theme mb-2 block text-sm font-medium">使用说明</label>
        <NInput
          :value="formData.example"
          type="textarea"
          placeholder="请输入 MCP 使用示例或说明"
          :rows="4"
          @update:value="updateField('example', $event)"
        />
      </div>

      <!-- 备注（可选） -->
      <div>
        <label class="text-theme mb-2 block text-sm font-medium">备注</label>
        <NInput
          :value="formData.remarks"
          type="textarea"
          placeholder="请输入备注信息"
          :rows="2"
          @update:value="updateField('remarks', $event)"
        />
      </div>

      <!-- 公开设置 -->
      <!-- 管理员：显示开关可直接设置公开 -->
      <div v-if="!isRegularUser" class="flex items-center justify-between">
        <div>
          <label class="text-theme block text-sm font-medium">公开 MCP</label>
          <p class="text-theme-muted text-xs">公开后其他用户可以看到并使用此 MCP</p>
        </div>
        <NSwitch :value="formData.isPublic" @update:value="updateField('isPublic', $event)" />
      </div>
      <!-- 普通用户：显示提示信息，公开需要在详情页申请 -->
      <div v-else class="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
        <p class="text-theme text-sm">
          <span class="font-medium">💡 关于公开 MCP</span>
        </p>
        <p class="text-theme-muted mt-1 text-xs">
          如需公开此 MCP，请在创建/保存后前往详情页点击「申请公开」，审核通过后将自动公开。
        </p>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-end gap-3 pt-4">
        <NButton @click="handleCancel">取消</NButton>
        <NButton
          type="primary"
          :class="themeStore.isDark ? 'btn-glow' : 'btn-gradient'"
          :loading="loading"
          @click="handleSubmit"
        >
          {{ submitText }}
        </NButton>
      </div>
    </div>
  </NCard>
</template>
