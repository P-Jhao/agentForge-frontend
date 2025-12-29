/**
 * AI 对话 composable
 * 封装与 AI 交互的核心逻辑
 * 使用响应式数据驱动消息渲染
 */
import { ref, nextTick } from 'vue';
import { createStreamRequest, createTask, abortTask } from '@/utils';
import { useTaskStore } from '@/stores';
import type { FlatMessage, TaskSSEChunk } from '@/types';
import type { EnhanceMode } from '@/utils/enhanceMode';

// 导入子模块
import { useMessageManager, convertFlatMessage, getNextIdCounter } from './useMessageManager';
import { useSSEHandler } from './useSSEHandler';
import { useSmartIterate } from './useSmartIterate';
import { useFeedback } from './useFeedback';

// 导出类型（保持向后兼容）
export type {
  MessageType,
  MessageData,
  RenderItem,
  UserMessageData,
  TextMessageData,
  ToolCallMessageData,
  TurnEndMessageData,
  UploadedFileInfo,
  UseChatOptions,
} from './types';

// 导出转换函数（供外部使用）
export { convertFlatMessage };

import type { RenderItem, UseChatOptions, UploadedFileInfo, TurnEndMessageData } from './types';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export function useChat(options: UseChatOptions) {
  const { onScrollToBottom, onForceScrollToBottom } = options;

  const currentTaskId = ref(options.taskId);
  const inputValue = ref('');
  const isLoading = ref(false);
  const isStreaming = ref(false); // LLM 正在生成回复（区分于加载历史）
  const historyLoaded = ref(false);

  let abortCurrentRequest: (() => void) | null = null;

  // 保存当前任务的文件列表（用于智能迭代时传递给后端）
  let currentFiles: UploadedFileInfo[] = [];

  // 渲染列表（每个元素包含响应式数据）
  const renderItems = ref<RenderItem[]>([]);

  // 初始化子模块
  const messageManager = useMessageManager({ renderItems });
  const sseHandler = useSSEHandler({ renderItems, messageManager });
  const smartIterate = useSmartIterate({ renderItems, isLoading });
  const feedback = useFeedback({ renderItems, taskId: currentTaskId });

  const setTaskId = (newTaskId: string) => {
    currentTaskId.value = newTaskId;
    historyLoaded.value = false;
    currentFiles = [];
  };

  const scrollToBottom = async () => {
    await nextTick();
    setTimeout(() => {
      onScrollToBottom?.();
    }, 0);
  };

  // 强制滚动到底部（用户发送消息后使用）
  const forceScrollToBottom = async () => {
    await nextTick();
    setTimeout(() => {
      onForceScrollToBottom?.();
    }, 0);
  };

  // 节流滚动（每次调用都会检查 autoScrollEnabled，由 ChatMessageList 控制）
  let throttleTimer: ReturnType<typeof setTimeout> | null = null;

  const throttledScrollToBottom = async () => {
    // 如果已经有定时器在等待，不重复设置
    if (throttleTimer) return;

    // 立即执行一次滚动
    await scrollToBottom();

    // 设置节流定时器，500ms 内不再触发
    throttleTimer = setTimeout(() => {
      throttleTimer = null;
    }, 500);
  };

  const getToken = () => localStorage.getItem('forgeToken') || '';

  /**
   * 加载历史消息
   */
  const loadHistory = async () => {
    if (historyLoaded.value) return;

    isLoading.value = true;
    sseHandler.setCurrentStreamItem(null);

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

          // 从历史消息中恢复文件信息（取最后一条用户消息的文件）
          for (let i = historyMessages.length - 1; i >= 0; i--) {
            const msg = historyMessages[i];
            if (msg && msg.role === 'user' && msg.files && msg.files.length > 0) {
              currentFiles = msg.files;
              break;
            }
          }

          await scrollToBottom();
        } else {
          // 处理流式消息（任务正在运行时）
          sseHandler.handleSSEChunk(chunk);
          await throttledScrollToBottom();
        }
      },
      onComplete: async () => {
        isLoading.value = false;
        historyLoaded.value = true;
        abortCurrentRequest = null;
        sseHandler.setCurrentStreamItem(null);

        // 批量获取反馈状态
        await feedback.loadFeedbackStatus();
      },
      onError: (error) => {
        console.error('加载历史消息失败:', error.message);
        isLoading.value = false;
        abortCurrentRequest = null;
        sseHandler.setCurrentStreamItem(null);
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

    // 保存文件列表（用于智能迭代时传递）
    if (files && files.length > 0) {
      currentFiles = files;
    }

    // 添加用户消息（包含文件信息）
    messageManager.addUserMessage(content, files);
    await forceScrollToBottom();

    isLoading.value = true;
    isStreaming.value = true; // LLM 正在生成
    sseHandler.setCurrentStreamItem(null);

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
        sseHandler.handleSSEChunk(chunk);
        await throttledScrollToBottom();
      },
      onComplete: async () => {
        isLoading.value = false;
        isStreaming.value = false;
        abortCurrentRequest = null;
        sseHandler.setCurrentStreamItem(null);
        await scrollToBottom();
        const taskStore = useTaskStore();
        taskStore.touchTask(currentTaskId.value);
      },
      onError: (error) => {
        messageManager.addTextMessage('error', `请求失败：${error.message}`);
        isLoading.value = false;
        isStreaming.value = false;
        abortCurrentRequest = null;
        sseHandler.setCurrentStreamItem(null);
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
        // 新创建的任务是自己的
        taskStore.isOwnTask = true;
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
    messageManager.clearMessages();
    historyLoaded.value = false;
    sseHandler.setCurrentStreamItem(null);
  };

  /**
   * 断开前端 SSE 连接（不中断后端 LLM）
   * 用于切换页面、组件销毁等场景
   */
  const disconnectStream = () => {
    // 中断前端的流式请求
    if (abortCurrentRequest) {
      abortCurrentRequest();
      abortCurrentRequest = null;
    }

    // 结束当前流式消息的状态（但不标记为已中断，因为后端还在运行）
    sseHandler.endCurrentStream();

    // 重置前端状态
    isLoading.value = false;
    isStreaming.value = false;
  };

  /**
   * 取消请求并中断后端 LLM 调用
   * 用于用户手动点击中断按钮
   */
  const cancelRequest = async () => {
    // 先中断前端的流式请求
    if (abortCurrentRequest) {
      abortCurrentRequest();
      abortCurrentRequest = null;
    }

    // 结束当前流式消息的状态，并标记为已中断
    sseHandler.markCurrentStreamAborted();

    // 插入模拟的 turn_end 消息（不含 token 数据，等用户刷新后从数据库加载真实数据）
    const turnEndId = `turn_end_${getNextIdCounter()}`;
    const turnEndData: TurnEndMessageData = {
      id: turnEndId,
      type: 'turn_end',
      completedAt: new Date().toISOString(),
      // 不设置 accumulatedTokens，前端会隐藏 token 显示
    };
    renderItems.value.push({
      id: turnEndId,
      type: 'turn_end',
      data: turnEndData,
    });

    // 重置状态
    isLoading.value = false;
    isStreaming.value = false;

    // 调用后端 API 中断 LLM 调用（节省 token）
    try {
      console.log('[useChat] 调用后端中断 API, taskId:', currentTaskId.value);
      const result = await abortTask(currentTaskId.value);
      console.log('[useChat] 中断结果:', result);
    } catch (error) {
      console.warn('[useChat] 中断任务失败:', error);
    }
  };

  /**
   * 发送智能迭代回复
   * @param answer 用户对澄清问题的回复
   */
  const sendSmartIterateReply = async (answer: string) => {
    console.log('[useChat] sendSmartIterateReply 被调用, answer:', answer);
    if (!answer.trim() || isLoading.value) {
      console.log('[useChat] 跳过发送: answer为空或正在加载', {
        answer: answer.trim(),
        isLoading: isLoading.value,
      });
      return;
    }

    // 获取迭代上下文
    const iterateContext = smartIterate.getSmartIterateContext();
    console.log('[useChat] 智能迭代上下文:', iterateContext);
    if (!iterateContext.originalPrompt) {
      console.error('[useChat] 无法获取智能迭代上下文，originalPrompt 为空');
      return;
    }

    // 添加用户回复消息到界面
    messageManager.addUserAnswerMessage(answer);
    await forceScrollToBottom();

    isLoading.value = true;
    isStreaming.value = true; // LLM 正在生成
    sseHandler.setCurrentStreamItem(null);

    // 从 localStorage 读取深度思考状态
    const enableThinking = localStorage.getItem('enableThinking') === 'true';

    // 构建请求体，带上迭代上下文、深度思考状态和文件列表
    const body: Record<string, unknown> = {
      content: answer,
      enhanceMode: 'smart' as const,
      iterateContext,
      enableThinking,
    };

    // 如果有文件，添加到请求体
    if (currentFiles && currentFiles.length > 0) {
      body.files = currentFiles;
    }

    const { abort, promise } = createStreamRequest<TaskSSEChunk>({
      url: `${API_BASE}/task/${currentTaskId.value}/message`,
      body,
      headers: { Authorization: `Bearer ${getToken()}` },
      onChunk: async (chunk) => {
        sseHandler.handleSSEChunk(chunk);
        await throttledScrollToBottom();
      },
      onComplete: async () => {
        isLoading.value = false;
        isStreaming.value = false;
        abortCurrentRequest = null;
        sseHandler.setCurrentStreamItem(null);
        await scrollToBottom();
        const taskStore = useTaskStore();
        taskStore.touchTask(currentTaskId.value);
      },
      onError: (error) => {
        messageManager.addTextMessage('error', `请求失败：${error.message}`);
        isLoading.value = false;
        isStreaming.value = false;
        abortCurrentRequest = null;
        sseHandler.setCurrentStreamItem(null);
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
    isStreaming,

    // 方法
    init,
    setTaskId,
    loadHistory,
    sendMessage,
    handleSend,
    clearMessages,
    cancelRequest,
    disconnectStream,
    scrollToBottom,
    // 智能迭代相关
    needsSmartIterateReply: smartIterate.needsSmartIterateReply,
    sendSmartIterateReply,
    // 反馈相关
    updateFeedbackStatus: feedback.updateFeedbackStatus,
  };
}
