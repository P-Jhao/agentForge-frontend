/**
 * 用户设置 localStorage 存储工具
 * 将用户偏好设置统一存储在 userSettings-{userId} 中
 * 注意：模型配置已迁移到数据库存储，不再使用 localStorage
 */
import type { EnhanceMode } from './enhanceMode';

// 用户设置类型（仅保留 localStorage 存储的设置）
export interface UserSettings {
  // 深度思考开关
  enableThinking: boolean;
  // 增强模式
  enhanceMode: EnhanceMode;
  // 智能路由开关
  smartRoutingEnabled: boolean;
  // 任务列表每页条数
  taskListPageSize: number;
}

// 默认设置
const DEFAULT_SETTINGS: UserSettings = {
  enableThinking: false,
  enhanceMode: 'off',
  smartRoutingEnabled: false,
  taskListPageSize: 10,
};

// 有效的增强模式值
const VALID_ENHANCE_MODES: EnhanceMode[] = ['off', 'quick', 'smart', 'multi'];

/**
 * 获取 localStorage key
 */
function getStorageKey(userId: number): string {
  return `userSettings-${userId}`;
}

/**
 * 获取用户设置
 * @param userId 用户 ID
 * @returns 用户设置对象
 */
export function getUserSettings(userId: number): UserSettings {
  try {
    const stored = localStorage.getItem(getStorageKey(userId));
    if (stored) {
      const parsed = JSON.parse(stored);
      // 验证并合并默认值
      return {
        enableThinking:
          typeof parsed.enableThinking === 'boolean'
            ? parsed.enableThinking
            : DEFAULT_SETTINGS.enableThinking,
        enhanceMode: VALID_ENHANCE_MODES.includes(parsed.enhanceMode)
          ? parsed.enhanceMode
          : DEFAULT_SETTINGS.enhanceMode,
        smartRoutingEnabled:
          typeof parsed.smartRoutingEnabled === 'boolean'
            ? parsed.smartRoutingEnabled
            : DEFAULT_SETTINGS.smartRoutingEnabled,
        taskListPageSize:
          typeof parsed.taskListPageSize === 'number' && parsed.taskListPageSize > 0
            ? parsed.taskListPageSize
            : DEFAULT_SETTINGS.taskListPageSize,
      };
    }
  } catch {
    // localStorage 不可用或解析失败时忽略错误
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * 保存用户设置
 * @param userId 用户 ID
 * @param settings 要保存的设置（部分或全部）
 */
export function saveUserSettings(userId: number, settings: Partial<UserSettings>): void {
  try {
    const current = getUserSettings(userId);
    const updated = { ...current, ...settings };
    localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
  } catch {
    // localStorage 不可用时忽略错误
  }
}

/**
 * 更新单个设置项
 * @param userId 用户 ID
 * @param key 设置项名称
 * @param value 设置值
 */
export function updateUserSetting<K extends keyof UserSettings>(
  userId: number,
  key: K,
  value: UserSettings[K]
): void {
  saveUserSettings(userId, { [key]: value });
}

/**
 * 清除用户设置
 * @param userId 用户 ID
 */
export function clearUserSettings(userId: number): void {
  try {
    localStorage.removeItem(getStorageKey(userId));
  } catch {
    // localStorage 不可用时忽略错误
  }
}
