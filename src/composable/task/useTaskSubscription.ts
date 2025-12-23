/**
 * 任务状态订阅 composable
 * 管理全局 SSE 连接，接收任务状态实时推送
 */
import { ref, onBeforeUnmount } from 'vue';
import { useTaskStore } from '@/stores';

// API 基础路径
const API_BASE = import.meta.env.VITE_API_BASE || '';

// SSE 事件类型
interface TaskSSEEvent {
  type: 'connected' | 'status_change' | 'task_update' | 'title_update' | 'mcp:status_change';
  taskUuid?: string;
  mcpId?: number;
  data?: {
    status?: string;
    updatedAt?: string;
    title?: string;
    name?: string;
  };
}

// 连接状态
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * 任务状态订阅 composable
 */
export function useTaskSubscription() {
  // 连接状态
  const status = ref<ConnectionStatus>('disconnected');

  // EventSource 实例
  let eventSource: EventSource | null = null;

  // 重连定时器
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // 重连次数
  let reconnectCount = 0;
  const MAX_RECONNECT_COUNT = 5;
  const RECONNECT_DELAY = 3000; // 3 秒

  /**
   * 获取 token
   */
  const getToken = () => localStorage.getItem('forgeToken') || '';

  /**
   * 建立 SSE 连接
   */
  const connect = () => {
    // 如果已经连接或正在连接，不重复连接
    if (status.value === 'connected' || status.value === 'connecting') {
      return;
    }

    const token = getToken();
    if (!token) {
      console.warn('[TaskSubscription] 未登录，不建立 SSE 连接');
      return;
    }

    status.value = 'connecting';

    // 创建 EventSource（需要通过 URL 传递 token，因为 EventSource 不支持自定义 header）
    // 这里使用 fetch + ReadableStream 替代 EventSource，以支持 Authorization header
    const url = `${API_BASE}/task/subscribe`;

    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        status.value = 'connected';
        reconnectCount = 0;
        console.log('[TaskSubscription] SSE 连接成功');

        // 读取流
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('无法获取响应流');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        const read = async () => {
          try {
            const { done, value } = await reader.read();

            if (done) {
              console.log('[TaskSubscription] SSE 连接关闭');
              handleDisconnect();
              return;
            }

            // 解码并处理数据
            buffer += decoder.decode(value, { stream: true });

            // 按行分割处理
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // 保留最后一个不完整的行

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6);
                try {
                  const event = JSON.parse(jsonStr) as TaskSSEEvent;
                  handleEvent(event);
                } catch {
                  // 忽略解析错误（可能是心跳）
                }
              }
            }

            // 继续读取
            read();
          } catch (error) {
            console.error('[TaskSubscription] 读取流错误:', error);
            handleDisconnect();
          }
        };

        read();
      })
      .catch((error) => {
        console.error('[TaskSubscription] SSE 连接失败:', error);
        status.value = 'error';
        scheduleReconnect();
      });
  };

  /**
   * 处理 SSE 事件
   */
  const handleEvent = (event: TaskSSEEvent) => {
    const taskStore = useTaskStore();

    switch (event.type) {
      case 'connected':
        console.log('[TaskSubscription] 收到连接确认');
        break;

      case 'status_change':
        if (event.taskUuid && event.data) {
          console.log(`[TaskSubscription] 任务 ${event.taskUuid} 状态变化:`, event.data);
          // 更新本地任务状态
          taskStore.updateLocalTask(event.taskUuid, {
            status: event.data.status as 'running' | 'completed' | 'cancelled',
            updatedAt: event.data.updatedAt || new Date().toISOString(),
          });
        }
        break;

      case 'task_update':
        if (event.taskUuid && event.data) {
          console.log(`[TaskSubscription] 任务 ${event.taskUuid} 更新:`, event.data);
          // 构建更新数据，确保类型正确
          const updateData: Record<string, unknown> = {};
          if (event.data.title) updateData.title = event.data.title;
          if (event.data.updatedAt) updateData.updatedAt = event.data.updatedAt;
          if (event.data.status) {
            updateData.status = event.data.status as 'running' | 'completed' | 'cancelled';
          }
          taskStore.updateLocalTask(event.taskUuid, updateData);
        }
        break;

      case 'title_update':
        if (event.taskUuid && event.data?.title) {
          // 使用打字机效果更新标题
          taskStore.updateTaskTitleWithTypewriter(event.taskUuid, event.data.title);
        }
        break;

      case 'mcp:status_change':
        if (event.mcpId && event.data) {
          console.log(`[TaskSubscription] MCP ${event.mcpId} 状态变化:`, event.data);
          // 触发自定义事件，让 MCP 相关组件监听
          window.dispatchEvent(
            new CustomEvent('mcp:status_change', {
              detail: {
                mcpId: event.mcpId,
                status: event.data.status,
                name: event.data.name,
              },
            })
          );
        }
        break;
    }
  };

  /**
   * 处理断开连接
   */
  const handleDisconnect = () => {
    status.value = 'disconnected';
    scheduleReconnect();
  };

  /**
   * 安排重连
   */
  const scheduleReconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    if (reconnectCount >= MAX_RECONNECT_COUNT) {
      console.warn('[TaskSubscription] 达到最大重连次数，停止重连');
      status.value = 'error';
      return;
    }

    reconnectCount++;
    console.log(
      `[TaskSubscription] ${RECONNECT_DELAY / 1000} 秒后尝试第 ${reconnectCount} 次重连...`
    );

    reconnectTimer = setTimeout(() => {
      connect();
    }, RECONNECT_DELAY);
  };

  /**
   * 断开连接
   */
  const disconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }

    status.value = 'disconnected';
    console.log('[TaskSubscription] SSE 连接已断开');
  };

  /**
   * 重置重连计数（用于手动重连）
   */
  const resetReconnect = () => {
    reconnectCount = 0;
  };

  // 组件卸载时断开连接
  onBeforeUnmount(() => {
    disconnect();
  });

  return {
    status,
    connect,
    disconnect,
    resetReconnect,
  };
}
