<script setup lang="ts">
/**
 * 推荐示例表单弹窗
 * 用于设置推荐示例的封面图、标题、描述、一键做同款内容及选项
 */
import { ref, watch } from 'vue';
import { NModal, NForm, NFormItem, NInput, NButton, NUpload, NTooltip, useMessage } from 'naive-ui';
import type { UploadFileInfo } from 'naive-ui';
import { setFeatured } from '@/utils';
import type { Task } from '@/types';
import type { EnhanceMode } from '@/utils/enhanceMode';
import EnhanceModeSelector from './EnhanceModeSelector.vue';
import SmartRoutingToggle from './SmartRoutingToggle.vue';

const props = defineProps<{
  show: boolean;
  task: Task;
}>();

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'success'): void;
}>();

const message = useMessage();
const loading = ref(false);

// 封面图文件大小限制（10MB，与后端一致）
const COVER_MAX_SIZE = 10 * 1024 * 1024;

// 表单数据
const formData = ref({
  coverImage: '',
  title: '',
  description: '',
  clonePrompt: '',
  // 一键做同款选项
  enableThinking: false,
  enhanceMode: 'off' as EnhanceMode,
  smartRoutingEnabled: false,
});

// 上传文件列表
const fileList = ref<UploadFileInfo[]>([]);

// 监听弹窗打开，初始化表单
watch(
  () => props.show,
  (val) => {
    if (val) {
      formData.value = {
        coverImage: '',
        title: props.task.title,
        description: '',
        clonePrompt: '',
        enableThinking: false,
        enhanceMode: 'off',
        smartRoutingEnabled: false,
      };
      fileList.value = [];
    }
  }
);

// 关闭弹窗
function handleClose() {
  emit('update:show', false);
}

// 上传前检查文件大小
function beforeUpload(data: { file: UploadFileInfo }) {
  const file = data.file.file;
  if (file && file.size > COVER_MAX_SIZE) {
    message.error('封面图文件大小不能超过 10MB');
    return false;
  }
  return true;
}

// 图片上传成功
function handleUploadFinish({
  file,
  event,
}: {
  file: UploadFileInfo;
  event?: globalThis.ProgressEvent;
}) {
  const response = (event?.target as globalThis.XMLHttpRequest)?.response;
  if (response) {
    try {
      const res = typeof response === 'string' ? JSON.parse(response) : response;
      if (res.code === 200 && res.data?.filePath) {
        formData.value.coverImage = res.data.filePath;
        file.url = res.data.url;
        file.status = 'finished';
      } else {
        // 响应格式不符合预期，但图片可能已上传成功
        console.warn('上传响应格式异常:', res);
        file.status = 'error';
      }
    } catch (e) {
      console.error('解析上传响应失败:', e, response);
      file.status = 'error';
    }
  }
  return file;
}

// 移除图片
function handleRemove() {
  formData.value.coverImage = '';
  return true;
}

// 提交表单
async function handleSubmit() {
  // 验证必填项
  if (!formData.value.coverImage) {
    message.warning('请上传封面图');
    return;
  }
  if (!formData.value.clonePrompt.trim()) {
    message.warning('请填写一键做同款内容');
    return;
  }

  loading.value = true;
  try {
    await setFeatured({
      taskUuid: props.task.uuid,
      coverImage: formData.value.coverImage,
      title: formData.value.title.trim() || undefined,
      description: formData.value.description.trim() || undefined,
      clonePrompt: formData.value.clonePrompt.trim(),
      enableThinking: formData.value.enableThinking,
      enhanceMode: formData.value.enhanceMode,
      smartRoutingEnabled: formData.value.smartRoutingEnabled,
    });
    message.success('设置推荐示例成功');
    emit('success');
    handleClose();
  } catch {
    message.error('设置推荐示例失败');
  } finally {
    loading.value = false;
  }
}

// 获取上传地址
const uploadUrl = `${import.meta.env.VITE_API_BASE || ''}/upload/image`;

// 获取 token
function getToken() {
  return localStorage.getItem('forgeToken') || '';
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    title="设置推荐示例"
    style="width: 500px"
    :mask-closable="false"
    @update:show="emit('update:show', $event)"
  >
    <NForm label-placement="top">
      <!-- 封面图 -->
      <NFormItem label="封面图" required>
        <NUpload
          :action="uploadUrl"
          :max="1"
          list-type="image-card"
          :default-file-list="fileList"
          accept="image/*"
          :headers="{ Authorization: `Bearer ${getToken()}` }"
          @before-upload="beforeUpload"
          @finish="handleUploadFinish"
          @remove="handleRemove"
        />
      </NFormItem>

      <!-- 标题 -->
      <NFormItem label="标题">
        <NInput
          v-model:value="formData.title"
          placeholder="默认使用任务标题"
          :maxlength="100"
          show-count
        />
      </NFormItem>

      <!-- 描述 -->
      <NFormItem label="描述">
        <NInput
          v-model:value="formData.description"
          type="textarea"
          placeholder="选填，简要描述这个示例"
          :maxlength="200"
          show-count
          :rows="2"
        />
      </NFormItem>

      <!-- 一键做同款内容 -->
      <NFormItem label="一键做同款内容" required>
        <NInput
          v-model:value="formData.clonePrompt"
          type="textarea"
          placeholder="用户点击一键做同款后，会将此内容填入输入框"
          :maxlength="2000"
          show-count
          :rows="4"
        />
      </NFormItem>

      <!-- 一键做同款选项 -->
      <NFormItem label="一键做同款选项">
        <div class="flex flex-wrap items-center gap-2">
          <!-- 智能路由 -->
          <SmartRoutingToggle v-model="formData.smartRoutingEnabled" />

          <!-- 深度思考 -->
          <NTooltip>
            <template #trigger>
              <button
                type="button"
                class="flex cursor-pointer items-center gap-1.5 border-none whitespace-nowrap outline-none"
                :class="formData.enableThinking ? 'toggle-btn-active-blue' : 'toggle-btn-inactive'"
                @click="formData.enableThinking = !formData.enableThinking"
              >
                <iconpark-icon name="smart-optimization" size="16" />
                <span>深度思考</span>
              </button>
            </template>
            {{ formData.enableThinking ? '已启用深度思考' : '点击启用深度思考' }}
          </NTooltip>

          <!-- 提示词增强 -->
          <EnhanceModeSelector v-model="formData.enhanceMode" />
        </div>
      </NFormItem>
    </NForm>

    <template #footer>
      <div class="flex justify-end gap-3">
        <NButton @click="handleClose">取消</NButton>
        <NButton type="primary" :loading="loading" @click="handleSubmit">确定</NButton>
      </div>
    </template>
  </NModal>
</template>
