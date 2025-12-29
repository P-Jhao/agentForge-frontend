<script setup lang="ts">
/**
 * 数据总览卡片组件
 */
import { computed } from 'vue';
import { NCard, NSpin, NIcon } from 'naive-ui';
import { DocumentTextOutline, FlashOutline, PeopleOutline, EyeOutline } from '@vicons/ionicons5';
import { formatNumber } from '@/utils/format';
import type { StatisticsSummary } from '@/utils/adminApi';

// Props
interface Props {
  data: StatisticsSummary | null;
  loading?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

// 卡片配置
const cards = computed(() => [
  {
    key: 'taskCount',
    label: '任务次数',
    value: props.data?.taskCount ?? 0,
    icon: DocumentTextOutline,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    key: 'totalTokens',
    label: 'Token 消耗',
    value: props.data?.totalTokens ?? 0,
    icon: FlashOutline,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
  },
  {
    key: 'uv',
    label: '独立访客 (UV)',
    value: props.data?.uv ?? 0,
    icon: PeopleOutline,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  {
    key: 'pv',
    label: '访问次数 (PV)',
    value: props.data?.pv ?? 0,
    icon: EyeOutline,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
]);
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <NCard v-for="card in cards" :key="card.key" :bordered="false" size="small">
      <NSpin :show="loading">
        <div class="flex items-center gap-4">
          <!-- 图标 -->
          <div :class="['flex items-center justify-center rounded-lg p-3', card.bgColor]">
            <NIcon :component="card.icon" :size="24" :class="card.color" />
          </div>
          <!-- 数值 -->
          <div>
            <div class="text-theme-secondary text-sm">{{ card.label }}</div>
            <div class="text-theme text-2xl font-bold">
              {{ formatNumber(card.value) }}
            </div>
          </div>
        </div>
      </NSpin>
    </NCard>
  </div>
</template>
