<script setup lang="ts">
/**
 * 后台管理 - 推荐示例管理页面
 */
import { ref, computed, onMounted, h } from 'vue';
import {
  NDataTable,
  NButton,
  NIcon,
  NPopconfirm,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NImage,
  NTooltip,
  NUpload,
  useMessage,
  type DataTableColumns,
  type UploadFileInfo,
} from 'naive-ui';
import { RefreshOutline, CreateOutline } from '@vicons/ionicons5';
import {
  getAdminFeaturedList,
  updateAdminFeatured,
  removeAdminFeatured,
  type AdminFeaturedItem,
  type UpdateFeaturedParams,
} from '@/utils/adminApi';
import type { EnhanceMode } from '@/utils/enhanceMode';
import EnhanceModeSelector from '@/components/EnhanceModeSelector.vue';
import SmartRoutingToggle from '@/components/SmartRoutingToggle.vue';

const message = useMessage();

// 加载状态
const loading = ref(false);

// 推荐示例列表
const featuredList = ref<AdminFeaturedItem[]>([]);

// 编辑弹窗
const showEditModal = ref(false);
const editLoading = ref(false);
const editingItem = ref<AdminFeaturedItem | null>(null);

// 封面图文件大小限制（10MB）
const COVER_MAX_SIZE = 10 * 1024 * 1024;

// 上传文件列表
const fileList = ref<UploadFileInfo[]>([]);

// 表单数据
const editForm = ref({
  coverImage: '',
  title: '',
  description: '',
  clonePrompt: '',
  enableThinking: false,
  enhanceMode: 'off' as EnhanceMode,
  smartRoutingEnabled: false,
  sortOrder: 0,
});

// 增强模式选项（用于表格显示）
const enhanceModeOptions = [
  { label: '关闭', value: 'off' },
  { label: '快速增强', value: 'quick' },
  { label: '智能增强', value: 'smart' },
  { label: '多模型增强', value: 'multi' },
];

// 获取图片完整路径
function getImageUrl(path: string | null): string {
  if (!path) return '';
  // 如果已经是完整 URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // 否则添加 /api 前缀
  return `/api${path}`;
}

// 表格列定义
const columns = computed<DataTableColumns<AdminFeaturedItem>>(() => [
  {
    title: '封面',
    key: 'coverImage',
    width: 80,
    render: (row) => {
      if (!row.coverImage) return '-';
      return h(NImage, {
        src: getImageUrl(row.coverImage),
        width: 60,
        height: 40,
        objectFit: 'cover',
        style: 'border-radius: 4px;',
        previewDisabled: false,
        fallbackSrc: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
      });
    },
  },
  {
    title: '标题',
    key: 'title',
    ellipsis: { tooltip: true },
    width: 180,
  },
  {
    title: '关联任务',
    key: 'task',
    width: 160,
    render: (row) => {
      if (!row.task) return h('span', { style: 'color: #999;' }, '任务已删除');
      const title = row.task.title;
      const displayTitle = title.length > 10 ? title.slice(0, 10) + '...' : title;
      return h(
        NTooltip,
        { trigger: 'hover' },
        {
          trigger: () =>
            h(
              NButton,
              {
                text: true,
                type: 'primary',
                onClick: () => handleViewTask(row.taskUuid),
              },
              () => displayTitle
            ),
          default: () => title,
        }
      );
    },
  },
  {
    title: 'Forge',
    key: 'agent',
    width: 140,
    render: (row) => {
      if (!row.task?.agent) return '-';
      const agent = row.task.agent;
      const imgNode = agent.avatar
        ? h('img', {
          src: agent.avatar,
          alt: agent.displayName,
          style:
            'width: 20px; height: 20px; border-radius: 4px; object-fit: cover; flex-shrink: 0;',
        })
        : null;
      const textNode = h(
        'span',
        { style: 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap;' },
        agent.displayName
      );
      return h(
        NTooltip,
        { trigger: 'hover' },
        {
          trigger: () =>
            h(
              NButton,
              {
                text: true,
                type: 'primary',
                onClick: () => handleViewForge(agent.id),
                style: 'max-width: 130px; overflow: hidden;',
              },
              () =>
                h(
                  'span',
                  {
                    style:
                      'display: flex; align-items: center; gap: 6px; max-width: 100%; overflow: hidden;',
                  },
                  [imgNode, textNode]
                )
            ),
          default: () => agent.displayName,
        }
      );
    },
  },
  {
    title: '排序权重',
    key: 'sortOrder',
    width: 100,
  },
  {
    title: '深度思考',
    key: 'enableThinking',
    width: 90,
    render: (row) => (row.enableThinking ? '开启' : '关闭'),
  },
  {
    title: '增强模式',
    key: 'enhanceMode',
    width: 100,
    render: (row) => {
      const option = enhanceModeOptions.find((o) => o.value === row.enhanceMode);
      return option?.label || row.enhanceMode;
    },
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 160,
    render: (row) => formatDateTime(row.createdAt),
  },
  {
    title: '操作',
    key: 'actions',
    width: 140,
    fixed: 'right',
    render: (row) =>
      h('div', { style: 'display: flex; gap: 12px;' }, [
        h(
          NButton,
          {
            text: true,
            type: 'primary',
            onClick: () => handleEdit(row),
          },
          {
            icon: () => h(NIcon, { component: CreateOutline }),
            default: () => '编辑',
          }
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => handleRemove(row),
          },
          {
            trigger: () =>
              h(
                NButton,
                {
                  text: true,
                  type: 'error',
                },
                () => '取消推荐'
              ),
            default: () => '确定要取消该任务的推荐吗？',
          }
        ),
      ]),
  },
]);

// 格式化日期时间
function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 获取推荐示例列表
async function fetchFeaturedList() {
  loading.value = true;
  try {
    const res = await getAdminFeaturedList();
    featuredList.value = res.list;
  } catch (error) {
    const err = error as { message?: string };
    message.error(err.message || '获取推荐示例列表失败');
  } finally {
    loading.value = false;
  }
}

// 刷新列表
function handleRefresh() {
  fetchFeaturedList();
}

// 查看任务
function handleViewTask(taskUuid: string) {
  window.open(`/task/${taskUuid}`, '_blank');
}

// 查看 Forge
function handleViewForge(forgeId: number) {
  window.open(`/forge/${forgeId}`, '_blank');
}

// 编辑推荐示例
function handleEdit(item: AdminFeaturedItem) {
  editingItem.value = item;
  editForm.value = {
    coverImage: item.coverImage || '',
    title: item.title || '',
    description: item.description || '',
    clonePrompt: item.clonePrompt || '',
    enableThinking: item.enableThinking,
    enhanceMode: item.enhanceMode as EnhanceMode,
    smartRoutingEnabled: item.smartRoutingEnabled,
    sortOrder: item.sortOrder,
  };
  // 初始化文件列表（如果有封面图）
  if (item.coverImage) {
    fileList.value = [
      {
        id: 'existing',
        name: 'cover',
        status: 'finished',
        url: getImageUrl(item.coverImage),
      },
    ];
  } else {
    fileList.value = [];
  }
  showEditModal.value = true;
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
        editForm.value.coverImage = res.data.filePath;
        file.url = res.data.url;
        file.status = 'finished';
      } else {
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
function handleRemoveImage() {
  editForm.value.coverImage = '';
  return true;
}

// 获取上传地址
const uploadUrl = `${import.meta.env.VITE_API_BASE || ''}/upload/image`;

// 获取 token
function getToken() {
  return localStorage.getItem('forgeToken') || '';
}

// 保存编辑
async function handleSaveEdit() {
  if (!editingItem.value) return;

  // 验证必填项
  if (!editForm.value.coverImage) {
    message.warning('请上传封面图');
    return;
  }
  if (!editForm.value.clonePrompt.trim()) {
    message.warning('请填写一键做同款内容');
    return;
  }

  editLoading.value = true;
  try {
    const params: UpdateFeaturedParams = {
      coverImage: editForm.value.coverImage,
      title: editForm.value.title.trim() || undefined,
      description: editForm.value.description.trim() || undefined,
      clonePrompt: editForm.value.clonePrompt.trim(),
      enableThinking: editForm.value.enableThinking,
      enhanceMode: editForm.value.enhanceMode,
      smartRoutingEnabled: editForm.value.smartRoutingEnabled,
      sortOrder: editForm.value.sortOrder,
    };
    await updateAdminFeatured(editingItem.value.taskUuid, params);
    message.success('保存成功');
    showEditModal.value = false;
    fetchFeaturedList();
  } catch (error) {
    const err = error as { message?: string };
    message.error(err.message || '保存失败');
  } finally {
    editLoading.value = false;
  }
}

// 取消推荐
async function handleRemove(item: AdminFeaturedItem) {
  try {
    await removeAdminFeatured(item.taskUuid);
    message.success('已取消推荐');
    fetchFeaturedList();
  } catch (error) {
    const err = error as { message?: string };
    message.error(err.message || '操作失败');
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchFeaturedList();
});
</script>

<template>
  <div>
    <!-- 页面标题 -->
    <h1 class="text-theme mb-3 text-xl font-bold">推荐示例管理</h1>

    <!-- 操作栏 -->
    <div class="mb-3 flex items-center gap-2">
      <NButton @click="handleRefresh">
        <template #icon>
          <NIcon :component="RefreshOutline" />
        </template>
        刷新
      </NButton>
      <span class="text-theme-secondary text-sm">共 {{ featuredList.length }} 个推荐示例</span>
    </div>

    <!-- 推荐示例表格 -->
    <NDataTable :columns="columns" :data="featuredList" :loading="loading" :scroll-x="1100" />

    <!-- 编辑弹窗 -->
    <NModal
      v-model:show="showEditModal"
      preset="card"
      title="编辑推荐示例"
      style="width: 500px"
      :mask-closable="false"
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
            @remove="handleRemoveImage"
          />
        </NFormItem>

        <!-- 标题 -->
        <NFormItem label="标题">
          <NInput
            v-model:value="editForm.title"
            placeholder="默认使用任务标题"
            :maxlength="100"
            show-count
          />
        </NFormItem>

        <!-- 描述 -->
        <NFormItem label="描述">
          <NInput
            v-model:value="editForm.description"
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
            v-model:value="editForm.clonePrompt"
            type="textarea"
            placeholder="用户点击一键做同款后，会将此内容填入输入框"
            :maxlength="2000"
            show-count
            :rows="4"
          />
        </NFormItem>

        <!-- 排序权重 -->
        <NFormItem label="排序权重">
          <NInputNumber
            v-model:value="editForm.sortOrder"
            :min="0"
            placeholder="数值越大越靠前"
            style="width: 100%"
          />
        </NFormItem>

        <!-- 一键做同款选项 -->
        <NFormItem label="一键做同款选项">
          <div class="flex flex-wrap items-center gap-2">
            <!-- 智能路由 -->
            <SmartRoutingToggle v-model="editForm.smartRoutingEnabled" />

            <!-- 深度思考 -->
            <NTooltip>
              <template #trigger>
                <button
                  type="button"
                  class="flex cursor-pointer items-center gap-1.5 border-none whitespace-nowrap outline-none"
                  :class="
                    editForm.enableThinking ? 'toggle-btn-active-blue' : 'toggle-btn-inactive'
                  "
                  @click="editForm.enableThinking = !editForm.enableThinking"
                >
                  <iconpark-icon name="smart-optimization" size="16" />
                  <span>深度思考</span>
                </button>
              </template>
              {{ editForm.enableThinking ? '已启用深度思考' : '点击启用深度思考' }}
            </NTooltip>

            <!-- 提示词增强 -->
            <EnhanceModeSelector v-model="editForm.enhanceMode" />
          </div>
        </NFormItem>
      </NForm>

      <template #footer>
        <div class="flex justify-end gap-3">
          <NButton @click="showEditModal = false">取消</NButton>
          <NButton type="primary" :loading="editLoading" @click="handleSaveEdit">保存</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
