/**
 * 本地存储管理器
 * 管理 localStorage 中的数据
 */

const STORAGE_KEY = "nav_data";
const LAST_SYNC_KEY = "nav_last_sync";
const EXPIRY_KEY = "nav_expiry";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时

export interface Site {
  id: string;
  title: string;
  url: string;
  favicon: string;
  description?: string;
  sort?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  sort: number;
  sites: Site[];
}

export interface NavData {
  version: string;
  lastModified: number;
  categories: Category[];
}

/**
 * 保存数据到 localStorage
 */
export function saveToLocalStorage(data: NavData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
  } catch (error) {
    console.error("保存到 localStorage 失败:", error);
    throw new Error("本地存储空间不足");
  }
}

/**
 * 从 localStorage 读取数据
 */
export function loadFromLocalStorage(): NavData | null {
  try {
    const expiry = localStorage.getItem(EXPIRY_KEY);
    if (!expiry) return null;

    if (Date.now() > parseInt(expiry)) {
      clearLocalStorage();
      return null;
    }

    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error("从 localStorage 读取失败:", error);
    return null;
  }
}

/**
 * 清除 localStorage 数据
 */
export function clearLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LAST_SYNC_KEY);
    localStorage.removeItem(EXPIRY_KEY);
  } catch (error) {
    console.error("清除 localStorage 失败:", error);
  }
}

/**
 * 获取最后修改时间
 */
export function getLastModified(): number | null {
  try {
    const data = loadFromLocalStorage();
    return data?.lastModified || null;
  } catch {
    return null;
  }
}

/**
 * 获取最后同步时间
 */
export function getLastSyncTime(): Date | null {
  try {
    const timestamp = localStorage.getItem(LAST_SYNC_KEY);
    return timestamp ? new Date(parseInt(timestamp)) : null;
  } catch {
    return null;
  }
}

/**
 * 设置最后同步时间
 */
export function setLastSyncTime(): void {
  try {
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
  } catch (error) {
    console.error("设置同步时间失败:", error);
  }
}

/**
 * 检查数据是否过期
 */
export function isExpired(): boolean {
  try {
    const expiry = localStorage.getItem(EXPIRY_KEY);
    if (!expiry) return true;
    return Date.now() > parseInt(expiry);
  } catch {
    return true;
  }
}

/**
 * 获取站点数据（兼容现有代码）
 */
export function getSitesFromLocalStorage(): Category[] {
  const data = loadFromLocalStorage();
  return data?.categories || [];
}

/**
 * 保存站点数据（兼容现有代码）
 */
export function saveSitesToLocalStorage(categories: Category[]): void {
  const data: NavData = {
    version: "1.0",
    lastModified: Date.now(),
    categories,
  };
  saveToLocalStorage(data);
}
