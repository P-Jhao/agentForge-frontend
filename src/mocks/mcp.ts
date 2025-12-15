/**
 * MCP Mock 数据
 */

// MCP 来源类型
export type McpSource = 'official' | 'community' | 'custom';

// MCP 状态
export type McpStatus = 'online' | 'offline';

// MCP 数据结构
export interface McpItem {
  id: string;
  name: string;
  description: string;
  author: string;
  source: McpSource;
  status: McpStatus;
  tools: string[];
  createdAt: string;
  updatedAt: string;
}

// 自定义 MCP 列表
export const customMcpList: McpItem[] = [
  {
    id: 'custom-1',
    name: '数学加法器与天气查询工具',
    description: '该MCP可以计算两个数的和，也可以根据城市名称查询当前天气',
    author: '我',
    source: 'custom',
    status: 'online',
    tools: ['add', 'get_weather'],
    createdAt: '2024-12-10',
    updatedAt: '2024-12-15',
  },
];

// MCP 广场列表
export const plazaMcpList: McpItem[] = [
  {
    id: 'plaza-1',
    name: '扫描资产生成定制化报告',
    description: '扫描资产生成定制化报告',
    author: '王玉龙',
    source: 'official',
    status: 'online',
    tools: ['run_cdnAnalyzer', 'create_redteam_report', 'create_redteam_report_by_new_template'],
    createdAt: '2024-11-01',
    updatedAt: '2024-12-10',
  },
  {
    id: 'plaza-2',
    name: 'multimodal-mcp',
    description: '多模态处理MCP，支持音频转文字、图像分析等',
    author: '余志琪',
    source: 'official',
    status: 'offline',
    tools: ['transcribeAudioToText', 'analyzeImageContent', 'extractDocumentText'],
    createdAt: '2024-10-15',
    updatedAt: '2024-12-08',
  },
  {
    id: 'plaza-3',
    name: 'asdasd',
    description: '网络搜索工具',
    author: 'zpf',
    source: 'community',
    status: 'offline',
    tools: ['web_search'],
    createdAt: '2024-12-01',
    updatedAt: '2024-12-05',
  },
  {
    id: 'plaza-4',
    name: 'VirusTotal_IOC_中文',
    description: '对恶意软件的MD5、IP、域名等进行威胁情报查询',
    author: 'Vexs',
    source: 'official',
    status: 'online',
    tools: ['query_md5', 'query_ip', 'query_domain', 'query_url'],
    createdAt: '2024-09-20',
    updatedAt: '2024-12-12',
  },
  {
    id: 'plaza-5',
    name: 'Linux_Analysis_Server_中文',
    description: '上传Linux版本采集器结果文件ZIP包进行分析',
    author: 'Vexs',
    source: 'official',
    status: 'online',
    tools: ['upload_linux_zip', 'analyze_linux_system'],
    createdAt: '2024-09-15',
    updatedAt: '2024-12-11',
  },
  {
    id: 'plaza-6',
    name: 'Windows_Analysis_Server_中文',
    description: '上传Windows版本采集器结果文件ZIP包进行分析',
    author: 'Vexs',
    source: 'official',
    status: 'online',
    tools: ['upload_windows_zip', 'analyze_windows_system'],
    createdAt: '2024-09-15',
    updatedAt: '2024-12-11',
  },
];
