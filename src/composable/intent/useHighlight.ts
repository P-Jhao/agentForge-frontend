/**
 * 高亮动画效果 composable
 * 实现元素高亮闪烁动画
 */

export interface HighlightOptions {
  // 动画持续时间（毫秒）
  duration?: number;
  // 高亮颜色
  color?: string;
  // 完成回调
  onComplete?: () => void;
}

// 默认配置
const DEFAULT_DURATION = 400; // 300-500ms 范围内
const DEFAULT_COLOR = 'rgba(59, 130, 246, 0.3)'; // 蓝色半透明

// CSS 类名
const HIGHLIGHT_CLASS = 'intent-highlight-animation';

// 注入全局样式（只执行一次）
let styleInjected = false;
const injectStyles = () => {
  if (styleInjected) return;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes intent-highlight-pulse {
      0% {
        box-shadow: 0 0 0 0 var(--highlight-color, rgba(59, 130, 246, 0.4));
      }
      50% {
        box-shadow: 0 0 0 8px var(--highlight-color, rgba(59, 130, 246, 0.2));
      }
      100% {
        box-shadow: 0 0 0 0 var(--highlight-color, rgba(59, 130, 246, 0));
      }
    }

    .${HIGHLIGHT_CLASS} {
      animation: intent-highlight-pulse var(--highlight-duration, 400ms) ease-in-out;
      position: relative;
      z-index: 10;
    }
  `;
  document.head.appendChild(style);
  styleInjected = true;
};

/**
 * 高亮动画效果 composable
 */
export function useHighlight() {
  // 确保样式已注入
  injectStyles();

  // 当前高亮的元素
  let currentElement: HTMLElement | null = null;

  // 动画定时器
  let animationTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * 清理当前高亮
   */
  const clearHighlight = () => {
    if (currentElement) {
      currentElement.classList.remove(HIGHLIGHT_CLASS);
      currentElement.style.removeProperty('--highlight-color');
      currentElement.style.removeProperty('--highlight-duration');
      currentElement = null;
    }
    if (animationTimer) {
      clearTimeout(animationTimer);
      animationTimer = null;
    }
  };

  /**
   * 对指定元素应用高亮动画
   * @param element 目标元素
   * @param options 配置选项
   * @returns Promise，动画完成后 resolve
   */
  const highlight = (element: HTMLElement, options?: HighlightOptions): Promise<void> => {
    const { duration = DEFAULT_DURATION, color = DEFAULT_COLOR, onComplete } = options || {};

    return new Promise((resolve) => {
      // 清理之前的高亮
      clearHighlight();

      // 设置 CSS 变量
      element.style.setProperty('--highlight-color', color);
      element.style.setProperty('--highlight-duration', `${duration}ms`);

      // 添加高亮类
      element.classList.add(HIGHLIGHT_CLASS);
      currentElement = element;

      // 滚动到可见区域
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // 动画结束后清理
      animationTimer = setTimeout(() => {
        clearHighlight();
        onComplete?.();
        resolve();
      }, duration);
    });
  };

  /**
   * 通过选择器查找并高亮元素
   * @param selector CSS 选择器
   * @param options 配置选项
   * @returns Promise，动画完成后 resolve；如果未找到元素则 reject
   */
  const highlightBySelector = (selector: string, options?: HighlightOptions): Promise<void> => {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) {
      return Promise.reject(new Error(`未找到元素: ${selector}`));
    }
    return highlight(element, options);
  };

  /**
   * 停止当前高亮动画
   */
  const stop = (): void => {
    clearHighlight();
  };

  /**
   * 获取清理函数（用于注册到 autoOperation store）
   */
  const getCleanup = (): (() => void) => {
    return stop;
  };

  return {
    highlight,
    highlightBySelector,
    stop,
    getCleanup,
  };
}
