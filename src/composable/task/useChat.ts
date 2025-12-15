/**
 * AI 对话 composable
 * 封装与 AI 交互的核心逻辑
 */
import { ref, nextTick } from 'vue';

// 消息类型
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// composable 配置选项
export interface UseChatOptions {
  // 任务 ID
  taskId: string;
  // 消息容器元素引用（用于自动滚动）
  containerRef?: { value: HTMLElement | null };
}

/**
 * 生成消息 ID
 */
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
};

/**
 * AI 对话 composable
 */
export function useChat(options: UseChatOptions) {
  const { taskId, containerRef } = options;

  // 消息列表
  const messages = ref<ChatMessage[]>([]);

  // 输入框内容
  const inputValue = ref('');

  // 是否正在加载
  const isLoading = ref(false);

  /**
   * 滚动到底部
   */
  const scrollToBottom = async () => {
    await nextTick();
    if (containerRef?.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight;
    }
  };

  /**
   * 添加用户消息
   */
  const addUserMessage = (content: string) => {
    messages.value.push({
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    });
  };

  /**
   * 添加 AI 消息
   */
  const addAssistantMessage = (content: string) => {
    messages.value.push({
      id: generateId(),
      role: 'assistant',
      content,
      timestamp: Date.now(),
    });
  };

  /**
   * 发送消息（模拟 AI 响应，后续接入真实 API）
   */
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading.value) return;

    // 添加用户消息
    addUserMessage(content);
    await scrollToBottom();

    // 模拟 AI 响应（后续替换为真实 API 调用）
    isLoading.value = true;
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        addAssistantMessage(
          `收到你的消息：「${content}」\n\n这是一个模拟响应，后续将接入真实的 AI 服务。`
        );
        isLoading.value = false;
        await scrollToBottom();
        resolve();
      }, 1000);
    });
  };

  /**
   * 处理输入框发送
   */
  const handleSend = async () => {
    const content = inputValue.value.trim();
    if (!content) return;

    inputValue.value = '';
    await sendMessage(content);
  };

  /**
   * 初始化：读取 sessionStorage 中的初始消息
   */
  const initFromSession = async () => {
    const initKey = `task_${taskId}_init`;
    const initMessage = sessionStorage.getItem(initKey);

    if (initMessage) {
      // 清除 sessionStorage 中的初始消息
      sessionStorage.removeItem(initKey);
      // 发送初始消息
      await sendMessage(initMessage);
    }
  };

  /**
   * 清空对话
   */
  const clearMessages = () => {
    messages.value = [];
  };

  return {
    // 状态
    messages,
    inputValue,
    isLoading,

    // 方法
    sendMessage,
    handleSend,
    initFromSession,
    clearMessages,
    scrollToBottom,
    addUserMessage,
    addAssistantMessage,
  };
}
