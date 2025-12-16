/**
 * AI 对话 composable
 * 封装与 AI 交互的核心逻辑
 */
import { ref, nextTick } from 'vue';
import { createStreamRequest } from '@/utils';
import type { StreamChunk } from '@/types';

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

// API 基础路径（开发环境使用代理，生产环境使用完整 URL）
const API_BASE = import.meta.env.VITE_API_BASE || '';

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

  // 当前流式请求的取消函数
  let abortCurrentRequest: (() => void) | null = null;

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
   * 添加 AI 消息（空内容，后续流式填充）
   */
  const addAssistantMessage = (content: string = '') => {
    const msg: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content,
      timestamp: Date.now(),
    };
    messages.value.push(msg);
    return msg;
  };

  /**
   * 更新最后一条 AI 消息的内容
   */
  const updateLastAssistantMessage = (content: string) => {
    const lastMsg = messages.value[messages.value.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') {
      lastMsg.content = content;
    }
  };

  /**
   * 发送消息并获取流式响应
   */
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading.value) return;

    // 添加用户消息
    addUserMessage(content);
    await scrollToBottom();

    // 开始加载
    isLoading.value = true;

    // 添加空的 AI 消息，用于流式填充
    const assistantMsg = addAssistantMessage();
    let fullContent = '';

    // 构建消息历史（简化版，只发送当前消息）
    const chatMessages = [{ role: 'user' as const, content }];

    // 获取 token
    const token = localStorage.getItem('forgeToken') || '';

    // 发起流式请求
    const { abort, promise } = createStreamRequest<StreamChunk>({
      url: `${API_BASE}/chat/stream`,
      body: {
        agentId: 'default',
        messages: chatMessages,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
      onChunk: async (chunk) => {
        // 处理流式文本
        if (chunk.type === 'chatStream' && chunk.data) {
          const data = chunk.data as { event: string; content?: string };
          if (data.event === 'data' && data.content) {
            fullContent += data.content;
            updateLastAssistantMessage(fullContent);
            await scrollToBottom();
          }
        }
        // 处理错误
        if (chunk.type === 'error' && chunk.data) {
          const data = chunk.data as { message: string };
          updateLastAssistantMessage(`错误：${data.message}`);
        }
      },
      onComplete: () => {
        isLoading.value = false;
        abortCurrentRequest = null;
      },
      onError: (error) => {
        updateLastAssistantMessage(`请求失败：${error.message}`);
        isLoading.value = false;
        abortCurrentRequest = null;
      },
    });

    abortCurrentRequest = abort;
    await promise;
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

  /**
   * 取消当前请求
   */
  const cancelRequest = () => {
    if (abortCurrentRequest) {
      abortCurrentRequest();
      abortCurrentRequest = null;
      isLoading.value = false;
    }
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
    cancelRequest,
    scrollToBottom,
    addUserMessage,
    addAssistantMessage,
  };
}
