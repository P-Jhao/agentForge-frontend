/**
 * AI 对话 composable
 * 封装与 AI 交互的核心逻辑
 * 使用响应式数据驱动消息渲染
 */
import { ref, reactive, nextTick } from 'vue';
import { createStreamRequest, createTask } from '@/utils';
import { useTaskStore } from '@/stores';
import type { FlatMessage, TaskSSEChunk, ToolCallStartData, ToolCallResultData } from '@/types';

// 工具调用状态类型
export type ToolCallStatus = 'running' | 'success' | 'failed';

// 消息类型
export type MessageType = 'user' | 'chat' | 'thinking' | 'tool_call' | 'summary' | 'error';

// 基础消息数据
interface BaseMessageData {
  id: string;
  type: MessageType;
}

// 用户上传的文件信息
export interface UploadedFileInfo {
  filePath: string;
  originalName: string;
  size: number;
  url: string;
}

// 用户消息数据
export interface UserMessageData extends BaseMessageData {
  type: 'user';
  content: string;
  files?: UploadedFileInfo[];
}

// 文本消息数据（chat/thinking/summary/error）
export interface TextMessageData extends BaseMessageData {
  type: 'chat' | 'thinking' | 'summary' | 'error';
  content: string;
  isStreaming?: boolean; // 是否正在流式输出
}

// 工具调用消息数据
export interface ToolCallMessageData extends BaseMessageData {
  type: 'tool_call';
  callId: string;
  toolName: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  success: boolean;
  status: ToolCallStatus;
}

// 消息数据联合类型
export type MessageData = UserMessageData | TextMessageData | ToolCallMessageData;

// 渲染项（包含响应式数据）
export interface RenderItem {
  id: string;
  type: MessageType;
  data: MessageData;
}

// composable 配置选项
export interface UseChatOptions {
  taskId: string;
  onScrollToBottom?: () => void;
}

const API_BASE = import.meta.env.VITE_API_BASE || '';

let idCounter = 0;
const generateId = () => {
  return `msg_${Date.now()}_${idCounter++}`;
};

export function useChat(options: UseChatOptions) {
  const { onScrollToBottom } = options;

  const currentTaskId = ref(options.taskId);
  const inputValue = ref('');
  const isLoading = ref(false);
  const historyLoaded = ref(false);

  let abortCurrentRequest: (() => void) | null = null;

  // 渲染列表（每个元素包含响应式数据）
  const renderItems = ref<RenderItem[]>([]);

  // 当前正在流式输出的消息（记录 type 和对应的响应式数据）
  let currentStreamItem: RenderItem | null = null;

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
   * 添加用户消息
   */
  const addUserMessage = (content: string, fileInfo?: UploadedFileInfo): RenderItem => {
    const id = generateId();
    const data = reactive<UserMessageData>({
      id,
      type: 'user',
      content,
      files: fileInfo ? [fileInfo] : undefined,
    });
    const item: RenderItem = { id, type: 'user', data };
    renderItems.value.push(item);
    return item;
  };

  /**
   * 添加文本消息（chat/thinking/summary/error）
   */
  const addTextMessage = (
    type: 'chat' | 'thinking' | 'summary' | 'error',
    content: string
  ): RenderItem => {
    const id = generateId();
    const data = reactive<TextMessageData>({
      id,
      type,
      content,
    });
    const item: RenderItem = { id, type, data };
    renderItems.value.push(item);
    return item;
  };

  /**
   * 添加工具调用消息
   */
  const addToolCallMessage = (
    callId: string,
    toolName: string,
    args: Record<string, unknown> = {}
  ): RenderItem => {
    const id = generateId();
    const data = reactive<ToolCallMessageData>({
      id,
      type: 'tool_call',
      callId,
      toolName,
      arguments: args,
      success: false,
      status: 'running',
    });
    const item: RenderItem = { id, type: 'tool_call', data };
    renderItems.value.push(item);
    return item;
  };

  /**
   * 处理 SSE 消息（核心逻辑）
   * 根据 type 决定是追加到当前消息还是创建新消息
   */
  const handleSSEChunk = (chunk: TaskSSEChunk) => {
    const { type, data } = chunk;

    // 工具调用开始
    if (type === 'tool_call_start' && data) {
      const toolData = data as ToolCallStartData;
      // 结束当前流式消息
      currentStreamItem = null;
      // 创建新的工具调用消息
      addToolCallMessage(toolData.callId, toolData.toolName);
      return true;
    }

    // 工具调用结果
    if (type === 'tool_call_result' && data) {
      const resultData = data as ToolCallResultData;
      // 查找对应的工具调用消息并更新
      const toolItem = renderItems.value.find(
        (item) =>
          item.type === 'tool_call' &&
          (item.data as ToolCallMessageData).callId === resultData.callId
      );
      if (toolItem) {
        const toolData = toolItem.data as ToolCallMessageData;
        toolData.success = resultData.success;
        toolData.result = resultData.result;
        toolData.status = resultData.success ? 'success' : 'failed';
        // 从 tool_call_result 中获取参数（工具 LLM 决定的参数）
        if (resultData.args) {
          toolData.arguments = resultData.args;
        }
      }
      return true;
    }

    // 文本消息（chat/thinking/summary）
    if (['chat', 'thinking', 'summary'].includes(type) && typeof data === 'string') {
      const msgType = type as 'chat' | 'thinking' | 'summary';

      // 如果当前有流式消息且类型相同，追加内容
      if (currentStreamItem && currentStreamItem.type === msgType) {
        (currentStreamItem.data as TextMessageData).content += data;
      } else {
        // 类型不同或没有当前消息，先结束之前的流式消息
        if (currentStreamItem) {
          (currentStreamItem.data as TextMessageData).isStreaming = false;
        }
        // 创建新消息，标记为正在流式输出
        currentStreamItem = addTextMessage(msgType, data);
        (currentStreamItem.data as TextMessageData).isStreaming = true;
      }
      return true;
    }

    // 错误消息
    if (type === 'error' && data) {
      const errorData = data as { message: string };
      currentStreamItem = null;
      addTextMessage('error', errorData.message);
      return true;
    }

    // done 消息
    if (type === 'done') {
      // 结束当前流式消息
      if (currentStreamItem) {
        (currentStreamItem.data as TextMessageData).isStreaming = false;
      }
      currentStreamItem = null;
      return true;
    }

    return false;
  };

  /**
   * 将后端 FlatMessage 转换为 RenderItem
   */
  const convertFlatMessage = (msg: FlatMessage): RenderItem => {
    const id = msg.id?.toString() || generateId();

    if (msg.role === 'user') {
      const data = reactive<UserMessageData>({
        id,
        type: 'user',
        content: msg.content,
        files: msg.files,
      });
      return { id, type: 'user', data };
    }

    if (msg.type === 'tool_call') {
      const data = reactive<ToolCallMessageData>({
        id,
        type: 'tool_call',
        callId: msg.callId || '',
        toolName: msg.toolName || '',
        arguments: msg.arguments || {},
        result: msg.result,
        success: msg.success ?? false,
        status: msg.success ? 'success' : 'failed',
      });
      return { id, type: 'tool_call', data };
    }

    // chat/thinking/error
    const msgType = (msg.type || 'chat') as 'chat' | 'thinking' | 'error';
    const data = reactive<TextMessageData>({
      id,
      type: msgType,
      content: msg.content,
    });
    return { id, type: msgType, data };
  };

  /**
   * 加载历史消息
   */
  const loadHistory = async () => {
    if (historyLoaded.value) return;

    isLoading.value = true;
    currentStreamItem = null;

    const { abort, promise } = createStreamRequest<TaskSSEChunk>({
      url: `${API_BASE}/task/${currentTaskId.value}/message`,
      body: { loadHistory: true },
      headers: { Authorization: `Bearer ${getToken()}` },
      onChunk: async (chunk) => {
        console.log('[SSE loadHistory]', chunk.type, chunk.data);

        if (chunk.type === 'history' && Array.isArray(chunk.data)) {
          // 历史消息（扁平格式）
          const historyMessages = chunk.data as FlatMessage[];
          renderItems.value = historyMessages.map(convertFlatMessage);
          await scrollToBottom();
        } else {
          // 处理流式消息（任务正在运行时）
          handleSSEChunk(chunk);
          await throttledScrollToBottom();
        }
      },
      onComplete: () => {
        isLoading.value = false;
        historyLoaded.value = true;
        abortCurrentRequest = null;
        currentStreamItem = null;
      },
      onError: (error) => {
        console.error('加载历史消息失败:', error.message);
        isLoading.value = false;
        abortCurrentRequest = null;
        currentStreamItem = null;
      },
    });

    abortCurrentRequest = abort;
    await promise;
  };

  /**
   * 发送消息并获取流式响应
   */
  const sendMessage = async (
    content: string,
    enableThinking?: boolean,
    fileInfo?: { filePath: string; originalName: string; size: number; url: string }
  ) => {
    if (!content.trim() || isLoading.value) return;

    console.log('[useChat] sendMessage 被调用', { content, enableThinking, fileInfo });

    // 添加用户消息（包含文件信息）
    addUserMessage(content, fileInfo);
    await scrollToBottom();

    isLoading.value = true;
    currentStreamItem = null;

    // 优先使用传入的参数，否则从 localStorage 获取
    const thinkingEnabled = enableThinking ?? localStorage.getItem('enableThinking') === 'true';

    // 构建请求体
    const body: Record<string, unknown> = {
      content,
      enableThinking: thinkingEnabled,
    };

    // 如果有文件，添加到请求体
    if (fileInfo) {
      body.files = [fileInfo];
    }

    const { abort, promise } = createStreamRequest<TaskSSEChunk>({
      url: `${API_BASE}/task/${currentTaskId.value}/message`,
      body,
      headers: { Authorization: `Bearer ${getToken()}` },
      onChunk: async (chunk) => {
        console.log('[SSE sendMessage]', chunk.type, chunk.data);
        handleSSEChunk(chunk);
        await throttledScrollToBottom();
      },
      onComplete: async () => {
        isLoading.value = false;
        abortCurrentRequest = null;
        currentStreamItem = null;
        await scrollToBottom();
        const taskStore = useTaskStore();
        taskStore.touchTask(currentTaskId.value);
      },
      onError: (error) => {
        addTextMessage('error', `请求失败：${error.message}`);
        isLoading.value = false;
        abortCurrentRequest = null;
        currentStreamItem = null;
      },
    });

    abortCurrentRequest = abort;
    await promise;
  };

  const handleSend = async (
    content?: string,
    enableThinking?: boolean,
    fileInfo?: UploadedFileInfo
  ) => {
    console.log('[useChat] handleSend 被调用', { content, enableThinking, fileInfo });
    const messageContent = content ?? inputValue.value.trim();
    if (!messageContent) return;
    inputValue.value = '';
    await sendMessage(messageContent, enableThinking, fileInfo);
  };

  const init = async () => {
    const taskId = currentTaskId.value;
    const initKey = `task_${taskId}_init`;
    const fileKey = `task_${taskId}_file`;
    const initMessage = sessionStorage.getItem(initKey);

    if (initMessage) {
      // 读取文件信息（如果有）
      let fileInfo: UploadedFileInfo | undefined;
      const fileInfoStr = sessionStorage.getItem(fileKey);
      if (fileInfoStr) {
        try {
          fileInfo = JSON.parse(fileInfoStr);
        } catch {
          // 解析失败，忽略
        }
      }

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

      // 清理 sessionStorage
      sessionStorage.removeItem(initKey);
      sessionStorage.removeItem(fileKey);

      historyLoaded.value = true;
      // 发送消息时带上文件信息
      await sendMessage(initMessage, undefined, fileInfo);
    } else {
      const taskStore = useTaskStore();
      taskStore.setCurrentTask(taskId);
      await loadHistory();
    }
  };

  const clearMessages = () => {
    renderItems.value = [];
    historyLoaded.value = false;
    currentStreamItem = null;
  };

  const cancelRequest = () => {
    if (abortCurrentRequest) {
      abortCurrentRequest();
      abortCurrentRequest = null;
      isLoading.value = false;
      currentStreamItem = null;
    }
  };

  return {
    // 状态
    renderItems,
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
  };
}
