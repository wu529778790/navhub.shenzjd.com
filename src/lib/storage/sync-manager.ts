/**
 * 同步管理器
 * 管理本地存储和 GitHub 之间的同步
 */

import { saveToLocalStorage, loadFromLocalStorage, setLastSyncTime, type NavData } from "./local-storage";
import { saveDataToGitHub } from "./github-storage";

export enum SyncStatus {
  IDLE = "🟢", // 空闲
  SYNCING = "🟡", // 同步中
  ERROR = "🔴", // 错误
  OFFLINE = "⚪", // 离线
}

interface SyncOptions {
  token?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: SyncStatus) => void;
}

/**
 * 同步管理器类
 */
export class SyncManager {
  private queue: NavData[] = [];
  private timer: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private status: SyncStatus = SyncStatus.IDLE;
  private options: SyncOptions = {};

  constructor(options?: SyncOptions) {
    this.options = options || {};
  }

  /**
   * 添加到同步队列（防抖）
   */
  sync(data: NavData): void {
    // 立即更新本地存储
    saveToLocalStorage(data);

    // 添加到队列
    this.queue.push(data);

    // 防抖处理
    this.debounceSync();
  }

  /**
   * 立即同步（用于关键操作）
   */
  async syncNow(data: NavData): Promise<void> {
    // 立即更新本地
    saveToLocalStorage(data);

    // 清空队列
    this.queue = [];

    // 立即执行同步
    await this.processQueue();
  }

  /**
   * 强制同步（不检查网络状态）
   */
  async forceSync(): Promise<void> {
    const data = loadFromLocalStorage();
    if (!data) return;

    await this.processQueueImmediate(data);
  }

  /**
   * 防抖同步（3秒无新操作才同步）
   */
  private debounceSync(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.processQueue();
    }, 3000);
  }

  /**
   * 处理同步队列
   */
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0 || this.isSyncing) return;

    const latestData = this.queue[this.queue.length - 1];
    this.queue = [];

    await this.processQueueImmediate(latestData);
  }

  /**
   * 立即处理队列
   */
  private async processQueueImmediate(data: NavData): Promise<void> {
    // 检查网络状态
    if (!navigator.onLine) {
      this.updateStatus(SyncStatus.OFFLINE);
      return;
    }

    // 检查 token
    if (!this.options.token) {
      this.updateStatus(SyncStatus.IDLE);
      return;
    }

    this.isSyncing = true;
    this.updateStatus(SyncStatus.SYNCING);

    try {
      // 尝试同步到 GitHub
      await saveDataToGitHub(this.options.token, data, `[skip ci] Auto sync ${new Date().toISOString()}`);

      // 更新最后同步时间
      setLastSyncTime();

      this.updateStatus(SyncStatus.IDLE);
      this.options.onSuccess?.();

      console.log("✅ 同步成功");
    } catch (error) {
      console.error("❌ 同步失败:", error);
      this.updateStatus(SyncStatus.ERROR);
      this.options.onError?.(error as Error);

      // 加入重试队列
      this.retrySync(data);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 重试同步
   */
  private retrySync(data: NavData): void {
    // 延迟 5 秒后重试
    setTimeout(() => {
      this.queue.push(data);
      this.processQueue();
    }, 5000);
  }

  /**
   * 更新状态
   */
  private updateStatus(status: SyncStatus): void {
    this.status = status;
    this.options.onStatusChange?.(status);
  }

  /**
   * 获取当前状态
   */
  getStatus(): SyncStatus {
    return this.status;
  }

  /**
   * 清理资源
   */
  destroy(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

/**
 * 一次性同步（用于首次加载）
 */
export async function initialSync(token?: string): Promise<NavData | null> {
  // 1. 检查本地缓存
  const localData = loadFromLocalStorage();
  if (localData) {
    return localData;
  }

  // 2. 从 GitHub 拉取
  if (token) {
    try {
      const { getDataFromGitHub } = await import("./github-storage");
      const githubData = await getDataFromGitHub(token);
      if (githubData) {
        // 保存到本地
        saveToLocalStorage(githubData);
        setLastSyncTime();
        return githubData;
      }
    } catch (error) {
      console.error("从 GitHub 拉取失败:", error);
    }
  }

  // 3. 返回空数据
  return {
    version: "1.0",
    lastModified: Date.now(),
    categories: [],
  };
}

/**
 * 手动同步（用户触发）
 */
export async function manualSync(token: string): Promise<void> {
  const data = loadFromLocalStorage();
  if (!data) {
    throw new Error("没有本地数据可同步");
  }

  // 检查网络
  if (!navigator.onLine) {
    throw new Error("当前离线，无法同步");
  }

  try {
    const { saveDataToGitHub } = await import("./github-storage");
    await saveDataToGitHub(token, data, `[skip ci] Manual sync ${new Date().toISOString()}`);
    setLastSyncTime();
  } catch (error) {
    console.error("手动同步失败:", error);
    throw error;
  }
}
