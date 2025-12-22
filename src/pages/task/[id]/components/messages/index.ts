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

// 消息类型到组件的映射
export const messageComponents: Record<MessageType, Component> = {
  user: UserMessage,
  chat: ChatTextMessage,
  thinking: ThinkingMessage,
  tool_call: ToolCallMessage,
  summary: SummaryMessage,
  error: ErrorMessage,
};

// 导出所有消息组件
export {
  UserMessage,
  ChatTextMessage,
  ThinkingMessage,
  ToolCallMessage,
  SummaryMessage,
  ErrorMessage,
};
