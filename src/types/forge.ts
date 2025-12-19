/**
 * Forge 相关类型定义
 */

// Forge 来源类型
export type ForgeSource = 'builtin' | 'user';

// Forge 筛选类型
export type ForgeFilter = 'all' | 'my' | 'builtin' | 'other';

// Forge 创建者信息
export interface ForgeCreator {
  id: number;
  username: string;
}

// Forge 类型
export interface Forge {
  id: number;
  displayName: string;
  description: string | null;
  systemPrompt: string | null;
  isActive: boolean;
  userId: number;
  source: ForgeSource;
  avatar: string | null;
  usageCount: number;
  isPublic: boolean;
  isFavorite: boolean;
  isOwner: boolean; // 是否为创建者
  summary: string | null; // AI 生成的能力摘要（用于自动匹配）
  createdAt: string;
  updatedAt: string;
  // 关联的创建者信息
  creator?: ForgeCreator;
}

// Forge 详情（包含权限信息和关联的 MCP）
export interface ForgeDetail extends Forge {
  isOwner: boolean; // 是否为创建者
  canEdit: boolean; // 是否可编辑（root 或自己创建的非内置）
  mcpIds: number[]; // 关联的 MCP ID 列表
  mcpTools?: MCPToolSelection[]; // 关联的 MCP 工具选择
}

// MCP 工具选择项（用于 Forge 关联）
export interface MCPToolSelection {
  mcpId: number;
  tools: Array<{
    name: string;
    description: string;
    inputSchema?: Record<string, unknown>;
  }>;
}

// 创建 Forge 参数
export interface CreateForgeParams {
  displayName: string;
  description?: string;
  systemPrompt?: string;
  avatar?: string;
  isPublic?: boolean;
  mcpIds?: number[];
  mcpTools?: MCPToolSelection[]; // 新增：MCP 工具选择
}

// 更新 Forge 参数
export interface UpdateForgeParams {
  displayName?: string;
  description?: string;
  systemPrompt?: string;
  avatar?: string;
  isPublic?: boolean;
  mcpIds?: number[];
  mcpTools?: MCPToolSelection[]; // 新增：MCP 工具选择
}

// 从 Forge 创建任务的响应
export interface CreateTaskFromForgeResult {
  taskUuid: string;
  forge: {
    id: number;
    systemPrompt: string | null;
  };
}

// 收藏的 Forge（侧边栏用，精简版）
export interface FavoriteForge {
  id: number;
  displayName: string;
  avatar: string | null;
  description: string | null;
  usageCount: number;
}
