/**
 * AI 对话 composable
 * 封装与 AI 交互的核心逻辑
 * 使用新的 /api/task/:id/message 接口
 */
import { ref, nextTick } from 'vue';
import { createStreamRequest, createTask } from '@/utils';
import { useTaskStore } from '@/stores';
import type { Message, MessageSegment, TaskSSEChunk } from '@/types';

// 前端展示用的消息类型
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string | MessageSegment[]; // user: 字符串; assistant: 段落数组
  timestamp: number;
}

// composable 配置选项
export interface UseChatOptions {
  // 任务 UUID
  taskId: string;
  // 消息容器元素引用（用于自动滚动）
  containerRef?: { value: HTMLElement | null };
}

// API 基础路径
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
  const { containerRef } = options;

  // 当前任务 ID（响应式，支持切换任务）
  const currentTaskId = ref(options.taskId);

  // 消息列表
  const messages = ref<ChatMessage[]>([]);

  // 输入框内容
  const inputValue = ref('');

  // 是否正在加载
  const isLoading = ref(false);

  // 是否已加载历史消息
  const historyLoaded = ref(false);

  // 当前流式请求的取消函数
  let abortCurrentRequest: (() => void) | null = null;

  /**
   * 设置任务 ID（切换任务时调用）
   */
  const setTaskId = (newTaskId: string) => {
    currentTaskId.value = newTaskId;
    historyLoaded.value = false;
  };

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
   * 获取 token
   */
  const getToken = () => localStorage.getItem('forgeToken') || '';

  /**
   * 将后端 Message 转换为前端 ChatMessage
   */
  const convertMessage = (msg: Message): ChatMessage => ({
    id: msg.id?.toString() || generateId(),
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    timestamp: new Date(msg.createdAt).getTime(),
  });

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
  const addAssistantMessage = (segments: MessageSegment[] = []) => {
    const msg: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: segments,
      timestamp: Date.now(),
    };
    messages.value.push(msg);
    return msg;
  };

  /**
   * 更新最后一条 AI 消息的内容
   */
  const updateLastAssistantSegments = (segments: MessageSegment[]) => {
    const lastMsg = messages.value[messages.value.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') {
      lastMsg.content = [...segments];
    }
  };

  /**
   * 加载历史消息
   * 如果任务正在运行，会继续接收流式输出
   */
  const loadHistory = async () => {
    if (historyLoaded.value) return;

    isLoading.value = true;

    // 用于收集正在进行的 LLM 回复段落
    const segments: MessageSegment[] = [];
    let currentType: string | null = null;
    let isReceivingStream = false;

    const { abort, promise } = createStreamRequest<TaskSSEChunk>({
      url: `${API_BASE}/task/${currentTaskId.value}/message`,
      body: { loadHistory: true },
      headers: { Authorization: `Bearer ${getToken()}` },
      onChunk: async (chunk) => {
        if (chunk.type === 'history' && Array.isArray(chunk.data)) {
          // 历史消息
          const historyMessages = chunk.data as Message[];
          messages.value = historyMessages.map(convertMessage);
          await scrollToBottom();
        } else if (
          ['thinking', 'chat', 'tool'].includes(chunk.type) &&
          typeof chunk.data === 'string'
        ) {
          // 正在进行的流式输出（任务正在运行）
          const chunkType = chunk.type as 'thinking' | 'chat' | 'tool';
          const chunkContent = chunk.data;

          // 第一次收到流式内容时，添加一个空的 assistant 消息
          if (!isReceivingStream) {
            isReceivingStream = true;
            addAssistantMessage();
          }

          if (currentType !== chunkType) {
            // 开始新段落
            segments.push({ type: chunkType, content: chunkContent });
            currentType = chunkType;
          } else {
            // 拼接到当前段落
            const lastSegment = segments[segments.length - 1];
            if (lastSegment) {
              lastSegment.content += chunkContent;
            }
          }

          // 更新 UI
          updateLastAssistantSegments(segments);
          await scrollToBottom();
        } else if (chunk.type === 'error' && chunk.data) {
          const data = chunk.data as { message: string };
          console.error('加载历史消息失败:', data.message);
          if (isReceivingStream) {
            segments.push({ type: 'error', content: data.message });
            updateLastAssistantSegments(segments);
          }
        }
        // done 类型表示结束
      },
      onComplete: () => {
        isLoading.value = false;
        historyLoaded.value = true;
        abortCurrentRequest = null;
      },
      onError: (error) => {
        console.error('加载历史消息失败:', error.message);
        isLoading.value = false;
        abortCurrentRequest = null;
      },
    });

    abortCurrentRequest = abort;
    await promise;
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
    addAssistantMessage();

    // 用于收集 LLM 回复的段落
    const segments: MessageSegment[] = [];
    let currentType: string | null = null;

    const { abort, promise } = createStreamRequest<TaskSSEChunk>({
      url: `${API_BASE}/task/${currentTaskId.value}/message`,
      body: { content },
      headers: { Authorization: `Bearer ${getToken()}` },
      onChunk: async (chunk) => {
        // 处理流式内容（thinking/chat/tool）
        if (['thinking', 'chat', 'tool'].includes(chunk.type) && typeof chunk.data === 'string') {
          const chunkType = chunk.type as 'thinking' | 'chat' | 'tool';
          const chunkContent = chunk.data;

          if (currentType !== chunkType) {
            // 开始新段落
            segments.push({ type: chunkType, content: chunkContent });
            currentType = chunkType;
          } else {
            // 拼接到当前段落
            const lastSegment = segments[segments.length - 1];
            if (lastSegment) {
              lastSegment.content += chunkContent;
            }
          }

          // 更新 UI
          updateLastAssistantSegments(segments);
          await scrollToBottom();
        }

        // 处理错误
        if (chunk.type === 'error' && chunk.data) {
          const data = chunk.data as { message: string };
          segments.push({ type: 'error', content: data.message });
          updateLastAssistantSegments(segments);
        }

        // done 类型表示结束，不需要特殊处理
      },
      onComplete: () => {
        isLoading.value = false;
        abortCurrentRequest = null;
        // 乐观更新：更新任务的 updatedAt 并移动到列表最前面
        const taskStore = useTaskStore();
        taskStore.touchTask(currentTaskId.value);
      },
      onError: (error) => {
        segments.push({ type: 'error', content: `请求失败：${error.message}` });
        updateLastAssistantSegments(segments);
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
   * 初始化：检查是否有初始消息，决定是创建新任务还是加载历史
   */
  const init = async () => {
    const taskId = currentTaskId.value;
    const initKey = `task_${taskId}_init`;
    const initMessage = sessionStorage.getItem(initKey);

    if (initMessage) {
      // 有初始消息，说明是新任务
      // 1. 先创建任务
      try {
        const task = await createTask({
          id: taskId,
          firstMessage: initMessage,
        });

        // 2. 添加到 TaskStore 并设置为当前任务
        const taskStore = useTaskStore();
        taskStore.addTask(task);
        taskStore.setCurrentTask(taskId);

        // 3. 清除 sessionStorage
        sessionStorage.removeItem(initKey);

        // 4. 标记历史已加载（新任务没有历史）
        historyLoaded.value = true;

        // 5. 发送初始消息
        await sendMessage(initMessage);
      } catch (error) {
        console.error('创建任务失败:', error);
        // 创建失败也清除 sessionStorage，避免重复尝试
        sessionStorage.removeItem(initKey);
      }
    } else {
      // 没有初始消息，说明是已有任务，加载历史
      const taskStore = useTaskStore();
      taskStore.setCurrentTask(taskId);
      await loadHistory();
    }
  };

  /**
   * 清空对话
   */
  const clearMessages = () => {
    messages.value = [];
    historyLoaded.value = false;
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

  /**
   * 获取消息的纯文本内容（用于显示）
   */
  const getMessageText = (msg: ChatMessage): string => {
    if (typeof msg.content === 'string') {
      return msg.content;
    }
    // assistant 消息：合并所有段落
    return msg.content.map((seg) => seg.content).join('\n');
  };

  return {
    // 状态
    messages,
    inputValue,
    isLoading,
    historyLoaded,

    // 方法
    init,
    setTaskId,
    loadHistory,
    sendMessage,
    handleSend,
    clearMessages,
    cancelRequest,
    scrollToBottom,
    addUserMessage,
    addAssistantMessage,
    getMessageText,
  };
}
