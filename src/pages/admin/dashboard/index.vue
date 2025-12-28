<script setup lang="ts">
/**
 * 后台管理 - 控制台页面
 * 展示数据统计：任务次数、Token 消耗、UV/PV
 */
import { ref, computed, onMounted } from 'vue';
import { useMessage } from 'naive-ui';
import TimeRangeFilter from './components/TimeRangeFilter.vue';
import StatsCards from './components/StatsCards.vue';
import TrendChart from './components/TrendChart.vue';
import { formatNumber } from '@/utils/format';
import { getDashboardStatistics, type TimeRangeType, type StatisticsData } from '@/utils/adminApi';

const message = useMessage();

// 状态
const loading = ref(false);
const timeRange = ref<TimeRangeType>('last7d');
const customRange = ref<[number, number] | null>(null);
const statisticsData = ref<StatisticsData | null>(null);

// 汇总数据
const summary = computed(() => statisticsData.value?.summary ?? null);

// 趋势数据
const trends = computed(() => statisticsData.value?.trends ?? null);

// 任务次数图表数据
const taskChartSeries = computed(() => [
  {
    name: '任务次数',
    data: trends.value?.tasks ?? [],
    color: '#3b82f6', // blue-500
  },
]);

// 用户访问图表数据（UV/PV）
const userChartSeries = computed(() => [
  {
    name: 'UV (独立访客)',
    data: trends.value?.uv ?? [],
    color: '#22c55e', // green-500
  },
  {
    name: 'PV (访问次数)',
    data: trends.value?.pv ?? [],
    color: '#a855f7', // purple-500
  },
]);

// Token 消耗图表数据
const tokenChartSeries = computed(() => [
  {
    name: 'Token 消耗',
    data: trends.value?.tokens ?? [],
    color: '#f59e0b', // amber-500
  },
]);

// 平均 Token 图表数据
const avgTokenChartSeries = computed(() => [
  {
    name: '平均单次 Token',
    data: trends.value?.avgTokens ?? [],
    color: '#ef4444', // red-500
  },
]);

// 加载统计数据
async function fetchStatistics() {
  loading.value = true;
  try {
    const params: { range: TimeRangeType; startTime?: string; endTime?: string } = {
      range: timeRange.value,
    };

    // 自定义时间范围
    if (timeRange.value === 'custom' && customRange.value) {
      params.startTime = new Date(customRange.value[0]).toISOString();
      params.endTime = new Date(customRange.value[1]).toISOString();
    }

    statisticsData.value = await getDashboardStatistics(params);
  } catch (error) {
    console.error('获取统计数据失败:', error);
    message.error('获取统计数据失败，请重试');
  } finally {
    loading.value = false;
  }
}

// 时间范围变化时重新加载
function onTimeRangeChange() {
  // 如果是自定义范围但没有选择时间，不加载
  if (timeRange.value === 'custom' && !customRange.value) {
    return;
  }
  fetchStatistics();
}

// 初始化加载
onMounted(() => {
  fetchStatistics();
});
</script>

<template>
  <div class="space-y-6 p-6">
    <!-- 时间筛选器 -->
    <TimeRangeFilter
      v-model="timeRange"
      v-model:custom-range="customRange"
      :loading="loading"
      @update:model-value="onTimeRangeChange"
      @update:custom-range="onTimeRangeChange"
      @refresh="fetchStatistics"
    />

    <!-- 数据总览卡片 -->
    <StatsCards :data="summary" :loading="loading" />

    <!-- 流量统计图表 -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <TrendChart
        title="任务次数趋势"
        :labels="trends?.labels ?? []"
        :series="taskChartSeries"
        :loading="loading"
      />
      <TrendChart
        title="用户访问趋势"
        :labels="trends?.labels ?? []"
        :series="userChartSeries"
        :loading="loading"
      />
    </div>

    <!-- Token 消耗图表 -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <TrendChart
        title="Token 消耗趋势"
        :labels="trends?.labels ?? []"
        :series="tokenChartSeries"
        :loading="loading"
        :y-axis-formatter="formatNumber"
      />
      <TrendChart
        title="平均单次 Token 趋势"
        :labels="trends?.labels ?? []"
        :series="avgTokenChartSeries"
        :loading="loading"
        :y-axis-formatter="formatNumber"
      />
    </div>
  </div>
</template>
