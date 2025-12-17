/**
 * Forge 状态管理
 * 管理 Forge 列表、收藏列表、当前 Forge 等状态
 */
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import {
  getForgeList as fetchForgeListApi,
  getFavoriteForges as fetchFavoriteForgesApi,
  getForgeById as fetchForgeByIdApi,
  createForge as createForgeApi,
  updateForge as updateForgeApi,
  deleteForge as deleteForgeApi,
  toggleFavorite as toggleFavoriteApi,
  createTaskFromForge as createTaskFromForgeApi,
} from '@/utils';
import type {
  Forge,
  ForgeDetail,
  ForgeFilter,
  FavoriteForge,
  CreateForgeParams,
  UpdateForgeParams,
} from '@/types';

export const useForgeStore = defineStore('forge', () => {
  // ========== 状态 ==========

  // Forge 列表（广场页面用）
  const forgeList = ref<Forge[]>([]);

  // 收藏的 Forge 列表（侧边栏用）
  const favoriteForges = ref<FavoriteForge[]>([]);

  // 当前查看的 Forge 详情
  const currentForge = ref<ForgeDetail | null>(null);

  // 加载状态
  const loading = ref(false);

  // 当前筛选类型
  const currentFilter = ref<ForgeFilter>('all');

  // ========== 计算属性 ==========

  // 是否有当前 Forge
  const hasCurrentForge = computed(() => !!currentForge.value);

  // 当前 Forge 名称
  const currentForgeName = computed(() => currentForge.value?.displayName || '');

  // ========== 方法 ==========

  /**
   * 获取 Forge 列表
   */
  async function fetchForgeList(filter: ForgeFilter = 'all') {
    loading.value = true;
    currentFilter.value = filter;
    try {
      forgeList.value = await fetchForgeListApi(filter);
    } catch (error) {
      console.error('获取 Forge 列表失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取收藏的 Forge 列表（侧边栏用）
   */
  async function fetchFavoriteForges() {
    try {
      favoriteForges.value = await fetchFavoriteForgesApi();
    } catch (error) {
      console.error('获取收藏 Forge 列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取 Forge 详情
   */
  async function fetchForgeById(id: number) {
    loading.value = true;
    try {
      currentForge.value = await fetchForgeByIdApi(id);
      return currentForge.value;
    } catch (error) {
      console.error('获取 Forge 详情失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 创建 Forge
   */
  async function createForge(params: CreateForgeParams) {
    try {
      const result = await createForgeApi(params);
      // 刷新列表
      await fetchForgeList(currentFilter.value);
      return result.id;
    } catch (error) {
      console.error('创建 Forge 失败:', error);
      throw error;
    }
  }

  /**
   * 更新 Forge
   */
  async function updateForge(id: number, params: UpdateForgeParams) {
    try {
      await updateForgeApi(id, params);
      // 刷新当前 Forge 详情
      if (currentForge.value?.id === id) {
        await fetchForgeById(id);
      }
      // 刷新列表
      await fetchForgeList(currentFilter.value);
    } catch (error) {
      console.error('更新 Forge 失败:', error);
      throw error;
    }
  }

  /**
   * 删除 Forge
   */
  async function deleteForge(id: number) {
    try {
      await deleteForgeApi(id);
      // 清除当前 Forge
      if (currentForge.value?.id === id) {
        currentForge.value = null;
      }
      // 刷新列表
      await fetchForgeList(currentFilter.value);
      // 刷新收藏列表
      await fetchFavoriteForges();
    } catch (error) {
      console.error('删除 Forge 失败:', error);
      throw error;
    }
  }

  /**
   * 收藏/取消收藏 Forge
   */
  async function toggleFavorite(id: number, favorite: boolean) {
    try {
      await toggleFavoriteApi(id, favorite);

      // 更新本地列表中的收藏状态
      const forge = forgeList.value.find((f) => f.id === id);
      if (forge) {
        forge.isFavorite = favorite;
      }

      // 更新当前 Forge 的收藏状态
      if (currentForge.value?.id === id) {
        currentForge.value.isFavorite = favorite;
      }

      // 刷新收藏列表
      await fetchFavoriteForges();
    } catch (error) {
      console.error('收藏操作失败:', error);
      throw error;
    }
  }

  /**
   * 从 Forge 创建任务
   * @returns 任务 UUID
   */
  async function createTaskFromForge(id: number, message: string) {
    try {
      const result = await createTaskFromForgeApi(id, message);

      // 更新本地使用次数
      const forge = forgeList.value.find((f) => f.id === id);
      if (forge) {
        forge.usageCount++;
      }
      if (currentForge.value?.id === id) {
        currentForge.value.usageCount++;
      }

      return result.taskUuid;
    } catch (error) {
      console.error('从 Forge 创建任务失败:', error);
      throw error;
    }
  }

  /**
   * 清除当前 Forge
   */
  function clearCurrentForge() {
    currentForge.value = null;
  }

  return {
    // 状态
    forgeList,
    favoriteForges,
    currentForge,
    loading,
    currentFilter,

    // 计算属性
    hasCurrentForge,
    currentForgeName,

    // 方法
    fetchForgeList,
    fetchFavoriteForges,
    fetchForgeById,
    createForge,
    updateForge,
    deleteForge,
    toggleFavorite,
    createTaskFromForge,
    clearCurrentForge,
  };
});
