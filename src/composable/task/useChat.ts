/**
 * AI 对话 composable
 * 封装与 AI 交互的核心逻辑
 * 使用响应式数据驱动消息渲染
 */
import { ref, reactive, nextTick } from 'vue';
import { createStreamRequest, createTask } from '@/utils';
import { useTaskStore } from '@/stores';
import type { FlatMessage, TaskSSEChunk, ToolCallStartData, ToolCallResultData } from '@/types';
import type { EnhanceMode } from '@/utils/enhanceMode';

// 工具调用状态类型
export type ToolCallStatus = 'running' | 'success' | 'failed';

// 消息类型（扩展支持提示词增强相关类型）
export type MessageType =
  | 'user'
  | 'chat'
  | 'thinking'
  | 'tool_call'
  | 'summary'
  | 'error'
  // 提示词增强相关类型
  | 'user_original' // 开启增强时的用户原始输入
  | 'user_answer' // 智能迭代中用户对澄清问题的回复
  | 'reviewer' // 审查者输出
  | 'questioner' // 提问者输出
  | 'expert' // 专家分析输出
  | 'enhancer'; // 增强后的提示词

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

// 文本消息数据（chat/thinking/summary/error 及增强相关类型）
export interface TextMessageData extends BaseMessageData {
  type:
    | 'chat'
    | 'thinking'
    | 'summary'
    | 'error'
    // 提示词增强相关类型
    | 'user_original'
    | 'user_answer'
    | 'reviewer'
    | 'questioner'
    | 'expert'
    | 'enhancer';
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
   * 添加用户消息（支持多文件）
   */
  const addUserMessage = (content: string, files?: UploadedFileInfo[]): RenderItem => {
    const id = generateId();
    const data = reactive<UserMessageData>({
      id,
      type: 'user',
      content,
      files: files && files.length > 0 ? files : undefined,
    });
    const item: RenderItem = { id, type: 'user', data };
    renderItems.value.push(item);
    return item;
  };

  /**
   * 添加文本消息（chat/thinking/summary/error 及增强相关类型）
   */
  const addTextMessage = (
    type:
      | 'chat'
      | 'thinking'
      | 'summary'
      | 'error'
      | 'user_original'
      | 'user_answer'
      | 'reviewer'
      | 'questioner'
      | 'expert'
      | 'enhancer',
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

    // 文本消息（chat/thinking/summary 及增强相关类型）
    if (
      ['chat', 'thinking', 'summary', 'reviewer', 'questioner', 'expert', 'enhancer'].includes(
        type
      ) &&
      typeof data === 'string'
    ) {
      const msgType = type as
        | 'chat'
        | 'thinking'
        | 'summary'
        | 'reviewer'
        | 'questioner'
        | 'expert'
        | 'enhancer';

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

    // 用户原始输入消息（增强模式下）
    if (type === 'user_original' && typeof data === 'string') {
      // 用户原始输入不需要流式处理，直接创建
      addTextMessage('user_original', data);
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

    // 处理增强相关类型
    if (
      ['user_original', 'user_answer', 'reviewer', 'questioner', 'expert', 'enhancer'].includes(
        msg.type
      )
    ) {
      const msgType = msg.type as
        | 'user_original'
        | 'user_answer'
        | 'reviewer'
        | 'questioner'
        | 'expert'
        | 'enhancer';
      const data = reactive<TextMessageData>({
        id,
        type: msgType,
        content: msg.content,
      });
      return { id, type: msgType, data };
    }

    // chat/thinking/error/summary
    const msgType = (msg.type || 'chat') as 'chat' | 'thinking' | 'error' | 'summary';
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
   * 发送消息并获取流式响应（支持多文件和增强模式）
   */
  const sendMessage = async (
    content: string,
    enableThinking?: boolean,
    enhanceMode?: EnhanceMode,
    files?: UploadedFileInfo[]
  ) => {
    if (!content.trim() || isLoading.value) return;

    // 添加用户消息（包含文件信息）
    addUserMessage(content, files);
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

    // 添加增强模式参数
    if (enhanceMode && enhanceMode !== 'off') {
      body.enhanceMode = enhanceMode;
    }

    // 如果有文件，添加到请求体
    if (files && files.length > 0) {
      body.files = files;
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
    enhanceMode?: EnhanceMode,
    files?: UploadedFileInfo[]
  ) => {
    const messageContent = content ?? inputValue.value.trim();
    if (!messageContent) return;
    inputValue.value = '';
    await sendMessage(messageContent, enableThinking, enhanceMode, files);
  };

  const init = async () => {
    const taskId = currentTaskId.value;
    const initKey = `task_${taskId}_init`;
    const fileKey = `task_${taskId}_file`;
    const enhanceModeKey = `task_${taskId}_enhanceMode`;
    const initMessage = sessionStorage.getItem(initKey);

    if (initMessage) {
      // 读取文件信息（如果有，支持单文件或多文件）
      let files: UploadedFileInfo[] | undefined;
      const fileInfoStr = sessionStorage.getItem(fileKey);
      if (fileInfoStr) {
        try {
          const parsed = JSON.parse(fileInfoStr);
          // 兼容旧格式（单文件对象）和新格式（文件数组）
          if (Array.isArray(parsed)) {
            files = parsed;
          } else {
            files = [parsed];
          }
        } catch {
          // 解析失败，忽略
        }
      }

      // 读取增强模式（如果有）
      const storedEnhanceMode = sessionStorage.getItem(enhanceModeKey) as EnhanceMode | null;

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
      sessionStorage.removeItem(enhanceModeKey);

      historyLoaded.value = true;
      // 发送消息时带上增强模式和文件信息
      await sendMessage(initMessage, undefined, storedEnhanceMode || undefined, files);
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

  /**
   * 获取智能迭代上下文
   * 从消息列表中提取原始提示词、reviewer、questioner 的内容
   * 用于用户回复澄清问题后发送请求
   */
  const getSmartIterateContext = () => {
    let originalPrompt = '';
    let reviewerOutput = '';
    let questionerOutput = '';

    // 从后往前遍历，找到最近的一组迭代消息
    for (let i = renderItems.value.length - 1; i >= 0; i--) {
      const item = renderItems.value[i];
      if (!item) continue;

      if (item.type === 'questioner' && !questionerOutput) {
        const data = item.data as TextMessageData;
        questionerOutput = data.content;
      } else if (item.type === 'reviewer' && !reviewerOutput) {
        const data = item.data as TextMessageData;
        reviewerOutput = data.content;
      } else if ((item.type === 'user_original' || item.type === 'user') && !originalPrompt) {
        // 支持 user_original（历史消息）和 user（当前会话）两种类型
        const data = item.data as TextMessageData | UserMessageData;
        originalPrompt = data.content;
      }

      // 如果三个都找到了，退出循环
      if (originalPrompt && reviewerOutput && questionerOutput) {
        break;
      }

      // 如果遇到 enhancer 或 chat，说明已经过了当前迭代周期
      if (item.type === 'enhancer' || item.type === 'chat') {
        break;
      }
    }

    return { originalPrompt, reviewerOutput, questionerOutput };
  };

  /**
   * 检查是否需要显示智能迭代回复输入框
   * 条件：最后一条消息是 questioner 类型，且不在加载中
   */
  const needsSmartIterateReply = () => {
    if (isLoading.value) return false;
    const lastItem = renderItems.value[renderItems.value.length - 1];
    return lastItem?.type === 'questioner';
  };

  /**
   * 发送智能迭代回复
   * @param answer 用户对澄清问题的回复
   */
  const sendSmartIterateReply = async (answer: string) => {
    if (!answer.trim() || isLoading.value) return;

    // 获取迭代上下文
    const iterateContext = getSmartIterateContext();
    if (!iterateContext.originalPrompt) {
      console.error('[useChat] 无法获取智能迭代上下文');
      return;
    }

    // 添加用户回复消息到界面
    const id = `msg_${Date.now()}_${idCounter++}`;
    const data = reactive<TextMessageData>({
      id,
      type: 'user_answer',
      content: answer,
    });
    renderItems.value.push({ id, type: 'user_answer', data });
    await scrollToBottom();

    isLoading.value = true;
    currentStreamItem = null;

    // 构建请求体，带上迭代上下文
    const body = {
      content: answer,
      enhanceMode: 'smart' as const,
      iterateContext,
    };

    const { abort, promise } = createStreamRequest<TaskSSEChunk>({
      url: `${API_BASE}/task/${currentTaskId.value}/message`,
      body,
      headers: { Authorization: `Bearer ${getToken()}` },
      onChunk: async (chunk) => {
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
    // 智能迭代相关
    needsSmartIterateReply,
    sendSmartIterateReply,
  };
}
