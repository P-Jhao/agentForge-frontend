<script setup lang="ts">
/**
 * 新建 MCP 页面
 * 仅管理员可访问
 */
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { NButton, NInput, NIcon, NSelect, NInputNumber, NCard, useMessage } from 'naive-ui';
import { ArrowBackOutline } from '@vicons/ionicons5';
import { useThemeStore, useUserStore, useMCPStore } from '@/stores';
import type { CreateMCPParams } from '@/types';

const router = useRouter();
const message = useMessage();
const themeStore = useThemeStore();
const userStore = useUserStore();
const mcpStore = useMCPStore();

// 权限检查：非管理员跳转到 MCP 列表页
onMounted(() => {
  if (!userStore.isAdmin) {
    message.warning('无权限访问此页面');
    router.replace('/mcp');
  }
});

// 表单数据
const formData = ref<CreateMCPParams>({
  name: '',
  transportType: 'sse',
  connectionUrl: '',
  description: '',
  timeout: 30,
  headers: '',
  remarks: '',
  example: '',
});

// 提交加载状态
const submitLoading = ref(false);

// 传输方式选项
const transportOptions = [
  { value: 'stdio', label: 'Stdio（本地命令）' },
  { value: 'sse', label: 'SSE（Server-Sent Events）' },
  { value: 'streamableHttp', label: 'StreamableHTTP' },
];

// 返回上一页
function handleBack() {
  router.back();
}

// 验证表单
function validateForm(): boolean {
  if (!formData.value.name.trim()) {
    message.warning('请输入 MCP 名称');
    return false;
  }
  if (formData.value.name.length > 100) {
    message.warning('名称长度不能超过 100 字符');
    return false;
  }
  if (!formData.value.connectionUrl.trim()) {
    message.warning('请输入连接地址');
    return false;
  }
  if (formData.value.timeout && formData.value.timeout <= 0) {
    message.warning('超时时间必须为正整数');
    return false;
  }
  if (formData.value.headers) {
    try {
      JSON.parse(formData.value.headers);
    } catch {
      message.warning('请求头必须为有效的 JSON 格式');
      return false;
    }
  }
  return true;
}

// 提交表单
async function handleSubmit() {
  if (!validateForm()) return;

  submitLoading.value = true;
  try {
    // 构建提交数据，过滤空值
    const submitData: CreateMCPParams = {
      name: formData.value.name.trim(),
      transportType: formData.value.transportType,
      connectionUrl: formData.value.connectionUrl.trim(),
    };
    if (formData.value.description?.trim()) {
      submitData.description = formData.value.description.trim();
    }
    if (formData.value.timeout) {
      submitData.timeout = formData.value.timeout;
    }
    if (formData.value.headers?.trim()) {
      submitData.headers = formData.value.headers.trim();
    }
    if (formData.value.remarks?.trim()) {
      submitData.remarks = formData.value.remarks.trim();
    }
    if (formData.value.example?.trim()) {
      submitData.example = formData.value.example.trim();
    }

    await mcpStore.createMCP(submitData);
    message.success('创建成功');
    router.push('/mcp');
  } catch (error) {
    message.error('创建失败');
  } finally {
    submitLoading.value = false;
  }
}
</script>

<template>
  <div class="mcp-create">
    <!-- 返回按钮 + 标题 -->
    <div class="mb-6 flex items-center gap-4">
      <NButton quaternary circle @click="handleBack">
        <template #icon>
          <NIcon :component="ArrowBackOutline" />
        </template>
      </NButton>
      <h1 class="text-theme text-2xl font-bold">新建 MCP</h1>
    </div>

    <!-- 表单 -->
    <NCard>
      <div class="space-y-6">
        <!-- MCP 名称（必选） -->
        <div>
          <label class="text-theme mb-2 block text-sm font-medium">
            MCP 名称
            <span class="text-red-500">*</span>
          </label>
          <NInput
            v-model:value="formData.name"
            placeholder="请输入 MCP 名称"
            maxlength="100"
            show-count
          />
        </div>

        <!-- 传输方式（必选） -->
        <div>
          <label class="text-theme mb-2 block text-sm font-medium">
            传输方式
            <span class="text-red-500">*</span>
          </label>
          <NSelect
            v-model:value="formData.transportType"
            :options="transportOptions"
            placeholder="请选择传输方式"
          />
        </div>

        <!-- 连接地址（必选） -->
        <div>
          <label class="text-theme mb-2 block text-sm font-medium">
            连接地址
            <span class="text-red-500">*</span>
          </label>
          <NInput
            v-model:value="formData.connectionUrl"
            placeholder="请输入连接地址（URL 或本地命令）"
          />
          <p class="text-theme-muted mt-1 text-xs">
            SSE/HTTP: http://localhost:3000/sse | Stdio: npx mcp-server
          </p>
        </div>

        <!-- 描述（可选） -->
        <div>
          <label class="text-theme mb-2 block text-sm font-medium">描述</label>
          <NInput
            v-model:value="formData.description"
            type="textarea"
            placeholder="请输入 MCP 描述"
            :rows="3"
          />
        </div>

        <!-- 超时时间（可选） -->
        <div>
          <label class="text-theme mb-2 block text-sm font-medium">超时时间（秒）</label>
          <NInputNumber
            v-model:value="formData.timeout"
            :min="1"
            :max="300"
            placeholder="默认 30 秒"
            style="width: 200px"
          />
        </div>

        <!-- 请求头（可选） -->
        <div>
          <label class="text-theme mb-2 block text-sm font-medium">请求头（JSON 格式）</label>
          <NInput
            v-model:value="formData.headers"
            type="textarea"
            placeholder="{&quot;Authorization&quot;: &quot;Bearer xxx&quot;}"
            :rows="3"
          />
        </div>

        <!-- MCP 示例（可选） -->
        <div>
          <label class="text-theme mb-2 block text-sm font-medium">使用说明</label>
          <NInput
            v-model:value="formData.example"
            type="textarea"
            placeholder="请输入 MCP 使用示例或说明"
            :rows="4"
          />
        </div>

        <!-- 备注（可选） -->
        <div>
          <label class="text-theme mb-2 block text-sm font-medium">备注</label>
          <NInput
            v-model:value="formData.remarks"
            type="textarea"
            placeholder="请输入备注信息"
            :rows="2"
          />
        </div>

        <!-- 操作按钮 -->
        <div class="flex justify-end gap-3 pt-4">
          <NButton @click="handleBack">取消</NButton>
          <NButton
            type="primary"
            :class="themeStore.isDark ? 'btn-glow' : 'btn-gradient'"
            :loading="submitLoading"
            @click="handleSubmit"
          >
            创建
          </NButton>
        </div>
      </div>
    </NCard>
  </div>
</template>
