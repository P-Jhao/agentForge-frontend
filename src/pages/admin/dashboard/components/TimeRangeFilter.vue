<script setup lang="ts">
/**
 * 时间范围筛选器组件
 */
import { computed } from 'vue';
import { NButtonGroup, NButton, NDatePicker } from 'naive-ui';
import { RefreshOutline } from '@vicons/ionicons5';
import type { TimeRangeType } from '@/utils/adminApi';

// Props
interface Props {
  modelValue: TimeRangeType;
  customRange?: [number, number] | null;
  loading?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  customRange: null,
  loading: false,
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: TimeRangeType];
  'update:customRange': [value: [number, number] | null];
  refresh: [];
}>();

// 预设选项
const presetOptions = [
  { label: '近24小时', value: 'last24h' as TimeRangeType },
  { label: '近7日', value: 'last7d' as TimeRangeType },
  { label: '近30日', value: 'last30d' as TimeRangeType },
  { label: '全部', value: 'all' as TimeRangeType },
];

// 当前选中的预设
const activePreset = computed(() => props.modelValue);

// 是否显示自定义时间选择器
const showCustomPicker = computed(() => props.modelValue === 'custom');

// 选择预设
function selectPreset(value: TimeRangeType) {
  emit('update:modelValue', value);
  if (value !== 'custom') {
    emit('update:customRange', null);
  }
}

// 自定义时间范围变化
function onCustomRangeChange(value: [number, number] | null) {
  emit('update:customRange', value);
  if (value) {
    emit('update:modelValue', 'custom');
  }
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <!-- 预设选项 -->
    <NButtonGroup>
      <NButton
        v-for="option in presetOptions"
        :key="option.value"
        :type="activePreset === option.value ? 'primary' : 'default'"
        @click="selectPreset(option.value)"
      >
        {{ option.label }}
      </NButton>
      <NButton
        :type="activePreset === 'custom' ? 'primary' : 'default'"
        @click="selectPreset('custom')"
      >
        自定义
      </NButton>
    </NButtonGroup>

    <!-- 自定义时间选择器 -->
    <NDatePicker
      v-if="showCustomPicker"
      type="datetimerange"
      :value="customRange"
      clearable
      @update:value="onCustomRangeChange"
    />

    <!-- 刷新按钮 -->
    <NButton :loading="loading" @click="emit('refresh')">
      <template #icon>
        <RefreshOutline />
      </template>
      刷新
    </NButton>
  </div>
</template>
