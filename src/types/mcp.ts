/**
 * MCP 相关类型定义
 */

// MCP 传输方式类型
export type MCPTransportType = 'stdio' | 'sse' | 'streamableHttp';

// MCP 来源类型
export type MCPSource = 'builtin' | 'user';

// MCP 列表筛选类型
export type MCPFilterType = 'all' | 'builtin' | 'mine' | 'other';

// MCP 连接状态
// connected: 连通成功
// disconnected: 连通失败（可重连）
// closed: 管理员主动关闭（普通用户不可见）
export type MCPStatus = 'connected' | 'disconnected' | 'closed';

// MCP 工具接口
export interface MCPTool {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
}

// 工具路径配置类型
export type ToolPathType = 'output' | 'input' | null;
export type ToolPathConfig = Record<string, Record<string, ToolPathType>>;

// MCP 创建者信息
export interface MCPCreator {
  id: number;
  nickname: string;
}

// MCP 基础类型
export interface MCP {
  id: number;
  name: string;
  description: string | null;
  transportType: MCPTransportType;
  // stdio 类型使用
  command: string | null;
  args: string | null; // JSON 数组格式
  env: string | null; // JSON 对象格式
  // sse/streamableHttp 类型使用
  url: string | null;
  headers: string | null; // JSON 对象格式
  userId: number;
  source: MCPSource;
  isPublic: boolean;
  timeout: number | null;
  remarks: string | null;
  example: string | null;
  status: MCPStatus;
  createdAt: string;
  updatedAt: string;
  // 创建者信息（列表查询时返回）
  user?: MCPCreator;
}

// MCP 关联的 Forge 信息
export interface MCPAssociatedForge {
  id: number;
  displayName: string;
  avatar: string | null;
  description: string | null;
  source: 'builtin' | 'user';
  usageCount: number;
}

// MCP 详情（含关联 Forge、工具列表）
export interface MCPDetail extends MCP {
  associatedForges: MCPAssociatedForge[];
  tools: MCPTool[];
  toolPathConfig: ToolPathConfig | null;
}

// 创建 MCP 参数
export interface CreateMCPParams {
  name: string;
  transportType: MCPTransportType;
  // stdio 类型使用
  command?: string;
  args?: string; // JSON 数组格式
  env?: string; // JSON 对象格式
  // sse/streamableHttp 类型使用
  url?: string;
  headers?: string; // JSON 对象格式
  description?: string;
  timeout?: number;
  remarks?: string;
  example?: string;
  isPublic?: boolean; // 是否公开，默认私有
}

// 更新 MCP 参数
export interface UpdateMCPParams {
  name?: string;
  transportType?: MCPTransportType;
  // stdio 类型使用
  command?: string;
  args?: string; // JSON 数组格式
  env?: string; // JSON 对象格式
  // sse/streamableHttp 类型使用
  url?: string;
  headers?: string; // JSON 对象格式
  description?: string;
  timeout?: number;
  remarks?: string;
  example?: string;
  isPublic?: boolean; // 是否公开
}

// 删除 MCP 响应
export interface DeleteMCPResult {
  affectedForgeCount: number;
}

// 重连 MCP 响应
export interface ReconnectMCPResult {
  status: MCPStatus;
}

// 验证 Forge 公开时的 MCP 合规性响应
export interface ValidateForgePublishResult {
  valid: boolean;
  invalidMcps: string[];
}
