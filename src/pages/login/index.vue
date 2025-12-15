<script setup lang="ts">
/**
 * 登录页面
 */
import { ref } from 'vue';
import { NCard, NForm, NFormItem, NInput, NButton, useMessage } from 'naive-ui';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores';

const router = useRouter();
const message = useMessage();
const userStore = useUserStore();

const formData = ref({
  username: '',
  password: '',
});
const loading = ref(false);

// 登录处理
async function handleLogin() {
  if (!formData.value.username || !formData.value.password) {
    message.warning('请输入用户名和密码');
    return;
  }

  loading.value = true;
  try {
    await userStore.login(formData.value.username, formData.value.password);
    message.success('登录成功');
    router.push('/');
  } catch (error) {
    message.error((error as Error).message || '登录失败');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
    <NCard title="登录 AgentForge" class="w-96">
      <NForm>
        <NFormItem label="用户名">
          <NInput v-model:value="formData.username" placeholder="请输入用户名" />
        </NFormItem>
        <NFormItem label="密码">
          <NInput
            v-model:value="formData.password"
            type="password"
            placeholder="请输入密码"
            @keyup.enter="handleLogin"
          />
        </NFormItem>
        <NButton type="primary" block :loading="loading" @click="handleLogin">登录</NButton>
      </NForm>
    </NCard>
  </div>
</template>
