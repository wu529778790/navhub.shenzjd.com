/**
 * 同步管理器
 * 管理本地存储和 GitHub 之间的同步
 */

import { saveToLocalStorage, loadFromLocalStorage, setLastSyncTime, type NavData } from "./local-storage";
import { saveDataToGitHub, getDataFromGitHub } from "./github-storage";

export enum SyncStatus {
  IDLE = "🟢", // 空闲
  SYNCING = "🟡", // 同步中
  UPLOADING = "⬆️", // 上传中
  DOWNLOADING = "⬇️", // 下载中
  CONFLICT = "⚠️", // 冲突
  ERROR = "🔴", // 错误
  OFFLINE = "⚪", // 离线
}

export interface SyncResult {
  success: boolean;
  direction: "upload" | "download" | "none";
  conflictResolved?: boolean;
  message?: string;
  error?: string;
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
   * 双向同步（上传 + 下载 + 冲突检测）
   * 这是用户手动点击"同步"按钮时调用的方法
   */
  async bidirectionalSync(): Promise<SyncResult> {
    if (!this.options.token) {
      return { success: false, direction: "none", error: "未登录" };
    }

    // 确保在浏览器环境
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      this.updateStatus(SyncStatus.OFFLINE);
      return { success: false, direction: "none", error: "当前离线" };
    }

    this.isSyncing = true;
    this.updateStatus(SyncStatus.SYNCING);

    try {
      // 1. 获取本地数据
      const localData = loadFromLocalStorage();
      if (!localData) {
        return { success: false, direction: "none", error: "没有本地数据" };
      }

      // 2. 获取 GitHub 数据
      this.updateStatus(SyncStatus.DOWNLOADING);
      const githubData = await getDataFromGitHub(this.options.token!);

      // 3. 检测冲突并解决
      const result = await this.resolveConflict(localData, githubData);

      // 4. 更新状态
      if (result.success) {
        this.updateStatus(SyncStatus.IDLE);
        this.options.onSuccess?.();
      } else {
        this.updateStatus(SyncStatus.ERROR);
        this.options.onError?.(new Error(result.error || "同步失败"));
      }

      return result;
    } catch (error) {
      console.error("双向同步失败:", error);
      this.updateStatus(SyncStatus.ERROR);
      this.options.onError?.(error as Error);
      return { success: false, direction: "none", error: (error as Error).message };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 冲突检测与解决
   * 规则：
   * 1. 如果 GitHub 为空，上传本地数据
   * 2. 如果本地为空，下载 GitHub 数据
   * 3. 如果都有数据，比较 lastModified 时间戳
   * 4. 时间戳相同，比较版本号
   * 5. 如果冲突，优先使用最新的数据（带用户提示）
   */
  private async resolveConflict(localData: NavData, githubData: NavData | null): Promise<SyncResult> {
    // 情况 1: GitHub 为空，上传本地
    if (!githubData) {
      this.updateStatus(SyncStatus.UPLOADING);
      await saveDataToGitHub(this.options.token!, localData, `[skip ci] Initial upload ${new Date().toISOString()}`);
      setLastSyncTime();
      return {
        success: true,
        direction: "upload",
        message: "上传本地数据到 GitHub"
      };
    }

    // 情况 2: 本地为空，下载 GitHub
    if (!localData || !localData.categories || localData.categories.length === 0) {
      this.updateStatus(SyncStatus.DOWNLOADING);
      saveToLocalStorage(githubData);
      setLastSyncTime();
      return {
        success: true,
        direction: "download",
        message: "从 GitHub 下载数据"
      };
    }

    // 情况 3: 双方都有数据，需要比较
    const localTime = localData.lastModified || 0;
    const githubTime = githubData.lastModified || 0;

    if (localTime > githubTime) {
      // 本地更新，上传
      this.updateStatus(SyncStatus.UPLOADING);
      await saveDataToGitHub(this.options.token!, localData, `[skip ci] Sync from local ${new Date().toISOString()}`);
      setLastSyncTime();
      return {
        success: true,
        direction: "upload",
        message: "本地数据较新，已上传到 GitHub"
      };
    } else if (githubTime > localTime) {
      // GitHub 更新，下载
      this.updateStatus(SyncStatus.DOWNLOADING);
      saveToLocalStorage(githubData);
      setLastSyncTime();
      return {
        success: true,
        direction: "download",
        message: "GitHub 数据较新，已下载到本地"
      };
    } else {
      // 时间戳相同，数据一致，无需同步
      setLastSyncTime();
      return {
        success: true,
        direction: "none",
        message: "数据已同步，无需更新"
      };
    }
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
    // 检查网络状态（确保在浏览器环境）
    if (typeof navigator !== "undefined" && !navigator.onLine) {
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
 * 手动同步（用户触发）- 双向同步版本
 * 返回同步结果用于 UI 反馈
 */
export async function manualSync(token: string): Promise<SyncResult> {
  // 检查网络（确保在浏览器环境）
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("当前离线，无法同步");
  }

  try {
    // 1. 获取本地数据
    const localData = loadFromLocalStorage();
    if (!localData) {
      throw new Error("没有本地数据可同步");
    }

    // 2. 获取 GitHub 数据
    const { getDataFromGitHub, saveDataToGitHub } = await import("./github-storage");
    const githubData = await getDataFromGitHub(token);

    // 3. 冲突检测与解决
    // 情况 1: GitHub 为空，上传
    if (!githubData) {
      await saveDataToGitHub(token, localData, `[skip ci] Manual upload ${new Date().toISOString()}`);
      setLastSyncTime();
      return {
        success: true,
        direction: "upload",
        message: "上传本地数据到 GitHub"
      };
    }

    // 情况 2: 本地为空，下载
    if (!localData || !localData.categories || localData.categories.length === 0) {
      saveToLocalStorage(githubData);
      setLastSyncTime();
      return {
        success: true,
        direction: "download",
        message: "从 GitHub 下载数据"
      };
    }

    // 情况 3: 双方都有数据，比较时间戳
    const localTime = localData.lastModified || 0;
    const githubTime = githubData.lastModified || 0;

    if (localTime > githubTime) {
      // 本地更新，上传
      await saveDataToGitHub(token, localData, `[skip ci] Manual sync ${new Date().toISOString()}`);
      setLastSyncTime();
      return {
        success: true,
        direction: "upload",
        message: "本地数据较新，已上传到 GitHub"
      };
    } else if (githubTime > localTime) {
      // GitHub 更新，下载
      saveToLocalStorage(githubData);
      setLastSyncTime();
      return {
        success: true,
        direction: "download",
        message: "GitHub 数据较新，已下载到本地"
      };
    } else {
      // 数据一致
      setLastSyncTime();
      return {
        success: true,
        direction: "none",
        message: "数据已同步，无需更新"
      };
    }
  } catch (error) {
    console.error("手动同步失败:", error);
    throw error;
  }
}
