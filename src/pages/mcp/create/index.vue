<script setup lang="ts">
/**
 * 新建 MCP 页面
 * 仅管理员可访问
 */
import { ref, computed, onMounted } from 'vue';
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

// 传输方式选项
const transportOptions = [
  { value: 'stdio', label: 'Stdio（本地命令）' },
  { value: 'sse', label: 'SSE（Server-Sent Events）' },
  { value: 'streamableHttp', label: 'StreamableHTTP' },
];

// 是否为 stdio 类型
const isStdio = computed(() => formData.value.transportType === 'stdio');

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
  // stdio 类型验证
  if (isStdio.value) {
    if (!formData.value.command?.trim()) {
      message.warning('请输入启动命令');
      return false;
    }
    // 验证 args 是否为有效 JSON 数组
    if (formData.value.args?.trim()) {
      try {
        const parsed = JSON.parse(formData.value.args);
        if (!Array.isArray(parsed)) {
          message.warning('命令参数必须为 JSON 数组格式');
          return false;
        }
      } catch {
        message.warning('命令参数必须为有效的 JSON 数组格式');
        return false;
      }
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

// 提交表单
async function handleSubmit() {
  if (!validateForm()) return;

  submitLoading.value = true;
  try {
    // 构建提交数据
    const submitData: CreateMCPParams = {
      name: formData.value.name.trim(),
      transportType: formData.value.transportType,
    };
    // stdio 类型
    if (isStdio.value) {
      submitData.command = formData.value.command?.trim();
      if (formData.value.args?.trim()) {
        submitData.args = formData.value.args.trim();
      }
      if (formData.value.env?.trim()) {
        submitData.env = formData.value.env.trim();
      }
    } else {
      // sse/http 类型
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

    await mcpStore.createMCP(submitData);
    message.success('创建成功');
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

        <!-- stdio 类型：命令 + 参数 + 环境变量 -->
        <template v-if="isStdio">
          <div>
            <label class="text-theme mb-2 block text-sm font-medium">
              启动命令
              <span class="text-red-500">*</span>
            </label>
            <NInput v-model:value="formData.command" placeholder="如: npx, node, python" />
            <p class="text-theme-muted mt-1 text-xs">可执行文件或命令名称</p>
          </div>
          <div>
            <label class="text-theme mb-2 block text-sm font-medium">命令参数</label>
            <NInput
              v-model:value="formData.args"
              type="textarea"
              placeholder="[&quot;@modelcontextprotocol/server-filesystem&quot;, &quot;C:/path&quot;]"
              :rows="2"
            />
            <p class="text-theme-muted mt-1 text-xs">JSON 数组格式，如: ["arg1", "arg2"]</p>
          </div>
          <div>
            <label class="text-theme mb-2 block text-sm font-medium">环境变量</label>
            <NInput
              v-model:value="formData.env"
              type="textarea"
              placeholder="{&quot;API_KEY&quot;: &quot;xxx&quot;}"
              :rows="3"
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
            <NInput v-model:value="formData.url" placeholder="http://localhost:3000/sse" />
            <p class="text-theme-muted mt-1 text-xs">SSE 或 HTTP 端点地址</p>
          </div>
          <div>
            <label class="text-theme mb-2 block text-sm font-medium">请求头</label>
            <NInput
              v-model:value="formData.headers"
              type="textarea"
              placeholder="{&quot;Authorization&quot;: &quot;Bearer xxx&quot;}"
              :rows="3"
            />
            <p class="text-theme-muted mt-1 text-xs">JSON 对象格式</p>
          </div>
        </template>

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
