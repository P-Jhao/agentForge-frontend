<script setup lang="ts">
/**
 * 趋势图表通用组件
 * 使用 ECharts 渲染折线图
 */
import { computed } from 'vue';
import { NCard, NSpin } from 'naive-ui';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components';
import type { EChartsOption } from 'echarts';

// 注册 ECharts 组件
use([CanvasRenderer, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

// Props
interface DataSeries {
  name: string;
  data: number[];
  color: string;
}

interface Props {
  title: string;
  labels: string[];
  series: DataSeries[];
  loading?: boolean;
  yAxisFormatter?: (value: number) => string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  yAxisFormatter: (value: number) => String(value),
});

// 图表配置（vue-echarts 会自动响应 option 变化）
const chartOption = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
    },
  },
  legend: {
    data: props.series.map((s) => s.name),
    bottom: 0,
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    top: '10%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: props.labels,
    axisLabel: {
      // 根据数据量自动计算间隔，最多显示约 5 个标签
      interval: Math.max(0, Math.ceil(props.labels.length / 5) - 1),
      rotate: props.labels.length > 20 ? 30 : 0,
    },
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: props.yAxisFormatter,
    },
  },
  series: props.series.map((s) => ({
    name: s.name,
    type: 'line',
    smooth: true,
    data: s.data,
    itemStyle: {
      color: s.color,
    },
    lineStyle: {
      color: s.color,
    },
    areaStyle: {
      color: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: s.color + '40' },
          { offset: 1, color: s.color + '05' },
        ],
      },
    },
  })),
}));
</script>

<template>
  <NCard :title="title" :bordered="false" size="small">
    <NSpin :show="loading">
      <VChart :option="chartOption" :autoresize="true" style="height: 300px" />
    </NSpin>
  </NCard>
</template>
