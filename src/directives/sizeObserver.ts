/**
 * 尺寸观察指令
 * 用法：v-size-ob="handleSizeChange"
 * 当元素尺寸变化时调用回调函数，参数为 { width, height }
 */
import type { Directive, DirectiveBinding } from 'vue';

// 回调函数类型
type SizeCallback = (size: { width: number; height: number }) => void;

// 存储 observer 实例，用于卸载时清理
const observerMap = new WeakMap<HTMLElement, ResizeObserver>();

const vSizeOb: Directive<HTMLElement, SizeCallback> = {
  mounted(el: HTMLElement, binding: DirectiveBinding<SizeCallback>) {
    const callback = binding.value;
    if (typeof callback !== 'function') {
      console.warn('v-size-ob 指令需要传入一个函数');
      return;
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        callback({ width, height });
      }
    });

    observer.observe(el);
    observerMap.set(el, observer);
  },

  unmounted(el: HTMLElement) {
    const observer = observerMap.get(el);
    if (observer) {
      observer.disconnect();
      observerMap.delete(el);
    }
  },
};

export default vSizeOb;
