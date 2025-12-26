/**
 * 自动操作状态管理
 * 管理智能路由的自动操作流程状态
 */
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import type {
  OperationStage,
  IntentResult,
  GeneratedForgeConfig,
  ConfigGeneratingState,
  ConfigFieldName,
  UploadedFileInfo,
} from '@/types';
import type { EnhanceMode } from '@/utils/enhanceMode';

// 阶段文本映射（本地定义，避免循环依赖）
const stageTextMap: Record<OperationStage, string> = {
  idle: '',
  analyzing: '正在分析您的需求...',
  navigating: '正在为您定位...',
  creating: '正在创建 Forge...',
  typing: '正在输入...',
  sending: '正在发送...',
};

// 初始配置生成状态
const createInitialConfigState = (): ConfigGeneratingState => ({
  name: { status: 'pending', content: '' },
  description: { status: 'pending', content: '' },
  systemPrompt: { status: 'pending', content: '' },
});

export const useAutoOperationStore = defineStore('autoOperation', () => {
  // ========== 状态 ==========

  // 是否正在执行自动操作
  const isActive = ref(false);

  // 当前操作阶段
  const stage = ref<OperationStage>('idle');

  // 用户原始输入
  const originalQuery = ref('');

  // 用户上传的文件
  const originalFiles = ref<UploadedFileInfo[]>([]);

  // 用户选择的深度思考设置
  const enableThinking = ref<boolean>(false);

  // 用户选择的增强模式
  const enhanceMode = ref<EnhanceMode>('off');

  // 意图分析结果
  const intentResult = ref<IntentResult | null>(null);

  // 生成的 Forge 配置（用于自动创建）
  const forgeConfig = ref<GeneratedForgeConfig | null>(null);

  // 配置生成状态
  const configGenerating = ref<ConfigGeneratingState>(createInitialConfigState());

  // 当前操作会话 ID（用于取消操作）
  const sessionId = ref<string | null>(null);

  // 定时器和动画清理函数列表
  const cleanupFunctions = ref<Array<() => void>>([]);

  // ========== 计算属性 ==========

  // 阶段显示文本
  const stageText = computed(() => stageTextMap[stage.value]);

  // 是否正在分析
  const isAnalyzing = computed(() => stage.value === 'analyzing');

  // 是否正在生成配置
  const isGeneratingConfig = computed(() => {
    const { name, description, systemPrompt } = configGenerating.value;
    return (
      name.status === 'streaming' ||
      description.status === 'streaming' ||
      systemPrompt.status === 'streaming'
    );
  });

  // 配置是否全部生成完成
  const isConfigComplete = computed(() => {
    const { name, description, systemPrompt } = configGenerating.value;
    return (
      name.status === 'done' && description.status === 'done' && systemPrompt.status === 'done'
    );
  });

  // ========== 方法 ==========

  /**
   * 开始自动操作
   * @param query 用户原始输入
   * @param files 用户上传的文件
   * @param thinking 是否启用深度思考
   * @param enhance 增强模式
   * @returns 生成的 sessionId
   */
  function startOperation(
    query: string,
    files?: UploadedFileInfo[],
    thinking?: boolean,
    enhance?: EnhanceMode
  ): string {
    // 生成唯一的 sessionId
    const newSessionId = uuidv4();

    isActive.value = true;
    stage.value = 'analyzing';
    originalQuery.value = query;
    originalFiles.value = files || [];
    enableThinking.value = thinking ?? false;
    enhanceMode.value = enhance ?? 'off';
    intentResult.value = null;
    forgeConfig.value = null;
    configGenerating.value = createInitialConfigState();
    sessionId.value = newSessionId;
    cleanupFunctions.value = [];

    return newSessionId;
  }

  /**
   * 设置操作阶段
   */
  function setStage(newStage: OperationStage) {
    stage.value = newStage;
  }

  /**
   * 设置意图分析结果
   */
  function setIntentResult(result: IntentResult) {
    intentResult.value = result;
  }

  /**
   * 更新配置字段状态
   */
  function updateConfigField(
    field: ConfigFieldName,
    status: 'pending' | 'streaming' | 'done',
    content?: string
  ) {
    configGenerating.value[field].status = status;
    if (content !== undefined) {
      configGenerating.value[field].content = content;
    }
  }

  /**
   * 追加配置字段内容（用于流式数据）
   */
  function appendConfigContent(field: ConfigFieldName, chunk: string) {
    configGenerating.value[field].content += chunk;
  }

  /**
   * 设置最终的 Forge 配置
   */
  function setForgeConfig(config: GeneratedForgeConfig) {
    forgeConfig.value = config;
  }

  /**
   * 注册清理函数（用于取消时清理定时器和动画）
   */
  function registerCleanup(cleanup: () => void) {
    cleanupFunctions.value.push(cleanup);
  }

  /**
   * 取消操作并清理状态
   */
  function cancelOperation() {
    // 执行所有清理函数
    for (const cleanup of cleanupFunctions.value) {
      try {
        cleanup();
      } catch (error) {
        console.error('清理函数执行失败:', error);
      }
    }

    // 重置状态
    resetState();
  }

  /**
   * 完成操作
   */
  function completeOperation() {
    // 执行清理但保留结果
    for (const cleanup of cleanupFunctions.value) {
      try {
        cleanup();
      } catch (error) {
        console.error('清理函数执行失败:', error);
      }
    }

    isActive.value = false;
    stage.value = 'idle';
    cleanupFunctions.value = [];
  }

  /**
   * 重置状态
   */
  function resetState() {
    isActive.value = false;
    stage.value = 'idle';
    originalQuery.value = '';
    originalFiles.value = [];
    enableThinking.value = false;
    enhanceMode.value = 'off';
    intentResult.value = null;
    forgeConfig.value = null;
    configGenerating.value = createInitialConfigState();
    sessionId.value = null;
    cleanupFunctions.value = [];
  }

  return {
    // 状态
    isActive,
    stage,
    originalQuery,
    originalFiles,
    enableThinking,
    enhanceMode,
    intentResult,
    forgeConfig,
    configGenerating,
    sessionId,

    // 计算属性
    stageText,
    isAnalyzing,
    isGeneratingConfig,
    isConfigComplete,

    // 方法
    startOperation,
    setStage,
    setIntentResult,
    updateConfigField,
    appendConfigContent,
    setForgeConfig,
    registerCleanup,
    cancelOperation,
    completeOperation,
    resetState,
  };
});
