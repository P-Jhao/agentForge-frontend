/**
 * MCP 相关类型定义
 */

// MCP 传输方式类型
export type MCPTransportType = 'stdio' | 'sse' | 'streamableHttp';

// MCP 来源类型（固定为 builtin）
export type MCPSource = 'builtin';

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

// MCP 基础类型
export interface MCP {
  id: number;
  name: string;
  description: string | null;
  transportType: MCPTransportType;
  connectionUrl: string;
  userId: number;
  source: MCPSource;
  isPublic: boolean;
  timeout: number | null;
  headers: string | null;
  remarks: string | null;
  example: string | null;
  status: MCPStatus;
  createdAt: string;
  updatedAt: string;
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
}

// 创建 MCP 参数
export interface CreateMCPParams {
  name: string;
  transportType: MCPTransportType;
  connectionUrl: string;
  description?: string;
  timeout?: number;
  headers?: string;
  remarks?: string;
  example?: string;
}

// 更新 MCP 参数
export interface UpdateMCPParams {
  name?: string;
  transportType?: MCPTransportType;
  connectionUrl?: string;
  description?: string;
  timeout?: number;
  headers?: string;
  remarks?: string;
  example?: string;
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
