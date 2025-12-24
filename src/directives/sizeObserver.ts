/**
 * 尺寸观察指令
 * 用法：v-size-ob="handleSizeChange"
 * 当元素尺寸变化时调用回调函数，参数为 { width, height }
 */
import type { Directive } from 'vue';

// 回调函数类型
type SizeCallback = (size: { width: number; height: number }) => void;

// 存储元素与回调的映射
const map = new WeakMap<Element, SizeCallback>();

// 共享单个 ResizeObserver 实例
const ob = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const handler = map.get(entry.target);
    if (handler) {
      const box = entry.borderBoxSize[0];
      handler({
        width: box!.inlineSize,
        height: box!.blockSize,
      });
    }
  }
});

const vSizeOb: Directive<HTMLElement, SizeCallback> = {
  mounted(el, binding) {
    ob.observe(el);
    map.set(el, binding.value);
  },
  unmounted(el) {
    ob.unobserve(el);
    map.delete(el);
  },
};

export default vSizeOb;
