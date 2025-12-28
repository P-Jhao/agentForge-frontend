<script setup lang="ts">
/**
 * 个人中心页面
 * 炫酷科技感设计，支持头像上传、修改密码、邮箱设置
 */
import { ref, computed, onMounted } from 'vue';
import { NButton, NInput, NForm, NFormItem, NModal, NIcon, NSpin, useMessage } from 'naive-ui';
import {
  CameraOutline,
  LockClosedOutline,
  MailOutline,
  PersonOutline,
  ShieldCheckmarkOutline,
  CheckmarkCircle,
  EyeOutline,
  EyeOffOutline,
} from '@vicons/ionicons5';
import { useUserStore } from '@/stores/modules/user';
import { http, encryptApiKey } from '@/utils';

const message = useMessage();
const userStore = useUserStore();

// 加载状态
const loading = ref(false);

// 用户信息
const userInfo = computed(() => userStore.userInfo);

// 头像上传
const avatarInput = ref<HTMLInputElement | null>(null);
const uploadingAvatar = ref(false);

// 邮箱编辑
const editingEmail = ref(false);
const emailForm = ref({ email: '' });
const savingEmail = ref(false);

// 名称编辑
const editingNickname = ref(false);
const nicknameForm = ref({ nickname: '' });
const savingNickname = ref(false);

// 修改密码弹窗
const showPasswordModal = ref(false);
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});
const savingPassword = ref(false);
const showOldPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

// 触发头像上传
function triggerAvatarUpload() {
  avatarInput.value?.click();
}

// 处理头像上传
async function handleAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    message.error('只支持 JPG、PNG、GIF、WebP 格式');
    return;
  }

  // 验证文件大小（2MB）
  if (file.size > 2 * 1024 * 1024) {
    message.error('图片大小不能超过 2MB');
    return;
  }

  uploadingAvatar.value = true;
  try {
    const formData = new FormData();
    formData.append('avatar', file);

    const res = await http.post<{ avatar: string }>('/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // 更新本地用户信息
    userStore.updateLocalUserInfo({ avatar: res.data.avatar });
    message.success('头像更新成功');
  } catch {
    message.error('头像上传失败');
  } finally {
    uploadingAvatar.value = false;
    // 清空 input，允许重复选择同一文件
    input.value = '';
  }
}

// 开始编辑邮箱
function startEditEmail() {
  emailForm.value.email = userInfo.value?.email || '';
  editingEmail.value = true;
}

// 保存邮箱
async function saveEmail() {
  savingEmail.value = true;
  try {
    await http.put('/user/profile', { email: emailForm.value.email || null });
    userStore.updateLocalUserInfo({ email: emailForm.value.email || null });
    editingEmail.value = false;
    message.success('邮箱更新成功');
  } catch {
    message.error('邮箱更新失败');
  } finally {
    savingEmail.value = false;
  }
}

// 取消编辑邮箱
function cancelEditEmail() {
  editingEmail.value = false;
  emailForm.value.email = '';
}

// 开始编辑名称
function startEditNickname() {
  nicknameForm.value.nickname = userInfo.value?.nickname || '';
  editingNickname.value = true;
}

// 名称最大长度
const NICKNAME_MAX_LENGTH = 20;

// 保存名称
async function saveNickname() {
  const nickname = nicknameForm.value.nickname.trim();

  if (!nickname) {
    message.warning('名称不能为空');
    return;
  }

  // 前端长度校验
  if (nickname.length > NICKNAME_MAX_LENGTH) {
    message.warning(`名称长度不能超过 ${NICKNAME_MAX_LENGTH} 字符`);
    return;
  }

  savingNickname.value = true;
  try {
    await http.put('/user/profile', { nickname });
    userStore.updateLocalUserInfo({ nickname });
    editingNickname.value = false;
    message.success('名称更新成功');
  } catch (error) {
    // 显示后端返回的具体错误信息
    const err = error as Error & { response?: { data?: { message?: string } } };
    message.error(err.response?.data?.message || '名称更新失败');
  } finally {
    savingNickname.value = false;
  }
}

// 取消编辑名称
function cancelEditNickname() {
  editingNickname.value = false;
  nicknameForm.value.nickname = '';
}

// 打开修改密码弹窗
function openPasswordModal() {
  passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
  showOldPassword.value = false;
  showNewPassword.value = false;
  showConfirmPassword.value = false;
  showPasswordModal.value = true;
}

// 修改密码
async function changePassword() {
  const { oldPassword, newPassword, confirmPassword } = passwordForm.value;

  if (!oldPassword || !newPassword || !confirmPassword) {
    message.warning('请填写完整');
    return;
  }

  if (newPassword.length < 6 || newPassword.length > 32) {
    message.warning('新密码长度需在 6-32 字符之间');
    return;
  }

  if (newPassword !== confirmPassword) {
    message.warning('两次输入的新密码不一致');
    return;
  }

  savingPassword.value = true;
  try {
    const encryptedOldPassword = await encryptApiKey(oldPassword);
    const encryptedNewPassword = await encryptApiKey(newPassword);

    await http.put('/user/password', {
      encryptedOldPassword,
      encryptedNewPassword,
    });

    showPasswordModal.value = false;
    message.success('密码修改成功');
  } catch (error) {
    const err = error as Error & { response?: { data?: { message?: string } } };
    message.error(err.response?.data?.message || '密码修改失败');
  } finally {
    savingPassword.value = false;
  }
}

// 获取头像显示内容
const avatarDisplay = computed(() => {
  if (userInfo.value?.avatar) {
    return { type: 'image' as const, src: userInfo.value.avatar };
  }
  // 显示用户名首字母
  const name = userInfo.value?.username || 'U';
  return { type: 'text' as const, text: name.charAt(0).toUpperCase() };
});

onMounted(async () => {
  loading.value = true;
  await userStore.refreshUserInfo();
  loading.value = false;
});
</script>

<template>
  <div class="p-6">
    <!-- 背景装饰 -->
    <div class="pointer-events-none fixed inset-0 overflow-hidden">
      <div class="bg-glow-blue absolute -top-40 -left-40 h-80 w-80 rounded-full blur-3xl"></div>
      <div class="bg-glow-purple absolute top-1/3 -right-20 h-60 w-60 rounded-full blur-3xl"></div>
      <div class="bg-glow-cyan absolute -bottom-20 left-1/3 h-72 w-72 rounded-full blur-3xl"></div>
    </div>

    <NSpin :show="loading">
      <div class="relative mx-auto max-w-4xl">
        <!-- 页面标题 -->
        <div class="mb-8 text-center">
          <h1 class="text-gradient title-glow text-3xl font-bold">个人中心</h1>
          <p class="text-theme-secondary mt-2">管理您的账户信息</p>
        </div>

        <!-- 主卡片 -->
        <div class="card-theme-gradient overflow-hidden rounded-3xl p-8">
          <div class="grid gap-8 md:grid-cols-3">
            <!-- 左侧：头像区域 -->
            <div class="flex flex-col items-center justify-center">
              <!-- 头像容器 -->
              <div class="group relative">
                <!-- 头像光环 -->
                <div
                  class="from-primary-500 via-accent-purple to-accent-cyan absolute -inset-1 rounded-full bg-linear-to-r opacity-75 blur transition-opacity group-hover:opacity-100"
                ></div>

                <!-- 头像 -->
                <div
                  class="relative h-32 w-32 cursor-pointer overflow-hidden rounded-full border-4 border-white/10 transition-transform hover:scale-105"
                  @click="triggerAvatarUpload"
                >
                  <!-- 图片头像 -->
                  <img
                    v-if="avatarDisplay.type === 'image'"
                    :src="avatarDisplay.src"
                    alt="头像"
                    class="h-full w-full object-cover"
                  />
                  <!-- 文字头像 -->
                  <div
                    v-else
                    class="from-primary-500 to-accent-purple flex h-full w-full items-center justify-center bg-linear-to-br text-4xl font-bold text-white"
                  >
                    {{ avatarDisplay.text }}
                  </div>

                  <!-- 上传遮罩 -->
                  <div
                    class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <NIcon :component="CameraOutline" class="text-3xl text-white" />
                  </div>

                  <!-- 上传中 -->
                  <div
                    v-if="uploadingAvatar"
                    class="absolute inset-0 flex items-center justify-center bg-black/70"
                  >
                    <NSpin size="small" />
                  </div>
                </div>

                <!-- 隐藏的文件输入 -->
                <input
                  ref="avatarInput"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  class="hidden"
                  @change="handleAvatarChange"
                />
              </div>

              <!-- 用户名 -->
              <h2 class="text-theme mt-4 text-xl font-semibold">
                {{ userInfo?.nickname || userInfo?.username || '用户' }}
              </h2>
            </div>

            <!-- 右侧：信息区域 -->
            <div class="space-y-6 md:col-span-2">
              <!-- 名称 -->
              <div class="card-theme rounded-2xl p-4">
                <div class="flex items-center gap-3">
                  <div
                    class="icon-bg-primary flex h-10 w-10 items-center justify-center rounded-xl"
                  >
                    <NIcon :component="PersonOutline" class="text-primary-500 text-xl" />
                  </div>
                  <div class="flex-1">
                    <div class="text-theme-secondary text-xs">名称</div>
                    <div v-if="!editingNickname" class="flex items-center gap-2">
                      <span class="text-theme font-medium">
                        {{ userInfo?.nickname || userInfo?.username || '-' }}
                      </span>
                      <NButton text size="tiny" type="primary" @click="startEditNickname">
                        修改
                      </NButton>
                    </div>
                    <div v-else class="flex items-center gap-2">
                      <NInput
                        v-model:value="nicknameForm.nickname"
                        placeholder="请输入名称"
                        size="small"
                        class="flex-1"
                        :maxlength="NICKNAME_MAX_LENGTH"
                        show-count
                      />
                      <NButton
                        type="primary"
                        size="tiny"
                        :loading="savingNickname"
                        @click="saveNickname"
                      >
                        保存
                      </NButton>
                      <NButton size="tiny" @click="cancelEditNickname">取消</NButton>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 账号 -->
              <div class="card-theme rounded-2xl p-4">
                <div class="flex items-center gap-3">
                  <div
                    class="icon-bg-primary flex h-10 w-10 items-center justify-center rounded-xl"
                  >
                    <NIcon :component="PersonOutline" class="text-primary-500 text-xl" />
                  </div>
                  <div class="flex-1">
                    <div class="text-theme-secondary text-xs">账号</div>
                    <div class="text-theme font-medium">{{ userInfo?.username || '-' }}</div>
                  </div>
                </div>
              </div>

              <!-- 邮箱 -->
              <div class="card-theme rounded-2xl p-4">
                <div class="flex items-center gap-3">
                  <div class="icon-bg-cyan flex h-10 w-10 items-center justify-center rounded-xl">
                    <NIcon :component="MailOutline" class="text-accent-cyan text-xl" />
                  </div>
                  <div class="flex-1">
                    <div class="text-theme-secondary text-xs">邮箱</div>
                    <div v-if="!editingEmail" class="flex items-center gap-2">
                      <span class="text-theme font-medium">
                        {{ userInfo?.email || '未设置' }}
                      </span>
                      <NButton text size="tiny" type="primary" @click="startEditEmail">
                        {{ userInfo?.email ? '修改' : '设置' }}
                      </NButton>
                    </div>
                    <div v-else class="flex items-center gap-2">
                      <NInput
                        v-model:value="emailForm.email"
                        placeholder="请输入邮箱"
                        size="small"
                        class="flex-1"
                      />
                      <NButton type="primary" size="tiny" :loading="savingEmail" @click="saveEmail">
                        保存
                      </NButton>
                      <NButton size="tiny" @click="cancelEditEmail">取消</NButton>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 安全设置 -->
              <div class="card-theme rounded-2xl p-4">
                <div class="flex items-center gap-3">
                  <div class="icon-bg-purple flex h-10 w-10 items-center justify-center rounded-xl">
                    <NIcon :component="LockClosedOutline" class="text-accent-purple text-xl" />
                  </div>
                  <div class="flex-1">
                    <div class="text-theme-secondary text-xs">登录密码</div>
                    <div class="flex items-center gap-2">
                      <span class="text-theme font-medium">••••••••</span>
                      <NButton text size="tiny" type="primary" @click="openPasswordModal">
                        修改密码
                      </NButton>
                    </div>
                  </div>
                  <NIcon :component="ShieldCheckmarkOutline" class="text-xl text-emerald-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NSpin>

    <!-- 修改密码弹窗 -->
    <NModal
      v-model:show="showPasswordModal"
      preset="card"
      title="修改密码"
      style="width: 400px"
      :bordered="false"
      :segmented="{ content: true }"
    >
      <NForm label-placement="top">
        <NFormItem label="原密码">
          <NInput
            v-model:value="passwordForm.oldPassword"
            :type="showOldPassword ? 'text' : 'password'"
            placeholder="请输入原密码"
          >
            <template #suffix>
              <NIcon
                :component="showOldPassword ? EyeOffOutline : EyeOutline"
                class="cursor-pointer"
                @click="showOldPassword = !showOldPassword"
              />
            </template>
          </NInput>
        </NFormItem>
        <NFormItem label="新密码">
          <NInput
            v-model:value="passwordForm.newPassword"
            :type="showNewPassword ? 'text' : 'password'"
            placeholder="6-32 位字符"
          >
            <template #suffix>
              <NIcon
                :component="showNewPassword ? EyeOffOutline : EyeOutline"
                class="cursor-pointer"
                @click="showNewPassword = !showNewPassword"
              />
            </template>
          </NInput>
        </NFormItem>
        <NFormItem label="确认新密码">
          <NInput
            v-model:value="passwordForm.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="再次输入新密码"
          >
            <template #suffix>
              <NIcon
                :component="showConfirmPassword ? EyeOffOutline : EyeOutline"
                class="cursor-pointer"
                @click="showConfirmPassword = !showConfirmPassword"
              />
            </template>
          </NInput>
        </NFormItem>
      </NForm>
      <template #footer>
        <div class="flex justify-end gap-3">
          <NButton @click="showPasswordModal = false">取消</NButton>
          <NButton type="primary" :loading="savingPassword" @click="changePassword">
            <template #icon>
              <NIcon :component="CheckmarkCircle" />
            </template>
            确认修改
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
