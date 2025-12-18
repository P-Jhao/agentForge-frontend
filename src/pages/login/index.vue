<script setup lang="ts">
/**
 * 登录/注册页面
 */
import { ref } from 'vue';
import { NInput, NButton, NIcon, useMessage } from 'naive-ui';
import { PersonOutline, LockClosedOutline } from '@vicons/ionicons5';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores';
import { http } from '@/utils';

const router = useRouter();
const message = useMessage();
const userStore = useUserStore();

// 当前模式：login / register
const mode = ref<'login' | 'register'>('login');
const loading = ref(false);

const formData = ref({
  username: '',
  password: '',
  confirmPassword: '',
});

// 切换模式
function toggleMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login';
  formData.value = { username: '', password: '', confirmPassword: '' };
}

// 登录
async function handleLogin() {
  if (!formData.value.username || !formData.value.password) {
    message.warning('请输入用户名和密码');
    return;
  }
  loading.value = true;
  try {
    await userStore.login(formData.value.username, formData.value.password);
    message.success('登录成功');
    // 获取重定向路径，默认跳转首页
    const redirect = (router.currentRoute.value.query.redirect as string) || '/';
    router.push(redirect);
  } catch (error: unknown) {
    const err = error as { message?: string };
    message.error(err.message || '登录失败');
  } finally {
    loading.value = false;
  }
}

// 注册
async function handleRegister() {
  const { username, password, confirmPassword } = formData.value;

  if (!username || !password) {
    message.warning('请输入用户名和密码');
    return;
  }
  if (username.length < 3 || username.length > 20) {
    message.warning('用户名长度需在 3-20 字符之间');
    return;
  }
  if (password.length < 6 || password.length > 32) {
    message.warning('密码长度需在 6-32 字符之间');
    return;
  }
  if (password !== confirmPassword) {
    message.warning('两次密码输入不一致');
    return;
  }
  loading.value = true;
  try {
    await http.post('/user/register', {
      username: formData.value.username,
      password: formData.value.password,
    });
    message.success('注册成功，请登录');
    mode.value = 'login';
    formData.value.password = '';
    formData.value.confirmPassword = '';
  } catch (error: unknown) {
    const err = error as { message?: string };
    message.error(err.message || '注册失败');
  } finally {
    loading.value = false;
  }
}

// 提交
function handleSubmit() {
  if (mode.value === 'login') {
    handleLogin();
  } else {
    handleRegister();
  }
}
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-900">
    <!-- 背景装饰 -->
    <div class="pointer-events-none absolute inset-0">
      <div
        class="bg-primary-600/20 absolute -top-40 -left-40 h-96 w-96 rounded-full blur-[120px]"
      ></div>
      <div
        class="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-purple-600/20 blur-[100px]"
      ></div>
      <div
        class="absolute -bottom-20 left-1/3 h-72 w-72 rounded-full bg-cyan-500/15 blur-[100px]"
      ></div>
    </div>

    <!-- 登录卡片 -->
    <div class="relative z-10 w-full max-w-md px-6">
      <!-- Logo -->
      <div class="mb-8 text-center">
        <img
          src="@/assets/imgs/favicon660x660nobackground.png"
          alt="AgentForge"
          class="mx-auto mb-4 h-20 w-20"
        />
        <h1 class="text-3xl font-bold text-white">AgentForge</h1>
        <p class="mt-2 text-gray-400">锻造你的专属 AI Agent</p>
      </div>

      <!-- 表单卡片 -->
      <div class="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <!-- 标题 -->
        <h2 class="mb-6 text-center text-xl font-semibold text-white">
          {{ mode === 'login' ? '欢迎回来' : '创建账号' }}
        </h2>

        <!-- 表单 -->
        <div class="space-y-4">
          <!-- 用户名 -->
          <div>
            <NInput
              v-model:value="formData.username"
              placeholder="用户名"
              size="large"
              :input-props="{ autocomplete: 'username' }"
            >
              <template #prefix>
                <NIcon :component="PersonOutline" class="text-gray-400" />
              </template>
            </NInput>
          </div>

          <!-- 密码 -->
          <div>
            <NInput
              v-model:value="formData.password"
              type="password"
              placeholder="密码"
              size="large"
              show-password-on="click"
              :input-props="{
                autocomplete: mode === 'login' ? 'current-password' : 'new-password',
              }"
              @keyup.enter="mode === 'login' && handleSubmit()"
            >
              <template #prefix>
                <NIcon :component="LockClosedOutline" class="text-gray-400" />
              </template>
            </NInput>
          </div>

          <!-- 确认密码（注册时显示） -->
          <div v-if="mode === 'register'">
            <NInput
              v-model:value="formData.confirmPassword"
              type="password"
              placeholder="确认密码"
              size="large"
              show-password-on="click"
              :input-props="{ autocomplete: 'new-password' }"
              @keyup.enter="handleSubmit"
            >
              <template #prefix>
                <NIcon :component="LockClosedOutline" class="text-gray-400" />
              </template>
            </NInput>
          </div>

          <!-- 提交按钮 -->
          <NButton
            type="primary"
            size="large"
            block
            :loading="loading"
            class="from-primary-500! mt-6! h-12! rounded-xl! bg-linear-to-r! to-purple-600! font-medium!"
            @click="handleSubmit"
          >
            {{ mode === 'login' ? '登录' : '注册' }}
          </NButton>
        </div>

        <!-- 切换登录/注册 -->
        <div class="mt-6 text-center text-sm text-gray-400">
          {{ mode === 'login' ? '还没有账号？' : '已有账号？' }}
          <span class="text-primary-400 hover:text-primary-300 cursor-pointer" @click="toggleMode">
            {{ mode === 'login' ? '立即注册' : '立即登录' }}
          </span>
        </div>
      </div>

      <!-- 底部信息 -->
      <p class="mt-8 text-center text-xs text-gray-500">© 2024 AgentForge. All rights reserved.</p>
    </div>
  </div>
</template>
