<script setup lang="ts">
/**
 * 后台管理 - 成员管理页面
 */
import { ref, computed, onMounted, h } from 'vue';
import {
  NDataTable,
  NInput,
  NSelect,
  NButton,
  NIcon,
  NPopconfirm,
  NTag,
  NModal,
  NForm,
  NFormItem,
  NAvatar,
  NTooltip,
  useMessage,
  type DataTableColumns,
} from 'naive-ui';
import { SearchOutline, RefreshOutline } from '@vicons/ionicons5';
import {
  getAdminMemberList,
  updateAdminMember,
  resetAdminMemberPassword,
  deleteAdminMember,
  restoreAdminMember,
  type AdminMemberItem,
  type AdminMemberListParams,
} from '@/utils/adminApi';
import { rsaEncrypt } from '@/utils/crypto';

const message = useMessage();

// 加载状态
const loading = ref(false);

// 成员列表
const members = ref<AdminMemberItem[]>([]);

// 分页信息
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
});

// 搜索关键词
const keyword = ref('');

// 角色筛选
const roleFilter = ref<'all' | 'user' | 'premium' | 'root' | 'operator'>('all');
const roleOptions = [
  { label: '全部角色', value: 'all' },
  { label: '普通用户', value: 'user' },
  { label: '高级用户', value: 'premium' },
  { label: '超级管理员', value: 'root' },
  { label: '平台运营员', value: 'operator' },
];

// 状态筛选
const statusFilter = ref<'all' | 'active' | 'deleted'>('all');
const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '正常', value: 'active' },
  { label: '已删除', value: 'deleted' },
];

// 编辑弹窗
const showEditModal = ref(false);
const editingMember = ref<AdminMemberItem | null>(null);
const editForm = ref({
  username: '',
  email: '',
  role: 'user' as 'user' | 'premium' | 'root' | 'operator',
  adminNote: '',
});

// 重置密码弹窗
const showResetPasswordModal = ref(false);
const resetPasswordMember = ref<AdminMemberItem | null>(null);
const resetPasswordForm = ref({
  password: '',
  confirmPassword: '',
});

// 获取角色标签配置
const getRoleTag = (role: string) => {
  switch (role) {
    case 'operator':
      return { type: 'error' as const, text: '平台运营员' };
    case 'root':
      return { type: 'warning' as const, text: '超级管理员' };
    case 'premium':
      return { type: 'info' as const, text: '高级用户' };
    default:
      return { type: 'default' as const, text: '普通用户' };
  }
};

// 格式化日期时间
function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 判断是否可以删除/编辑角色
function canModifyRole(member: AdminMemberItem): boolean {
  return member.role !== 'operator' && member.role !== 'root';
}

// 表格列定义
const columns = computed<DataTableColumns<AdminMemberItem>>(() => [
  {
    title: '用户信息',
    key: 'userInfo',
    width: 160,
    render: (row) => {
      const displayName = row.nickname || row.username;
      return h('div', { style: 'display: flex; align-items: center; gap: 10px; min-width: 0;' }, [
        row.avatar
          ? h(NAvatar, { src: row.avatar, size: 36, round: true, style: 'flex-shrink: 0;' })
          : h(
            NAvatar,
            {
              size: 36,
              round: true,
              class: 'from-primary-500 to-accent-purple bg-linear-to-br',
              style: 'flex-shrink: 0;',
            },
            () => displayName.charAt(0).toUpperCase()
          ),
        h('div', { style: 'min-width: 0; flex: 1;' }, [
          h(
            NTooltip,
            { trigger: 'hover' },
            {
              trigger: () =>
                h(
                  'div',
                  {
                    class: 'font-medium text-theme',
                    style:
                      'overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 90px;',
                  },
                  displayName
                ),
              default: () => displayName,
            }
          ),
          h(
            'div',
            {
              class: 'text-xs text-gray-400',
              style: 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap;',
            },
            `@${row.username}`
          ),
        ]),
      ]);
    },
  },
  {
    title: '权限',
    key: 'role',
    width: 90,
    render: (row) => {
      const { type, text } = getRoleTag(row.role);
      return h(NTag, { type, size: 'small' }, () => text);
    },
  },
  {
    title: '联系方式',
    key: 'email',
    width: 140,
    ellipsis: { tooltip: true },
    render: (row) => row.email || '-',
  },
  {
    title: '任务/Token',
    key: 'stats',
    width: 110,
    render: (row) =>
      h('div', {}, [
        h('div', {}, `${row.taskCount} 个任务`),
        h('div', { class: 'text-xs text-gray-400' }, `${row.totalTokens.toLocaleString()} tokens`),
      ]),
  },
  {
    title: '时间信息',
    key: 'timeInfo',
    width: 145,
    render: (row) =>
      h('div', {}, [
        h('div', { class: 'text-xs' }, `创建: ${formatDateTime(row.createdAt)}`),
        h('div', { class: 'text-xs text-gray-400' }, `登录: ${formatDateTime(row.lastLoginAt)}`),
      ]),
  },
  {
    title: '备注',
    key: 'adminNote',
    width: 100,
    ellipsis: { tooltip: true },
    render: (row) => row.adminNote || '-',
  },
  {
    title: '状态',
    key: 'status',
    width: 70,
    render: (row) =>
      row.isDeleted
        ? h(NTag, { type: 'error', size: 'small' }, () => '已删除')
        : h(NTag, { type: 'success', size: 'small' }, () => '正常'),
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    render: (row) => {
      const buttons = [
        h(NButton, { text: true, type: 'primary', onClick: () => handleEdit(row) }, () => '编辑'),
      ];

      // 只有非管理员可以重置密码
      if (canModifyRole(row)) {
        buttons.push(
          h(
            NButton,
            { text: true, type: 'primary', onClick: () => handleResetPassword(row) },
            () => '重置密码'
          )
        );

        // 删除/恢复按钮
        if (row.isDeleted) {
          buttons.push(
            h(
              NPopconfirm,
              { onPositiveClick: () => handleRestore(row) },
              {
                trigger: () => h(NButton, { text: true, type: 'primary' }, () => '恢复'),
                default: () => '确定要恢复这个用户吗？',
              }
            )
          );
        } else {
          buttons.push(
            h(
              NPopconfirm,
              { onPositiveClick: () => handleDelete(row) },
              {
                trigger: () => h(NButton, { text: true, type: 'primary' }, () => '删除'),
                default: () => '确定要删除这个用户吗？',
              }
            )
          );
        }
      }

      return h('div', { style: 'display: flex; gap: 12px;' }, buttons);
    },
  },
]);

// 获取成员列表
async function fetchMembers() {
  loading.value = true;
  try {
    const params: AdminMemberListParams = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
    };

    if (keyword.value) {
      params.keyword = keyword.value;
    }
    if (roleFilter.value !== 'all') {
      params.role = roleFilter.value;
    }
    if (statusFilter.value !== 'all') {
      params.status = statusFilter.value;
    }

    const res = await getAdminMemberList(params);
    members.value = res.members;
    pagination.value.total = res.pagination.total;
  } catch (error) {
    const err = error as { message?: string };
    message.error(err.message || '获取成员列表失败');
  } finally {
    loading.value = false;
  }
}

// 处理分页变化
function handlePageChange(page: number) {
  pagination.value.page = page;
  fetchMembers();
}

// 处理每页数量变化
function handlePageSizeChange(pageSize: number) {
  pagination.value.pageSize = pageSize;
  pagination.value.page = 1;
  fetchMembers();
}

// 搜索
function handleSearch() {
  pagination.value.page = 1;
  fetchMembers();
}

// 重置筛选
function handleReset() {
  keyword.value = '';
  roleFilter.value = 'all';
  statusFilter.value = 'all';
  pagination.value.page = 1;
  fetchMembers();
}

// 编辑成员
function handleEdit(member: AdminMemberItem) {
  editingMember.value = member;
  editForm.value = {
    username: member.username,
    email: member.email || '',
    role: member.role,
    adminNote: member.adminNote || '',
  };
  showEditModal.value = true;
}

// 提交编辑
async function handleEditSubmit() {
  if (!editingMember.value) return;

  try {
    await updateAdminMember(editingMember.value.id, {
      username: editForm.value.username,
      email: editForm.value.email || null,
      role: editForm.value.role,
      adminNote: editForm.value.adminNote || null,
    });
    message.success('更新成功');
    showEditModal.value = false;
    fetchMembers();
  } catch (error) {
    const err = error as { message?: string };
    message.error(err.message || '更新失败');
  }
}

// 重置密码
function handleResetPassword(member: AdminMemberItem) {
  resetPasswordMember.value = member;
  resetPasswordForm.value = { password: '', confirmPassword: '' };
  showResetPasswordModal.value = true;
}

// 提交重置密码
async function handleResetPasswordSubmit() {
  if (!resetPasswordMember.value) return;

  if (!resetPasswordForm.value.password) {
    message.error('请输入新密码');
    return;
  }
  if (resetPasswordForm.value.password !== resetPasswordForm.value.confirmPassword) {
    message.error('两次输入的密码不一致');
    return;
  }
  if (resetPasswordForm.value.password.length < 6 || resetPasswordForm.value.password.length > 32) {
    message.error('密码长度需在 6-32 字符之间');
    return;
  }

  try {
    const encryptedPassword = await rsaEncrypt(resetPasswordForm.value.password);
    await resetAdminMemberPassword(resetPasswordMember.value.id, encryptedPassword);
    message.success('密码重置成功');
    showResetPasswordModal.value = false;
  } catch (error) {
    const err = error as { message?: string };
    message.error(err.message || '密码重置失败');
  }
}

// 删除成员
async function handleDelete(member: AdminMemberItem) {
  try {
    await deleteAdminMember(member.id);
    message.success('删除成功');
    fetchMembers();
  } catch (error) {
    const err = error as { message?: string };
    message.error(err.message || '删除失败');
  }
}

// 恢复成员
async function handleRestore(member: AdminMemberItem) {
  try {
    await restoreAdminMember(member.id);
    message.success('恢复成功');
    fetchMembers();
  } catch (error) {
    const err = error as { message?: string };
    message.error(err.message || '恢复失败');
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchMembers();
});
</script>

<template>
  <div>
    <!-- 页面标题 -->
    <h1 class="text-theme mb-3 text-xl font-bold">成员管理</h1>

    <!-- 筛选栏 -->
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <NInput
        v-model:value="keyword"
        placeholder="搜索用户名、昵称..."
        style="width: 200px"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <NIcon :component="SearchOutline" />
        </template>
      </NInput>

      <NSelect v-model:value="roleFilter" :options="roleOptions" style="width: 140px" />

      <NSelect v-model:value="statusFilter" :options="statusOptions" style="width: 120px" />

      <NButton type="primary" @click="handleSearch">
        <template #icon>
          <NIcon :component="SearchOutline" />
        </template>
        搜索
      </NButton>

      <NButton @click="handleReset">
        <template #icon>
          <NIcon :component="RefreshOutline" />
        </template>
        重置
      </NButton>
    </div>

    <!-- 成员表格 -->
    <NDataTable
      :columns="columns"
      :data="members"
      :loading="loading"
      :pagination="{
        page: pagination.page,
        pageSize: pagination.pageSize,
        pageCount: Math.ceil(pagination.total / pagination.pageSize),
        showSizePicker: pagination.showSizePicker,
        pageSizes: pagination.pageSizes,
        onUpdatePage: handlePageChange,
        onUpdatePageSize: handlePageSizeChange,
      }"
      :scroll-x="995"
      remote
    />

    <!-- 编辑弹窗 -->
    <NModal
      v-model:show="showEditModal"
      preset="dialog"
      title="编辑成员"
      positive-text="保存"
      negative-text="取消"
      style="width: 500px"
      @positive-click="handleEditSubmit"
    >
      <NForm ref="editFormRef" :model="editForm" label-placement="left" label-width="80px">
        <NFormItem label="用户名" path="username">
          <NInput v-model:value="editForm.username" placeholder="请输入用户名" />
        </NFormItem>
        <NFormItem label="邮箱" path="email">
          <NInput v-model:value="editForm.email" placeholder="请输入邮箱" />
        </NFormItem>
        <NFormItem label="权限" path="role">
          <NSelect
            v-model:value="editForm.role"
            :options="[
              { label: '普通用户', value: 'user' },
              { label: '高级用户', value: 'premium' },
            ]"
            :disabled="!!(editingMember && !canModifyRole(editingMember))"
          />
        </NFormItem>
        <NFormItem label="备注" path="adminNote">
          <NInput
            v-model:value="editForm.adminNote"
            type="textarea"
            placeholder="请输入备注（仅运营员可见）"
            :rows="3"
          />
        </NFormItem>
      </NForm>
    </NModal>

    <!-- 重置密码弹窗 -->
    <NModal
      v-model:show="showResetPasswordModal"
      preset="dialog"
      title="重置密码"
      positive-text="确定"
      negative-text="取消"
      style="width: 400px"
      @positive-click="handleResetPasswordSubmit"
    >
      <NForm
        ref="resetPasswordFormRef"
        :model="resetPasswordForm"
        label-placement="left"
        label-width="100px"
      >
        <NFormItem label="新密码" path="password">
          <NInput
            v-model:value="resetPasswordForm.password"
            type="password"
            show-password-on="click"
            placeholder="请输入新密码（6-32位）"
          />
        </NFormItem>
        <NFormItem label="确认密码" path="confirmPassword">
          <NInput
            v-model:value="resetPasswordForm.confirmPassword"
            type="password"
            show-password-on="click"
            placeholder="请再次输入新密码"
          />
        </NFormItem>
      </NForm>
    </NModal>
  </div>
</template>
