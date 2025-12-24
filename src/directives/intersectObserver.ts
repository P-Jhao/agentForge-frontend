/**
 * 交叉观察指令
 * 用法：v-intersect-ob="{ handler, root?, threshold? }"
 * 或简写：v-intersect-ob="handler"（使用默认配置，root 为视口）
 * 当元素进入/离开视口时调用回调函数
 */
import type { Directive } from 'vue';

// 回调函数类型
type IntersectCallback = (entry: IntersectionObserverEntry) => void;

// 指令绑定值类型
interface IntersectOptions {
  handler: IntersectCallback;
  root?: Element | null;
  threshold?: number | number[];
  rootMargin?: string;
}

// 按 root 分组的 observer 单例
// key: root 元素（null 表示视口）
// value: { observer, callbackMap }
const observerRegistry = new WeakMap<
  object, // root 元素或 nullKey
  {
    ob: IntersectionObserver;
    map: WeakMap<Element, IntersectCallback>;
  }
>();

// 用于 root=null 的 key
const nullKey = {};

// 存储元素对应的 root，用于卸载时查找
const elementRootMap = new WeakMap<Element, object>();

// 获取或创建 observer
function getOrCreateObserver(root: Element | null) {
  const key = root ?? nullKey;
  let registry = observerRegistry.get(key);

  if (!registry) {
    const map = new WeakMap<Element, IntersectCallback>();
    const ob = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const handler = map.get(entry.target);
          if (handler) {
            handler(entry);
          }
        }
      },
      { root }
    );
    registry = { ob, map };
    observerRegistry.set(key, registry);
  }

  return registry;
}

const vIntersectOb: Directive<HTMLElement, IntersectCallback | IntersectOptions> = {
  mounted(el, binding) {
    const value = binding.value;
    let handler: IntersectCallback;
    let root: Element | null = null;

    if (typeof value === 'function') {
      handler = value;
    } else {
      handler = value.handler;
      root = value.root ?? null;
    }

    const { ob, map } = getOrCreateObserver(root);
    const key = root ?? nullKey;

    map.set(el, handler);
    elementRootMap.set(el, key);
    ob.observe(el);
  },
  unmounted(el) {
    const key = elementRootMap.get(el);
    if (!key) return;

    const registry = observerRegistry.get(key);
    if (registry) {
      registry.ob.unobserve(el);
      registry.map.delete(el);
    }
    elementRootMap.delete(el);
  },
};

export default vIntersectOb;
