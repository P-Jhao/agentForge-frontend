<script setup lang="ts">
/**
 * 编辑 MCP 页面
 * 仅管理员可访问
 */
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NIcon, NSpin, useMessage } from 'naive-ui';
import { ArrowBackOutline } from '@vicons/ionicons5';
import { useUserStore, useMCPStore } from '@/stores';
import MCPForm from '@/components/MCPForm.vue';
import type { UpdateMCPParams } from '@/types';

const route = useRoute();
const router = useRouter();
const message = useMessage();
const userStore = useUserStore();
const mcpStore = useMCPStore();

// MCP ID
const mcpId = computed(() => Number(route.params.id));

// 表单数据
const formData = ref<UpdateMCPParams>({
  name: '',
  transportType: 'stdio',
  command: '',
  args: '',
  env: '',
  url: '',
  headers: '',
  description: '',
  timeout: 30,
  remarks: '',
  example: '',
});

// 提交加载状态
const submitLoading = ref(false);

// 初始化
onMounted(async () => {
  // 权限检查：非管理员跳转到 MCP 详情页
  if (!userStore.isAdmin) {
    message.warning('无权限访问此页面');
    router.replace(`/mcp/${mcpId.value}`);
    return;
  }

  // 加载 MCP 详情
  try {
    const mcp = await mcpStore.fetchMCP(mcpId.value);
    // 将 JSON 数组转为多行文本显示
    let argsText = '';
    if (mcp.args) {
      try {
        const argsArray = JSON.parse(mcp.args);
        if (Array.isArray(argsArray)) {
          argsText = argsArray.join('\n');
        }
      } catch {
        argsText = mcp.args;
      }
    }
    formData.value = {
      name: mcp.name,
      transportType: mcp.transportType,
      command: mcp.command || '',
      args: argsText,
      env: mcp.env || '',
      url: mcp.url || '',
      headers: mcp.headers || '',
      description: mcp.description || '',
      timeout: mcp.timeout || 30,
      remarks: mcp.remarks || '',
      example: mcp.example || '',
    };
  } catch {
    message.error('加载 MCP 信息失败');
    router.replace('/mcp');
  }
});

// 返回上一页
function handleBack() {
  router.back();
}

// 构建提交数据
function buildSubmitData(): UpdateMCPParams {
  const isStdio = formData.value.transportType === 'stdio';
  const submitData: UpdateMCPParams = {
    name: formData.value.name?.trim(),
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
    submitData.env = formData.value.env?.trim() || undefined;
    // 清空 sse/http 字段
    submitData.url = undefined;
    submitData.headers = undefined;
  } else {
    submitData.url = formData.value.url?.trim();
    submitData.headers = formData.value.headers?.trim() || undefined;
    // 清空 stdio 字段
    submitData.command = undefined;
    submitData.args = undefined;
    submitData.env = undefined;
  }

  submitData.description = formData.value.description?.trim() || undefined;
  submitData.timeout = formData.value.timeout || undefined;
  submitData.remarks = formData.value.remarks?.trim() || undefined;
  submitData.example = formData.value.example?.trim() || undefined;

  return submitData;
}

// 提交表单
async function handleSubmit() {
  submitLoading.value = true;
  try {
    const submitData = buildSubmitData();
    const mcp = await mcpStore.updateMCP(mcpId.value, submitData);
    // 根据连接状态显示不同提示
    if (mcp.status === 'connected') {
      message.success('更新成功，MCP 已连接');
    } else {
      message.warning('更新成功，但 MCP 连接失败');
    }
    router.push(`/mcp/${mcpId.value}`);
  } catch {
    message.error('更新失败');
  } finally {
    submitLoading.value = false;
  }
}
</script>

<template>
  <div class="mcp-edit">
    <!-- 加载状态 -->
    <NSpin v-if="mcpStore.loading" class="flex justify-center py-16" />

    <template v-else>
      <!-- 返回按钮 + 标题 -->
      <div class="mb-6 flex items-center gap-4">
        <NButton quaternary circle @click="handleBack">
          <template #icon>
            <NIcon :component="ArrowBackOutline" />
          </template>
        </NButton>
        <h1 class="text-theme text-2xl font-bold">编辑 MCP</h1>
      </div>

      <!-- 表单组件 -->
      <MCPForm
        v-model="formData"
        mode="edit"
        :loading="submitLoading"
        @submit="handleSubmit"
        @cancel="handleBack"
      />
    </template>
  </div>
</template>
