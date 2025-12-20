/**
 * AI 对话 composable
 * 封装与 AI 交互的核心逻辑
 * 使用扁平消息格式，每条消息独立渲染
 */
import { ref, nextTick } from 'vue';
import { createStreamRequest, createTask } from '@/utils';
import { useTaskStore } from '@/stores';
import type { FlatMessage, TaskSSEChunk, ToolCallStartData, ToolCallResultData } from '@/types';

// 工具调用状态类型
export type ToolCallStatus = 'running' | 'success' | 'failed';

// 前端展示用的消息类型（扁平格式）
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  type: 'chat' | 'thinking' | 'tool_call' | 'error';
  content: string;
  // 工具调用专用字段
  callId?: string;
  toolName?: string;
  arguments?: Record<string, unknown>;
  result?: unknown;
  success?: boolean;
  timestamp: number;
}

// composable 配置选项
export interface UseChatOptions {
  taskId: string;
  onScrollToBottom?: () => void;
}

const API_BASE = import.meta.env.VITE_API_BASE || '';

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
};

export function useChat(options: UseChatOptions) {
  const { onScrollToBottom } = options;

  const currentTaskId = ref(options.taskId);
  const messages = ref<ChatMessage[]>([]);
  const inputValue = ref('');
  const isLoading = ref(false);
  const historyLoaded = ref(false);

  let abortCurrentRequest: (() => void) | null = null;

  // 工具调用状态（callId -> status）
  const toolCallStates = ref<Map<string, ToolCallStatus>>(new Map());

  const setTaskId = (newTaskId: string) => {
    currentTaskId.value = newTaskId;
    historyLoaded.value = false;
  };

  const scrollToBottom = async () => {
    await nextTick();
    setTimeout(() => {
      onScrollToBottom?.();
    }, 0);
  };

  // 节流滚动
  let throttleTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingScroll = false;

  const throttledScrollToBottom = async () => {
    pendingScroll = true;
    if (throttleTimer) return;
    await scrollToBottom();
    pendingScroll = false;
    throttleTimer = setTimeout(async () => {
      throttleTimer = null;
      if (pendingScroll) {
        await scrollToBottom();
        pendingScroll = false;
      }
    }, 500);
  };

  const getToken = () => localStorage.getItem('forgeToken') || '';

  /**
   * 将后端 FlatMessage 转换为前端 ChatMessage
   */
  const convertMessage = (msg: FlatMessage): ChatMessage => ({
    id: msg.id?.toString() || generateId(),
    role: msg.role as 'user' | 'assistant',
    type: msg.type || 'chat',
    content: msg.content,
    callId: msg.callId,
    toolName: msg.toolName,
    arguments: msg.arguments,
    result: msg.result,
    success: msg.success,
    timestamp: new Date(msg.createdAt).getTime(),
  });

  /**
   * 添加用户消息
   */
  const addUserMessage = (content: string) => {
    messages.value.push({
      id: generateId(),
      role: 'user',
      type: 'chat',
      content,
      timestamp: Date.now(),
    });
  };

  /**
   * 添加 AI 消息
   */
  const addAssistantMessage = (msg: Partial<ChatMessage> = {}): ChatMessage => {
    const newMsg: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      type: msg.type || 'chat',
      content: msg.content || '',
      callId: msg.callId,
      toolName: msg.toolName,
      arguments: msg.arguments,
      result: msg.result,
      success: msg.success,
      timestamp: Date.now(),
    };
    messages.value.push(newMsg);
    return newMsg;
  };

  /**
   * 加载历史消息
   */
  const loadHistory = async () => {
    if (historyLoaded.value) return;

    isLoading.value = true;
    toolCallStates.value.clear();

    const { abort, promise } = createStreamRequest<TaskSSEChunk>({
      url: `${API_BASE}/task/${currentTaskId.value}/message`,
      body: { loadHistory: true },
      headers: { Authorization: `Bearer ${getToken()}` },
      onChunk: async (chunk) => {
        console.log('[SSE loadHistory]', chunk.type, chunk.data);

        if (chunk.type === 'history' && Array.isArray(chunk.data)) {
          // 历史消息（扁平格式）
          const historyMessages = chunk.data as FlatMessage[];
          messages.value = historyMessages.map(convertMessage);
          await scrollToBottom();
        } else if (chunk.type === 'tool_call_start' && chunk.data) {
          // 工具调用开始（任务正在运行）
          const data = chunk.data as ToolCallStartData;
          toolCallStates.value.set(data.callId, 'running');
          addAssistantMessage({
            type: 'tool_call',
            callId: data.callId,
            toolName: data.toolName,
            arguments: {},
            success: false,
          });
          await throttledScrollToBottom();
        } else if (chunk.type === 'tool_call_result' && chunk.data) {
          // 工具调用结果
          const data = chunk.data as ToolCallResultData;
          toolCallStates.value.set(data.callId, data.success ? 'success' : 'failed');
          // 更新对应的工具调用消息
          const toolMsg = messages.value.find(
            (m) => m.type === 'tool_call' && m.callId === data.callId
          );
          if (toolMsg) {
            toolMsg.success = data.success;
            toolMsg.result = data.result;
          }
          await throttledScrollToBottom();
        } else if (chunk.type === 'chat' && typeof chunk.data === 'string') {
          // 流式文本输出
          const lastMsg = messages.value[messages.value.length - 1];
          if (lastMsg && lastMsg.role === 'assistant' && lastMsg.type === 'chat') {
            lastMsg.content += chunk.data;
          } else {
            addAssistantMessage({ type: 'chat', content: chunk.data });
          }
          await throttledScrollToBottom();
        } else if (chunk.type === 'error' && chunk.data) {
          const data = chunk.data as { message: string };
          console.error('加载历史消息失败:', data.message);
          addAssistantMessage({ type: 'error', content: data.message });
        }
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

    addUserMessage(content);
    await scrollToBottom();

    isLoading.value = true;
    toolCallStates.value.clear();

    // 当前正在流式输出的消息
    let currentStreamMsg: ChatMessage | null = null;

    const { abort, promise } = createStreamRequest<TaskSSEChunk>({
      url: `${API_BASE}/task/${currentTaskId.value}/message`,
      body: { content },
      headers: { Authorization: `Bearer ${getToken()}` },
      onChunk: async (chunk) => {
        console.log('[SSE sendMessage]', chunk.type, chunk.data);

        if (chunk.type === 'tool_call_start' && chunk.data) {
          const data = chunk.data as ToolCallStartData;
          // 结束当前流式消息
          currentStreamMsg = null;
          // 添加工具调用消息
          toolCallStates.value.set(data.callId, 'running');
          addAssistantMessage({
            type: 'tool_call',
            callId: data.callId,
            toolName: data.toolName,
            arguments: {},
            success: false,
          });
          await throttledScrollToBottom();
          return;
        }

        if (chunk.type === 'tool_call_result' && chunk.data) {
          const data = chunk.data as ToolCallResultData;
          toolCallStates.value.set(data.callId, data.success ? 'success' : 'failed');
          // 更新对应的工具调用消息
          const toolMsg = messages.value.find(
            (m) => m.type === 'tool_call' && m.callId === data.callId
          );
          if (toolMsg) {
            toolMsg.success = data.success;
            toolMsg.result = data.result;
          }
          await throttledScrollToBottom();
          return;
        }

        if (chunk.type === 'chat' && typeof chunk.data === 'string') {
          if (!currentStreamMsg) {
            // 开始新的流式消息
            currentStreamMsg = addAssistantMessage({ type: 'chat', content: chunk.data });
          } else {
            // 追加到当前流式消息
            currentStreamMsg.content += chunk.data;
          }
          await throttledScrollToBottom();
          return;
        }

        if (chunk.type === 'error' && chunk.data) {
          const data = chunk.data as { message: string };
          currentStreamMsg = null;
          addAssistantMessage({ type: 'error', content: data.message });
        }

        if (chunk.type === 'done') {
          currentStreamMsg = null;
        }
      },
      onComplete: async () => {
        isLoading.value = false;
        abortCurrentRequest = null;
        await scrollToBottom();
        const taskStore = useTaskStore();
        taskStore.touchTask(currentTaskId.value);
      },
      onError: (error) => {
        addAssistantMessage({ type: 'error', content: `请求失败：${error.message}` });
        isLoading.value = false;
        abortCurrentRequest = null;
      },
    });

    abortCurrentRequest = abort;
    await promise;
  };

  const handleSend = async () => {
    const content = inputValue.value.trim();
    if (!content) return;
    inputValue.value = '';
    await sendMessage(content);
  };

  const init = async () => {
    const taskId = currentTaskId.value;
    const initKey = `task_${taskId}_init`;
    const initMessage = sessionStorage.getItem(initKey);

    if (initMessage) {
      try {
        const task = await createTask({
          id: taskId,
          firstMessage: initMessage,
        });
        const taskStore = useTaskStore();
        taskStore.addTask(task);
        taskStore.setCurrentTask(taskId);
      } catch {
        console.log('任务可能已存在，继续发送消息');
        const taskStore = useTaskStore();
        taskStore.setCurrentTask(taskId);
      }

      sessionStorage.removeItem(initKey);
      historyLoaded.value = true;
      await sendMessage(initMessage);
    } else {
      const taskStore = useTaskStore();
      taskStore.setCurrentTask(taskId);
      await loadHistory();
    }
  };

  const clearMessages = () => {
    messages.value = [];
    historyLoaded.value = false;
  };

  const cancelRequest = () => {
    if (abortCurrentRequest) {
      abortCurrentRequest();
      abortCurrentRequest = null;
      isLoading.value = false;
    }
  };

  const getMessageText = (msg: ChatMessage): string => {
    return msg.content;
  };

  return {
    messages,
    inputValue,
    isLoading,
    historyLoaded,
    toolCallStates,
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
