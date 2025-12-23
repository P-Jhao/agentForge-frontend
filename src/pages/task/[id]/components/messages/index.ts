/**
 * 消息组件映射表
 * 根据消息类型动态渲染对应组件
 */
import type { Component } from 'vue';
import type { MessageType } from '@/composable/task/useChat';

import UserMessage from './UserMessage.vue';
import ChatTextMessage from './ChatTextMessage.vue';
import ThinkingMessage from './ThinkingMessage.vue';
import ToolCallMessage from './ToolCallMessage.vue';
import SummaryMessage from './SummaryMessage.vue';
import ErrorMessage from './ErrorMessage.vue';
// 提示词增强相关组件
import EnhanceProcessCard from './EnhanceProcessCard.vue';
import ExpertAnalysisCard from './ExpertAnalysisCard.vue';
import EnhancedPromptBubble from './EnhancedPromptBubble.vue';
import UserOriginalMessage from './UserOriginalMessage.vue';
import UserAnswerMessage from './UserAnswerMessage.vue';

// 消息类型到组件的映射
export const messageComponents: Record<MessageType, Component> = {
  user: UserMessage,
  chat: ChatTextMessage,
  thinking: ThinkingMessage,
  tool_call: ToolCallMessage,
  summary: SummaryMessage,
  error: ErrorMessage,
  // 提示词增强相关类型
  user_original: UserOriginalMessage,
  user_answer: UserAnswerMessage,
  reviewer: EnhanceProcessCard,
  questioner: EnhanceProcessCard,
  expert: ExpertAnalysisCard,
  enhancer: EnhancedPromptBubble,
};

// 导出所有消息组件
export {
  UserMessage,
  ChatTextMessage,
  ThinkingMessage,
  ToolCallMessage,
  SummaryMessage,
  ErrorMessage,
  // 提示词增强相关组件
  EnhanceProcessCard,
  ExpertAnalysisCard,
  EnhancedPromptBubble,
  UserOriginalMessage,
  UserAnswerMessage,
};
