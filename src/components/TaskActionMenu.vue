<script setup lang="ts">
/**
 * 任务操作菜单组件
 * 提供回放、重命名、删除、推荐示例等操作
 */
import { ref, computed, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import { NDropdown, NIcon, NButton, NModal, NInput, useMessage, useDialog } from 'naive-ui';
import {
  EllipsisHorizontalOutline,
  PlayOutline,
  CreateOutline,
  TrashOutline,
  RibbonOutline,
} from '@vicons/ionicons5';
import { useTaskStore, useUserStore } from '@/stores';
import { checkFeatured, removeFeatured } from '@/utils';
import FeaturedFormModal from './FeaturedFormModal.vue';
import type { Task } from '@/types';

const props = defineProps<{
  task: Task;
}>();

const emit = defineEmits<{
  (e: 'deleted'): void;
  (e: 'renamed', newTitle: string): void;
  (e: 'featuredChanged', isFeatured: boolean): void;
}>();

const router = useRouter();
const message = useMessage();
const dialog = useDialog();
const taskStore = useTaskStore();
const userStore = useUserStore();

// 重命名弹窗状态
const showRenameModal = ref(false);
const newTitle = ref('');
const renameLoading = ref(false);

// 推荐示例状态
const isFeatured = ref(false);
const featuredLoading = ref(false);
const showFeaturedModal = ref(false);

// 是否可以重命名
const canRename = computed(() => taskStore.canRename(props.task.uuid));

// 是否为管理员
const isAdmin = computed(() => userStore.isAdmin);

// 菜单选项类型
import type { DropdownOption, DropdownDividerOption } from 'naive-ui';
type MenuOption = DropdownOption | DropdownDividerOption;

// 下拉菜单选项
const menuOptions = computed<MenuOption[]>(() => {
  const options: MenuOption[] = [
    {
      label: '回放',
      key: 'replay',
      icon: () => h(NIcon, null, { default: () => h(PlayOutline) }),
    },
    {
      label: '重命名',
      key: 'rename',
      icon: () => h(NIcon, null, { default: () => h(CreateOutline) }),
      disabled: !canRename.value,
    },
  ];

  // 管理员可见推荐示例选项
  if (isAdmin.value) {
    options.push({
      label: isFeatured.value ? '取消推荐' : '推荐示例',
      key: 'featured',
      icon: () => h(NIcon, null, { default: () => h(RibbonOutline) }),
      disabled: featuredLoading.value,
    });
  }

  options.push(
    { type: 'divider', key: 'd1' },
    {
      label: '删除',
      key: 'delete',
      icon: () => h(NIcon, null, { default: () => h(TrashOutline) }),
      props: {
        style: 'color: #ef4444',
      },
    }
  );

  return options;
});

// 处理菜单选择
function handleSelect(key: string) {
  switch (key) {
    case 'replay':
      handleReplay();
      break;
    case 'rename':
      handleOpenRename();
      break;
    case 'featured':
      handleToggleFeatured();
      break;
    case 'delete':
      handleDelete();
      break;
  }
}

// 回放
function handleReplay() {
  router.push(`/task/${props.task.uuid}/replay`);
}

// 打开重命名弹窗
function handleOpenRename() {
  newTitle.value = props.task.title;
  showRenameModal.value = true;
}

// 确认重命名
async function handleConfirmRename() {
  const trimmedTitle = newTitle.value.trim();
  if (!trimmedTitle) {
    message.warning('标题不能为空');
    return;
  }
  if (trimmedTitle === props.task.title) {
    showRenameModal.value = false;
    return;
  }

  renameLoading.value = true;
  try {
    await taskStore.updateTask(props.task.uuid, { title: trimmedTitle });
    message.success('重命名成功');
    showRenameModal.value = false;
    emit('renamed', trimmedTitle);
  } catch {
    message.error('重命名失败');
  } finally {
    renameLoading.value = false;
  }
}

// 切换推荐示例状态
async function handleToggleFeatured() {
  if (isFeatured.value) {
    // 取消推荐
    featuredLoading.value = true;
    try {
      await removeFeatured(props.task.uuid);
      isFeatured.value = false;
      message.success('已取消推荐');
      emit('featuredChanged', isFeatured.value);
    } catch {
      message.error('取消推荐失败');
    } finally {
      featuredLoading.value = false;
    }
  } else {
    // 打开推荐示例表单弹窗
    showFeaturedModal.value = true;
  }
}

// 推荐示例设置成功
function handleFeaturedSuccess() {
  isFeatured.value = true;
  emit('featuredChanged', true);
}

// 删除（带二次确认）
function handleDelete() {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除任务「${props.task.title}」吗？此操作不可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await taskStore.deleteTask(props.task.uuid);
        message.success('删除成功');
        emit('deleted');
      } catch {
        message.error('删除失败');
      }
    },
  });
}

// 检查是否为推荐示例（仅管理员需要）
async function checkFeaturedStatus() {
  if (!isAdmin.value) return;
  try {
    const res = await checkFeatured(props.task.uuid);
    isFeatured.value = res.isFeatured;
  } catch {
    // 忽略错误
  }
}

// 组件挂载时检查推荐状态
onMounted(() => {
  checkFeaturedStatus();
});
</script>

<template>
  <NDropdown
    trigger="click"
    :options="menuOptions"
    placement="right-start"
    to="body"
    @select="handleSelect"
  >
    <NButton quaternary circle size="tiny" @click.prevent.stop>
      <template #icon>
        <NIcon :component="EllipsisHorizontalOutline" :size="16" />
      </template>
    </NButton>
  </NDropdown>

  <!-- 重命名弹窗 -->
  <NModal
    v-model:show="showRenameModal"
    preset="dialog"
    title="重命名任务"
    positive-text="确认"
    negative-text="取消"
    :positive-button-props="{ loading: renameLoading }"
    @positive-click="handleConfirmRename"
    @negative-click="showRenameModal = false"
  >
    <NInput
      v-model:value="newTitle"
      placeholder="请输入新标题"
      :maxlength="50"
      show-count
      @keyup.enter="handleConfirmRename"
    />
  </NModal>

  <!-- 推荐示例表单弹窗 -->
  <FeaturedFormModal
    v-model:show="showFeaturedModal"
    :task="task"
    @success="handleFeaturedSuccess"
  />
</template>
