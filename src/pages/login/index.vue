<script setup lang="ts">
import { ref } from 'vue';
import { NCard, NForm, NFormItem, NInput, NButton } from 'naive-ui';
import { useRouter } from 'vue-router';

const router = useRouter();

const formData = ref({
  username: '',
  password: '',
});

// 登录处理
function handleLogin() {
  // TODO: 实现登录逻辑
  router.push('/');
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-100">
    <NCard title="登录 AgentForge" class="w-96">
      <NForm>
        <NFormItem label="用户名">
          <NInput v-model:value="formData.username" placeholder="请输入用户名" />
        </NFormItem>
        <NFormItem label="密码">
          <NInput v-model:value="formData.password" type="password" placeholder="请输入密码" />
        </NFormItem>
        <NButton type="primary" block @click="handleLogin">登录</NButton>
      </NForm>
    </NCard>
  </div>
</template>
