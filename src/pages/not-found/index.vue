<script setup lang="ts">
import { NButton, NResult } from 'naive-ui';
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <NResult status="404" title="404" description="页面不存在">
      <template #footer>
        <NButton type="primary" @click="router.push('/')">返回首页</NButton>
      </template>
    </NResult>
  </div>
</template>
