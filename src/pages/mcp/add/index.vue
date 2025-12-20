<script setup lang="ts">
/**
 * 新建 MCP 页面
 * 支持 SSE 云端、SSE 客户端、Stdio 本地三种模式
 * 使用 CSS 类自动适配深浅主题
 */
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { NButton, NInput, NIcon, NRadioGroup, NRadio, NCard } from 'naive-ui';
import { ArrowBackOutline } from '@vicons/ionicons5';

const router = useRouter();

// 表单数据
const formData = ref({
  name: '',
  description: '',
  type: 'sse-cloud' as 'sse-cloud' | 'sse-client' | 'stdio',
  endpoint: '',
});

// MCP 类型选项
const mcpTypes = [
  { value: 'sse-cloud', label: 'SSE 云端', desc: '连接云端 MCP 服务' },
  { value: 'sse-client', label: 'SSE 客户端', desc: '连接本地 SSE 服务' },
  { value: 'stdio', label: 'Stdio 本地', desc: '通过标准输入输出通信' },
];

// 返回上一页
function handleBack() {
  router.back();
}

// 提交表单
function handleSubmit() {
  // TODO: 调用 API 创建 MCP
  console.log('创建 MCP:', formData.value);
  router.push('/mcp');
}
</script>

<template>
  <div class="mcp-add">
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
    <NCard class="max-w-2xl">
      <div class="space-y-6">
        <!-- MCP 名称 -->
        <div>
          <label class="text-theme mb-2 block text-sm font-medium">MCP 名称</label>
          <NInput v-model:value="formData.name" placeholder="请输入 MCP 名称" />
        </div>

        <!-- MCP 描述 -->
        <div>
          <label class="text-theme mb-2 block text-sm font-medium">描述</label>
          <NInput
            v-model:value="formData.description"
            type="textarea"
            placeholder="请输入 MCP 描述"
            :rows="3"
          />
        </div>

        <!-- MCP 类型 -->
        <div>
          <label class="text-theme mb-2 block text-sm font-medium">连接类型</label>
          <NRadioGroup v-model:value="formData.type" class="flex flex-col gap-3">
            <div
              v-for="type in mcpTypes"
              :key="type.value"
              class="flex items-start gap-3 rounded-lg border p-3 transition-colors"
              :class="
                formData.type === type.value
                  ? 'border-primary-500 bg-primary-500/5'
                  : 'border-gray-200 dark:border-white/10'
              "
            >
              <NRadio :value="type.value" />
              <div>
                <div class="text-theme text-sm font-medium">{{ type.label }}</div>
                <div class="text-theme-muted text-xs">{{ type.desc }}</div>
              </div>
            </div>
          </NRadioGroup>
        </div>

        <!-- 端点地址 -->
        <div v-if="formData.type !== 'stdio'">
          <label class="text-theme mb-2 block text-sm font-medium">端点地址</label>
          <NInput v-model:value="formData.endpoint" placeholder="请输入 MCP 服务端点地址" />
        </div>

        <!-- 操作按钮 -->
        <div class="flex justify-end gap-3 pt-4">
          <NButton @click="handleBack">取消</NButton>
          <NButton type="primary" class="btn-theme" @click="handleSubmit">创建</NButton>
        </div>
      </div>
    </NCard>
  </div>
</template>
