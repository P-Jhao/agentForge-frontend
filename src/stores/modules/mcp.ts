/**
 * MCP 状态管理
 * 管理 MCP 列表、当前 MCP 详情等状态
 */
import { ref } from 'vue';
import { defineStore } from 'pinia';
import {
  getMCPList as fetchMCPListApi,
  getMCP as fetchMCPApi,
  getMCPDetail as fetchMCPDetailApi,
  createMCP as createMCPApi,
  updateMCP as updateMCPApi,
  closeMCP as closeMCPApi,
  reconnectMCP as reconnectMCPApi,
  deleteMCP as deleteMCPApi,
} from '@/utils';
import type {
  MCP,
  MCPDetail,
  CreateMCPParams,
  UpdateMCPParams,
  MCPStatus,
  MCPFilterType,
} from '@/types';

export const useMCPStore = defineStore('mcp', () => {
  // ========== 状态 ==========

  // MCP 列表
  const mcpList = ref<MCP[]>([]);

  // 当前查看的 MCP 详情
  const currentMCP = ref<MCPDetail | null>(null);

  // 加载状态
  const loading = ref(false);

  // 搜索关键词
  const searchKeyword = ref('');

  // 筛选类型
  const filterType = ref<MCPFilterType>('all');

  // ========== 方法 ==========

  /**
   * 获取 MCP 列表
   * @param options 查询选项
   * @param options.keyword 搜索关键词（可选）
   * @param options.filter 筛选类型（可选）
   */
  async function fetchMCPList(options?: { keyword?: string; filter?: MCPFilterType }) {
    loading.value = true;
    try {
      // 更新搜索关键词和筛选类型
      if (options?.keyword !== undefined) {
        searchKeyword.value = options.keyword;
      }
      if (options?.filter !== undefined) {
        filterType.value = options.filter;
      }
      mcpList.value = await fetchMCPListApi(searchKeyword.value || undefined, filterType.value);
    } catch (error) {
      console.error('获取 MCP 列表失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取 MCP 基础详情
   * @param id MCP ID
   */
  async function fetchMCP(id: number) {
    loading.value = true;
    try {
      const mcp = await fetchMCPApi(id);
      return mcp;
    } catch (error) {
      console.error('获取 MCP 详情失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取 MCP 详情（含关联 Forge、工具列表）
   * @param id MCP ID
   */
  async function fetchMCPDetail(id: number) {
    loading.value = true;
    try {
      currentMCP.value = await fetchMCPDetailApi(id);
      return currentMCP.value;
    } catch (error) {
      console.error('获取 MCP 详情失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 创建 MCP（仅管理员）
   * @param params MCP 配置参数
   */
  async function createMCP(params: CreateMCPParams) {
    try {
      const mcp = await createMCPApi(params);
      // 刷新列表
      await fetchMCPList();
      return mcp;
    } catch (error) {
      console.error('创建 MCP 失败:', error);
      throw error;
    }
  }

  /**
   * 更新 MCP（仅管理员）
   * @param id MCP ID
   * @param params 更新参数
   */
  async function updateMCP(id: number, params: UpdateMCPParams) {
    try {
      const mcp = await updateMCPApi(id, params);
      // 刷新当前 MCP 详情
      if (currentMCP.value?.id === id) {
        await fetchMCPDetail(id);
      }
      // 刷新列表
      await fetchMCPList();
      return mcp;
    } catch (error) {
      console.error('更新 MCP 失败:', error);
      throw error;
    }
  }

  /**
   * 关闭 MCP（仅管理员）
   * @param id MCP ID
   */
  async function closeMCP(id: number) {
    try {
      await closeMCPApi(id);
      // 更新本地状态
      const mcp = mcpList.value.find((m) => m.id === id);
      if (mcp) {
        mcp.status = 'disconnected';
      }
      if (currentMCP.value?.id === id) {
        currentMCP.value.status = 'disconnected';
      }
    } catch (error) {
      console.error('关闭 MCP 失败:', error);
      throw error;
    }
  }

  /**
   * 重连 MCP（所有用户可用）
   * @param id MCP ID
   */
  async function reconnectMCP(id: number) {
    try {
      const result = await reconnectMCPApi(id);
      // 更新本地状态
      const mcp = mcpList.value.find((m) => m.id === id);
      if (mcp) {
        mcp.status = result.status;
      }
      if (currentMCP.value?.id === id) {
        currentMCP.value.status = result.status;
      }
      return result;
    } catch (error) {
      console.error('重连 MCP 失败:', error);
      throw error;
    }
  }

  /**
   * 删除 MCP（仅管理员）
   * @param id MCP ID
   * @returns 受影响的 Forge 数量
   */
  async function deleteMCP(id: number) {
    try {
      const result = await deleteMCPApi(id);
      // 清除当前 MCP
      if (currentMCP.value?.id === id) {
        currentMCP.value = null;
      }
      // 刷新列表
      await fetchMCPList();
      return result.affectedForgeCount;
    } catch (error) {
      console.error('删除 MCP 失败:', error);
      throw error;
    }
  }

  /**
   * 清除当前 MCP
   */
  function clearCurrentMCP() {
    currentMCP.value = null;
  }

  /**
   * 设置搜索关键词
   * @param keyword 搜索关键词
   */
  function setSearchKeyword(keyword: string) {
    searchKeyword.value = keyword;
  }

  /**
   * 处理 SSE 推送的 MCP 状态变化
   * @param mcpId MCP ID
   * @param status 新状态
   * @param name MCP 名称（可选）
   */
  function updateMCPStatus(mcpId: number, status: MCPStatus, name?: string) {
    // 更新列表中的 MCP 状态
    const mcp = mcpList.value.find((m) => m.id === mcpId);
    if (mcp) {
      mcp.status = status;
    }

    // 更新当前 MCP 详情的状态
    if (currentMCP.value?.id === mcpId) {
      currentMCP.value.status = status;
    }

    console.log(`[MCPStore] MCP ${mcpId} (${name || '未知'}) 状态已更新: ${status}`);
  }

  /**
   * 初始化 SSE 监听器
   * 在应用启动时调用，监听 MCP 状态变化事件
   */
  function initializeSSEListener() {
    // 监听自定义事件 mcp:status_change
    window.addEventListener('mcp:status_change', (event: Event) => {
      const customEvent = event as unknown as {
        detail: {
          mcpId: number;
          status: MCPStatus;
          name?: string;
        };
      };

      const { mcpId, status, name } = customEvent.detail;
      updateMCPStatus(mcpId, status, name);
    });

    console.log('[MCPStore] SSE 监听器已初始化');
  }

  return {
    // 状态
    mcpList,
    currentMCP,
    loading,
    searchKeyword,
    filterType,

    // 方法
    fetchMCPList,
    fetchMCP,
    fetchMCPDetail,
    createMCP,
    updateMCP,
    closeMCP,
    reconnectMCP,
    deleteMCP,
    clearCurrentMCP,
    setSearchKeyword,
    updateMCPStatus,
    initializeSSEListener,
  };
});
