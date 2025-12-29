<script setup lang="ts">
/**
 * 新建 MCP 页面
 * 所有登录用户可访问
 * 管理员可选择所有传输方式，普通用户只能选择 SSE 和 StreamableHTTP
 */
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { NButton, NIcon, useMessage } from 'naive-ui';
import { ArrowBackOutline } from '@vicons/ionicons5';
import { useMCPStore, useUserStore } from '@/stores';
import MCPForm from '@/components/MCPForm.vue';
import type { CreateMCPParams } from '@/types';

const router = useRouter();
const message = useMessage();
const mcpStore = useMCPStore();
const userStore = useUserStore();

// 根据用户角色设置默认传输类型
// 管理员默认 stdio，普通用户默认 sse
const defaultTransportType = computed(() => (userStore.isAdmin ? 'stdio' : 'sse'));

// 表单数据
const formData = ref<CreateMCPParams>({
  name: '',
  transportType: defaultTransportType.value,
  command: '',
  args: '',
  env: '',
  url: '',
  headers: '',
  description: '',
  timeout: 30,
  remarks: '',
  example: '',
  isPublic: false, // 默认私有
});

// 提交加载状态
const submitLoading = ref(false);

// 返回上一页
function handleBack() {
  router.back();
}

// 构建提交数据
function buildSubmitData(): CreateMCPParams {
  const isStdio = formData.value.transportType === 'stdio';
  const submitData: CreateMCPParams = {
    name: formData.value.name.trim(),
    transportType: formData.value.transportType,
  };

  if (isStdio) {
    submitData.command = formData.value.command?.trim();
    // 将多行文本转为 JSON 数组
    if (formData.value.args?.trim()) {
      const argsArray = formData.value.args
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      submitData.args = JSON.stringify(argsArray);
    }
    if (formData.value.env?.trim()) {
      submitData.env = formData.value.env.trim();
    }
  } else {
    submitData.url = formData.value.url?.trim();
    if (formData.value.headers?.trim()) {
      submitData.headers = formData.value.headers.trim();
    }
  }

  if (formData.value.description?.trim()) {
    submitData.description = formData.value.description.trim();
  }
  if (formData.value.timeout) {
    submitData.timeout = formData.value.timeout;
  }
  if (formData.value.remarks?.trim()) {
    submitData.remarks = formData.value.remarks.trim();
  }
  if (formData.value.example?.trim()) {
    submitData.example = formData.value.example.trim();
  }

  // 公开设置
  submitData.isPublic = formData.value.isPublic ?? false;

  return submitData;
}

// 提交表单
async function handleSubmit() {
  submitLoading.value = true;
  try {
    const submitData = buildSubmitData();
    const mcp = await mcpStore.createMCP(submitData);
    // 根据连接状态显示不同提示
    if (mcp.status === 'connected') {
      message.success('创建成功，MCP 已连接');
    } else {
      message.warning('创建成功，但 MCP 连接失败');
    }
    router.push('/mcp');
  } catch {
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

    <!-- 表单组件 -->
    <MCPForm
      v-model="formData"
      mode="create"
      :loading="submitLoading"
      @submit="handleSubmit"
      @cancel="handleBack"
    />
  </div>
</template>
