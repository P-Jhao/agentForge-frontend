/**
 * 打字机效果 composable
 * 实现文本逐字显示的打字机效果
 */
import { ref, type Ref } from 'vue';

export interface TypewriterOptions {
  // 每字符最小延迟（毫秒）
  minDelay?: number;
  // 每字符最大延迟（毫秒）
  maxDelay?: number;
  // 完成回调
  onComplete?: () => void;
}

// 默认配置
const DEFAULT_MIN_DELAY = 10;
const DEFAULT_MAX_DELAY = 50;

/**
 * 打字机效果 composable
 * @param targetRef 目标字符串的 ref
 * @param options 配置选项
 */
export function useTypewriter(targetRef: Ref<string>, options?: TypewriterOptions) {
  const { minDelay = DEFAULT_MIN_DELAY, maxDelay = DEFAULT_MAX_DELAY, onComplete } = options || {};

  // 是否正在打字
  const isTyping = ref(false);

  // 定时器列表（用于清理）
  const timers: ReturnType<typeof setTimeout>[] = [];

  // 待打字的内容队列
  let pendingContent = '';

  // 是否已停止
  let stopped = false;

  /**
   * 生成随机延迟
   */
  const getRandomDelay = (): number => {
    return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
  };

  /**
   * 清理所有定时器
   */
  const clearTimers = () => {
    for (const timer of timers) {
      clearTimeout(timer);
    }
    timers.length = 0;
  };

  /**
   * 打字下一个字符
   */
  const typeNextChar = () => {
    if (stopped || pendingContent.length === 0) {
      if (pendingContent.length === 0 && isTyping.value) {
        isTyping.value = false;
        onComplete?.();
      }
      return;
    }

    // 取出第一个字符
    const char = pendingContent[0];
    pendingContent = pendingContent.slice(1);

    // 添加到目标
    targetRef.value += char;

    // 安排下一个字符
    const delay = getRandomDelay();
    const timer = setTimeout(typeNextChar, delay);
    timers.push(timer);
  };

  /**
   * 开始打字机效果
   * @param content 要显示的完整内容
   */
  const start = (content: string): void => {
    // 清理之前的状态
    stop();
    stopped = false;

    // 清空目标
    targetRef.value = '';

    // 设置待打字内容
    pendingContent = content;

    if (content.length > 0) {
      isTyping.value = true;
      typeNextChar();
    } else {
      onComplete?.();
    }
  };

  /**
   * 停止打字机效果并清理
   */
  const stop = (): void => {
    stopped = true;
    clearTimers();
    pendingContent = '';
    isTyping.value = false;
  };

  /**
   * 追加内容（用于流式数据）
   * @param content 要追加的内容
   */
  const append = (content: string): void => {
    if (stopped) {
      stopped = false;
    }

    pendingContent += content;

    // 如果当前没有在打字，启动打字
    if (!isTyping.value && pendingContent.length > 0) {
      isTyping.value = true;
      typeNextChar();
    }
  };

  /**
   * 立即完成（跳过动画）
   */
  const complete = (): void => {
    clearTimers();
    targetRef.value += pendingContent;
    pendingContent = '';
    isTyping.value = false;
    onComplete?.();
  };

  /**
   * 获取清理函数（用于注册到 autoOperation store）
   */
  const getCleanup = (): (() => void) => {
    return stop;
  };

  return {
    isTyping,
    start,
    stop,
    append,
    complete,
    getCleanup,
  };
}
