<script setup lang="ts">
/**
 * 编辑 MCP 页面
 * 仅管理员可访问
 */
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NInput, NIcon, NSelect, NInputNumber, NCard, NSpin, useMessage } from 'naive-ui';
import { ArrowBackOutline } from '@vicons/ionicons5';
import { useThemeStore, useUserStore, useMCPStore } from '@/stores';
import type { UpdateMCPParams } from '@/types';

const route = useRoute();
const router = useRouter();
const message = useMessage();
const themeStore = useThemeStore();
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

// 传输方式选项
const transportOptions = [
  { value: 'stdio', label: 'Stdio（本地命令）' },
  { value: 'sse', label: 'SSE（Server-Sent Events）' },
  { value: 'streamableHttp', label: 'StreamableHTTP' },
];

// 是否为 stdio 类型
const isStdio = computed(() => formData.value.transportType === 'stdio');

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
    // 填充表单
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
    // args 不需要验证，每行一个参数
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
    const submitData: UpdateMCPParams = {
      name: formData.value.name?.trim(),
      transportType: formData.value.transportType,
    };
    // stdio 类型
    if (isStdio.value) {
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
      // sse/http 类型
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

      <!-- 表单 -->
      <NCard class="max-w-2xl">
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
                placeholder="@modelcontextprotocol/server-filesystem&#10;C:/Users/path"
                :rows="3"
              />
              <p class="text-theme-muted mt-1 text-xs">每行一个参数</p>
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
              保存
            </NButton>
          </div>
        </div>
      </NCard>
    </template>
  </div>
</template>
