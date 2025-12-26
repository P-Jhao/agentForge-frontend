/**
 * 自动操作流程 composable
 * 封装智能路由的自动导航和自动创建流程
 */
import { ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useMessage } from 'naive-ui';
import { useAutoOperationStore } from '@/stores';
import { useTypewriter } from './useTypewriter';
import { useHighlight } from './useHighlight';
import { analyzeIntent, cancelIntent, generateForgeConfig } from '@/utils/intentApi';
import type {
  ForgeIntentResult,
  MCPIntentResult,
  ConfigFieldName,
  IntentEventHandlers,
  UploadedFileInfo,
} from '@/types';
import type { EnhanceMode } from '@/utils/enhanceMode';

// ==================== 动画时间配置 ====================
// 基础延迟单位（毫秒），调整此值可统一控制所有动画速度
const BASE_DELAY = 300;

// 各场景延迟倍数
const DELAY_MULTIPLIER = {
  pageTransition: 2.5, // 页面跳转后等待（让用户看清）
  searchUpdate: 1.5, // 搜索结果更新
  highlightDuration: 2, // 高亮效果持续时间
  afterHighlight: 1, // 高亮后短暂等待
  afterTyping: 1.2, // 打字完成后等待
  beforeSubmit: 1, // 提交前等待
  mcpSelect: 1.2, // MCP 选择间隔
};

// 计算实际延迟时间
const getDelay = (multiplier: keyof typeof DELAY_MULTIPLIER) =>
  BASE_DELAY * DELAY_MULTIPLIER[multiplier];

/**
 * 自动操作流程 composable
 */
export function useAutoOperation() {
  const router = useRouter();
  const message = useMessage();
  const autoOperationStore = useAutoOperationStore();
  const { highlight, getCleanup: getHighlightCleanup } = useHighlight();

  // 是否已取消
  const isCancelled = ref(false);

  // 配置生成的 AbortController
  let configAbortController: AbortController | null = null;

  /**
   * 可取消的等待函数
   * 每 50ms 检查一次取消状态，响应更及时
   */
  const wait = (ms: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const checkInterval = 50; // 每 50ms 检查一次
      let elapsed = 0;

      const timer = setInterval(() => {
        elapsed += checkInterval;

        if (isCancelled.value) {
          clearInterval(timer);
          reject(new Error('操作已取消'));
          return;
        }

        if (elapsed >= ms) {
          clearInterval(timer);
          resolve();
        }
      }, checkInterval);

      // 注册清理函数
      autoOperationStore.registerCleanup(() => clearInterval(timer));
    });
  };

  /**
   * 可取消的等待元素出现
   */
  const waitForElement = async (selector: string, timeout = 5000): Promise<HTMLElement | null> => {
    const checkInterval = 100;
    let elapsed = 0;

    while (elapsed < timeout) {
      if (isCancelled.value) {
        throw new Error('操作已取消');
      }

      const element = document.querySelector<HTMLElement>(selector);
      if (element) return element;

      await new Promise((resolve) => setTimeout(resolve, checkInterval));
      elapsed += checkInterval;
    }

    return null;
  };

  /**
   * 使用打字机效果填充输入框
   * @param element 输入框元素
   * @param text 要输入的文本
   */
  const typeIntoInput = async (
    element: HTMLInputElement | HTMLTextAreaElement,
    text: string
  ): Promise<void> => {
    const value = ref('');

    return new Promise<void>((resolve) => {
      const { start, getCleanup } = useTypewriter(value, {
        onComplete: () => {
          // 同步到实际输入框
          element.value = value.value;
          // 触发 input 事件以更新 Vue 响应式数据
          element.dispatchEvent(new Event('input', { bubbles: true }));
          resolve();
        },
      });

      // 注册清理函数
      autoOperationStore.registerCleanup(getCleanup());

      // 开始打字
      start(text);
    });
  };

  /**
   * 检查是否已取消，如果取消则抛出错误
   */
  const checkCancelled = () => {
    if (isCancelled.value) {
      throw new Error('操作已取消');
    }
  };

  /**
   * 取消当前操作
   */
  const cancel = async () => {
    isCancelled.value = true;

    // 取消配置生成请求
    if (configAbortController) {
      configAbortController.abort();
      configAbortController = null;
    }

    // 调用取消 API
    const sessionId = autoOperationStore.sessionId;
    if (sessionId) {
      try {
        await cancelIntent({ sessionId });
      } catch (error) {
        console.warn('取消 API 调用失败:', error);
      }
    }

    // 清理 store 状态
    autoOperationStore.cancelOperation();
  };

  /**
   * 执行自动导航流程
   * 流程：广场 → 搜索 → 高亮 → 跳转 → 打字 → 发送
   */
  const executeAutoNavigation = async (result: ForgeIntentResult): Promise<void> => {
    const { forgeId, forgeName, originalQuery } = result;

    try {
      // 1. 跳转到 Forge 广场
      autoOperationStore.setStage('navigating');
      await router.push('/forge/plaza');
      await nextTick();
      await wait(getDelay('pageTransition'));
      checkCancelled();

      // 2. 使用打字机效果在搜索框中输入 Forge 名称
      autoOperationStore.setStage('typing');
      const searchInput = await waitForElement('[data-auto-search-input] input');
      if (!searchInput) {
        throw new Error('未找到搜索输入框');
      }

      // 注册高亮清理函数
      autoOperationStore.registerCleanup(getHighlightCleanup());

      // 打字机效果输入
      await typeIntoInput(searchInput as HTMLInputElement, forgeName);

      checkCancelled();
      await wait(getDelay('searchUpdate'));

      // 3. 高亮目标 Forge 卡片
      const forgeCard = await waitForElement(`[data-forge-id="${forgeId}"]`);
      if (!forgeCard) {
        throw new Error(`未找到 Forge 卡片: ${forgeName}`);
      }

      await highlight(forgeCard, { duration: getDelay('highlightDuration') });
      checkCancelled();
      await wait(getDelay('afterHighlight'));

      // 4. 跳转到 Forge 对话页面
      autoOperationStore.setStage('navigating');
      await router.push(`/forge/${forgeId}`);
      await nextTick();
      await wait(getDelay('pageTransition'));
      checkCancelled();

      // 5. 使用打字机效果填充输入框
      autoOperationStore.setStage('typing');
      // NInput 的 data 属性在包装 div 上，需要选择内部的 textarea
      const chatInput = await waitForElement('[data-auto-chat-input] textarea');
      if (!chatInput) {
        throw new Error('未找到聊天输入框');
      }

      await typeIntoInput(chatInput as HTMLTextAreaElement, originalQuery);

      checkCancelled();
      await wait(getDelay('afterTyping'));

      // 6. 高亮发送按钮并触发发送
      autoOperationStore.setStage('sending');
      const sendButton = await waitForElement('[data-auto-send-btn]');
      if (sendButton) {
        await highlight(sendButton, { duration: getDelay('highlightDuration') });
        checkCancelled();
        // 通过自定义事件触发发送，而不是模拟点击
        window.dispatchEvent(new CustomEvent('auto-operation-send'));
      }

      // 完成
      autoOperationStore.completeOperation();
    } catch (error) {
      if ((error as Error).message !== '操作已取消') {
        console.error('自动导航失败:', error);
        message.error('自动导航失败，请手动操作');
      }
      autoOperationStore.cancelOperation();
    }
  };

  /**
   * 执行自动创建流程
   * 流程：广场 → 新建高亮 → 创建页 → 填充 → MCP 选择 → 提交 → 对话页 → 打字 → 发送
   */
  const executeAutoCreate = async (result: MCPIntentResult): Promise<void> => {
    const { mcpTools, originalQuery } = result;
    const sessionId = autoOperationStore.sessionId;

    if (!sessionId) {
      throw new Error('缺少 sessionId');
    }

    // 提取 mcpIds 用于配置生成（后端需要）
    const mcpIds = mcpTools.map((t) => t.mcpId);

    try {
      // 1. 跳转到 Forge 广场
      autoOperationStore.setStage('navigating');
      await router.push('/forge/plaza');
      await nextTick();
      await wait(getDelay('pageTransition'));
      checkCancelled();

      // 2. 高亮"新建 Forge"按钮
      const createButton = await waitForElement('[data-forge-create-btn]');
      if (!createButton) {
        throw new Error('未找到新建 Forge 按钮');
      }

      await highlight(createButton, { duration: getDelay('highlightDuration') });
      checkCancelled();
      await wait(getDelay('afterHighlight'));

      // 3. 跳转到创建页面
      await router.push('/forge/create');
      await nextTick();
      await wait(getDelay('pageTransition'));
      checkCancelled();

      // 4. 开始配置生成并填充表单
      autoOperationStore.setStage('creating');

      // 配置生成事件处理器
      const configHandlers: IntentEventHandlers = {
        onConfigStart: (field: ConfigFieldName) => {
          autoOperationStore.updateConfigField(field, 'streaming');
        },
        onConfigChunk: (field: ConfigFieldName, content: string) => {
          autoOperationStore.appendConfigContent(field, content);
          // 实时更新表单
          updateFormField(field, autoOperationStore.configGenerating[field].content);
        },
        onConfigDone: (field: ConfigFieldName, content: string) => {
          autoOperationStore.updateConfigField(field, 'done', content);
          updateFormField(field, content);
        },
        onConfigComplete: () => {
          // 配置生成完成，继续后续流程
          continueAfterConfigComplete();
        },
        onError: (errorMessage: string) => {
          message.error(`配置生成失败: ${errorMessage}`);
          autoOperationStore.cancelOperation();
        },
        onCancelled: () => {
          autoOperationStore.cancelOperation();
        },
      };

      // 发起配置生成请求
      configAbortController = generateForgeConfig(originalQuery, mcpIds, sessionId, (event) => {
        // 处理 SSE 事件
        const { type, content, message: errorMessage } = event;

        switch (type) {
          case 'name_start':
            configHandlers.onConfigStart?.('name');
            break;
          case 'name_chunk':
            if (content) configHandlers.onConfigChunk?.('name', content);
            break;
          case 'name_done':
            if (content) configHandlers.onConfigDone?.('name', content);
            break;
          case 'description_start':
            configHandlers.onConfigStart?.('description');
            break;
          case 'description_chunk':
            if (content) configHandlers.onConfigChunk?.('description', content);
            break;
          case 'description_done':
            if (content) configHandlers.onConfigDone?.('description', content);
            break;
          case 'systemPrompt_start':
            configHandlers.onConfigStart?.('systemPrompt');
            break;
          case 'systemPrompt_chunk':
            if (content) configHandlers.onConfigChunk?.('systemPrompt', content);
            break;
          case 'systemPrompt_done':
            if (content) configHandlers.onConfigDone?.('systemPrompt', content);
            break;
          case 'complete':
            configHandlers.onConfigComplete?.();
            break;
          case 'error':
            if (errorMessage) configHandlers.onError?.(errorMessage);
            break;
        }
      });

      // 存储 mcpTools 供后续使用
      autoOperationStore.setForgeConfig({
        name: '',
        description: '',
        systemPrompt: '',
        mcpTools,
      });
    } catch (error) {
      if ((error as Error).message !== '操作已取消') {
        console.error('自动创建失败:', error);
        message.error('自动创建失败，请手动操作');
      }
      autoOperationStore.cancelOperation();
    }
  };

  /**
   * 滚动元素到视野内
   */
  const scrollIntoViewIfNeeded = (element: Element) => {
    const rect = element.getBoundingClientRect();
    const isInViewport =
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth);

    if (!isInViewport) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  /**
   * 更新表单字段
   */
  const updateFormField = (field: ConfigFieldName, content: string) => {
    // 根据字段名找到对应的输入框并更新
    let selector = '';
    switch (field) {
      case 'name':
        selector = '.forge-form input[placeholder*="代码审计"]';
        break;
      case 'description':
        selector = '#forge-description-editor';
        break;
      case 'systemPrompt':
        selector = '#forge-system-prompt-editor';
        break;
    }

    if (selector) {
      const element = document.querySelector(selector);
      if (element) {
        // 确保元素在视野内
        scrollIntoViewIfNeeded(element);

        if (field === 'name') {
          // 普通输入框
          (element as HTMLInputElement).value = content;
          element.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          // Markdown 编辑器 - 需要通过 Vue 组件更新
          // 这里通过自定义事件通知 ForgeForm 组件
          window.dispatchEvent(
            new CustomEvent('forge-form-update', {
              detail: { field, content },
            })
          );
        }
      }
    }
  };

  /**
   * 配置生成完成后继续流程
   */
  const continueAfterConfigComplete = async () => {
    try {
      checkCancelled();

      const { forgeConfig } = autoOperationStore;
      const mcpTools = forgeConfig?.mcpTools || [];

      // 5. 滚动到 MCP 工具区域并点击添加按钮
      autoOperationStore.setStage('creating');
      await wait(getDelay('searchUpdate'));

      // 找到"添加 MCP"按钮
      const addMcpButton = await waitForElement('[data-auto-add-mcp-btn]');
      if (!addMcpButton) {
        throw new Error('未找到添加 MCP 按钮');
      }

      // 滚动到视野内
      scrollIntoViewIfNeeded(addMcpButton);
      await wait(getDelay('afterHighlight'));

      // 高亮并点击添加按钮
      await highlight(addMcpButton, { duration: getDelay('highlightDuration') });
      checkCancelled();
      addMcpButton.click();

      // 等待弹窗打开
      await wait(getDelay('pageTransition'));
      checkCancelled();

      // 6. 在弹窗中精准选择 MCP 工具（每个 MCP 需要单独确认）
      for (let i = 0; i < mcpTools.length; i++) {
        const mcpTool = mcpTools[i];
        if (!mcpTool) continue;

        const { mcpId, toolNames } = mcpTool;
        checkCancelled();

        // 如果不是第一个 MCP，需要重新打开弹窗
        if (i > 0) {
          // 重新点击"添加 MCP"按钮打开弹窗
          const addMcpBtnAgain = await waitForElement('[data-auto-add-mcp-btn]');
          if (addMcpBtnAgain) {
            addMcpBtnAgain.click();
            await wait(getDelay('pageTransition'));
            checkCancelled();
          }
        }

        // 通过自定义事件通知组件选择指定的 MCP 和工具
        window.dispatchEvent(
          new CustomEvent('auto-operation-select-tools', {
            detail: { mcpId, toolNames },
          })
        );

        // 等待工具列表加载和选择完成
        await wait(getDelay('pageTransition'));
        await wait(getDelay('mcpSelect'));
        checkCancelled();

        // 确认添加当前 MCP 的工具
        window.dispatchEvent(new CustomEvent('auto-operation-confirm-mcp'));
        await wait(getDelay('searchUpdate'));
      }

      checkCancelled();

      // 8. 滚动到创建按钮并点击
      const submitButton = await waitForElement('[data-auto-submit-btn]');
      if (!submitButton) {
        throw new Error('未找到创建按钮');
      }

      scrollIntoViewIfNeeded(submitButton);
      await wait(getDelay('afterHighlight'));

      await highlight(submitButton, { duration: getDelay('highlightDuration') });
      checkCancelled();

      // 触发表单提交
      submitButton.click();

      // 等待创建完成并跳转
      // 监听路由变化
      const unwatch = router.afterEach(async (to) => {
        if (to.path.startsWith('/forge/') && to.path !== '/forge/create') {
          unwatch();
          await handleAfterForgeCreated(to.params.id as string);
        }
      });
    } catch (error) {
      if ((error as Error).message !== '操作已取消') {
        console.error('自动创建后续流程失败:', error);
        message.error('自动创建失败，请手动操作');
      }
      autoOperationStore.cancelOperation();
    }
  };

  /**
   * Forge 创建成功后的处理
   */
  const handleAfterForgeCreated = async (_forgeId: string) => {
    // _forgeId 参数保留用于未来扩展
    void _forgeId;
    try {
      checkCancelled();
      await wait(getDelay('pageTransition'));

      // 使用打字机效果填充输入框
      autoOperationStore.setStage('typing');
      // NInput 的 data 属性在包装 div 上，需要选择内部的 textarea
      const chatInput = await waitForElement('[data-auto-chat-input] textarea');
      if (!chatInput) {
        throw new Error('未找到聊天输入框');
      }

      const originalQuery = autoOperationStore.originalQuery;
      await typeIntoInput(chatInput as HTMLTextAreaElement, originalQuery);

      checkCancelled();
      await wait(getDelay('afterTyping'));

      // 高亮发送按钮并触发发送
      autoOperationStore.setStage('sending');
      const sendButton = await waitForElement('[data-auto-send-btn]');
      if (sendButton) {
        await highlight(sendButton, { duration: getDelay('highlightDuration') });
        checkCancelled();
        // 通过自定义事件触发发送
        window.dispatchEvent(new CustomEvent('auto-operation-send'));
      }

      // 完成
      autoOperationStore.completeOperation();
    } catch (error) {
      if ((error as Error).message !== '操作已取消') {
        console.error('Forge 创建后处理失败:', error);
      }
      autoOperationStore.cancelOperation();
    }
  };

  /**
   * 处理不支持场景（需要工具但没有可用工具）
   * 显示提示后跳转到默认任务页
   */
  const handleNotSupported = async (originalQuery: string): Promise<void> => {
    // 显示友好提示
    message.warning('当前已有的 MCP 工具无法完成该功能，建议联系管理员新增所需功能', {
      duration: 5000,
    });

    // 等待一小段时间让用户看到提示
    await wait(1000);

    // 跳转到默认任务页（与智能路由关闭时行为一致）
    const taskId = generateUUID();
    sessionStorage.setItem(`task_${taskId}_init`, originalQuery);
    // 带上文件信息
    const files = autoOperationStore.originalFiles;
    if (files.length > 0) {
      sessionStorage.setItem(`task_${taskId}_file`, JSON.stringify(files));
    }
    // 带上深度思考设置
    if (autoOperationStore.enableThinking) {
      localStorage.setItem('enableThinking', 'true');
    }
    // 带上增强模式设置
    if (autoOperationStore.enhanceMode !== 'off') {
      sessionStorage.setItem(`task_${taskId}_enhanceMode`, autoOperationStore.enhanceMode);
    }
    await router.push(`/task/${taskId}`);

    // 完成操作
    autoOperationStore.completeOperation();
  };

  /**
   * 处理不需要工具的场景（LLM 可直接回答）
   * 显示提示后跳转到默认任务页
   */
  const handleNoToolNeeded = async (originalQuery: string): Promise<void> => {
    // 显示友好提示
    message.info('当前问题无需工具即可完成，已为您转到对话页面', {
      duration: 3000,
    });

    // 等待一小段时间让用户看到提示
    await wait(800);

    // 跳转到默认任务页
    const taskId = generateUUID();
    sessionStorage.setItem(`task_${taskId}_init`, originalQuery);
    // 带上文件信息
    const files = autoOperationStore.originalFiles;
    if (files.length > 0) {
      sessionStorage.setItem(`task_${taskId}_file`, JSON.stringify(files));
    }
    // 带上深度思考设置
    if (autoOperationStore.enableThinking) {
      localStorage.setItem('enableThinking', 'true');
    }
    // 带上增强模式设置
    if (autoOperationStore.enhanceMode !== 'off') {
      sessionStorage.setItem(`task_${taskId}_enhanceMode`, autoOperationStore.enhanceMode);
    }
    await router.push(`/task/${taskId}`);

    // 完成操作
    autoOperationStore.completeOperation();
  };

  /**
   * 生成 UUID
   */
  const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  /**
   * 执行智能路由流程
   * @param query 用户输入
   * @param files 用户上传的文件
   * @param enableThinking 是否启用深度思考
   * @param enhanceMode 增强模式
   * @returns sessionId
   */
  const executeSmartRouting = async (
    query: string,
    files?: UploadedFileInfo[],
    enableThinking?: boolean,
    enhanceMode?: EnhanceMode
  ): Promise<void> => {
    // 重置取消状态
    isCancelled.value = false;

    // 开始操作（保存文件信息和增强模式设置）
    const sessionId = autoOperationStore.startOperation(query, files, enableThinking, enhanceMode);

    try {
      // 统一意图分析（后端内部串行执行 Forge 匹配和 MCP 分析）
      autoOperationStore.setStage('analyzing');
      const result = await analyzeIntent({
        userInput: query,
        sessionId,
      });

      checkCancelled();
      autoOperationStore.setIntentResult(result);

      // 根据结果执行不同流程
      if (result.type === 'use_existing_forge') {
        // 找到匹配的 Forge，执行自动导航
        await executeAutoNavigation(result as ForgeIntentResult);
      } else if (result.type === 'create_forge') {
        // 找到可用的 MCP 工具，执行自动创建
        await executeAutoCreate(result as MCPIntentResult);
      } else if (result.type === 'no_tool_needed') {
        // 不需要工具，LLM 可直接回答
        await handleNoToolNeeded(query);
      } else {
        // 不支持的场景（需要工具但没有）
        await handleNotSupported(query);
      }
    } catch (error) {
      if ((error as Error).message !== '操作已取消') {
        console.error('智能路由执行失败:', error);
        message.error('智能路由执行失败，已切换到普通模式');

        // 回退到普通模式（带上文件和增强模式设置）
        const taskId = generateUUID();
        sessionStorage.setItem(`task_${taskId}_init`, query);
        const originalFiles = autoOperationStore.originalFiles;
        if (originalFiles.length > 0) {
          sessionStorage.setItem(`task_${taskId}_file`, JSON.stringify(originalFiles));
        }
        // 带上深度思考设置
        if (autoOperationStore.enableThinking) {
          localStorage.setItem('enableThinking', 'true');
        }
        // 带上增强模式设置
        if (autoOperationStore.enhanceMode !== 'off') {
          sessionStorage.setItem(`task_${taskId}_enhanceMode`, autoOperationStore.enhanceMode);
        }
        await router.push(`/task/${taskId}`);
      }
      autoOperationStore.cancelOperation();
    }
  };

  return {
    isCancelled,
    cancel,
    executeSmartRouting,
    executeAutoNavigation,
    executeAutoCreate,
    handleNotSupported,
    handleNoToolNeeded,
  };
}
