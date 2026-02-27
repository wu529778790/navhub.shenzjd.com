/**
 * 同步管理器
 * 管理本地存储和 GitHub 之间的同步
 */

import { saveToLocalStorage, loadFromLocalStorage, setLastSyncTime, type NavData } from "./local-storage";
import { saveDataToGitHub, getDataFromGitHub } from "./github-storage";
import { STORAGE_CONFIG, SYNC_CONFIG } from "@/lib/config";

/**
 * 检查本地数据是否为空（只有默认分类）
 */
function isLocalDataEmpty(data: NavData | null): boolean {
  return !data ||
         !data.categories ||
         data.categories.length === 0 ||
         (data.categories.length === 1 &&
          data.categories[0].id === "default" &&
          data.categories[0].sites.length === 0);
}

/**
 * 冲突解决逻辑（共享）
 * 决定同步方向：upload / download / none
 */
export async function resolveSyncDirection(
  localData: NavData | null,
  githubData: NavData | null,
  token: string,
  commitMessagePrefix: string
): Promise<SyncResult> {
  const isLocalEmpty = isLocalDataEmpty(localData);

  // 情况 1: 本地为空，GitHub 有数据 → 下载
  if (isLocalEmpty && githubData) {
    saveToLocalStorage(githubData);
    setLastSyncTime();
    return {
      success: true,
      direction: "download",
      message: "从 GitHub 下载数据"
    };
  }

  // 情况 2: GitHub 为空，本地有有效数据 → 上传
  if (githubData === null && !isLocalEmpty && localData) {
    await saveDataToGitHub(token, localData, `${commitMessagePrefix} ${new Date().toISOString()}`);
    setLastSyncTime();
    return {
      success: true,
      direction: "upload",
      message: "上传本地数据到 GitHub"
    };
  }

  // 情况 3: 双方都为空 → 无需操作
  if (isLocalEmpty && githubData === null) {
    setLastSyncTime();
    return {
      success: true,
      direction: "none",
      message: "两端都为空，无需同步"
    };
  }

  // 情况 4: 双方都有有效数据，比较时间戳
  if (localData && githubData && !isLocalEmpty) {
    const localTime = localData.lastModified || 0;
    const githubTime = githubData.lastModified || 0;

    if (localTime > githubTime) {
      // 本地更新，上传
      await saveDataToGitHub(token, localData, `${commitMessagePrefix} ${new Date().toISOString()}`);
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
      // 时间戳相同，数据一致
      setLastSyncTime();
      return {
        success: true,
        direction: "none",
        message: "数据已同步，无需更新"
      };
    }
  }

  // 理论上不应该到这里
  return {
    success: false,
    direction: "none",
    error: "未知的同步状态"
  };
}

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

export type SyncStep = "prepare" | "fetching" | "comparing" | "uploading" | "downloading" | "merging" | "done";

export interface SyncStepInfo {
  step: SyncStep;
  label: string;
  progress: number; // 0-100
}

interface SyncOptions {
  token?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: SyncStatus) => void;
  onStepChange?: (step: SyncStepInfo) => void;
}

const SYNC_STEPS: Record<SyncStep, string> = {
  prepare: "准备同步...",
  fetching: "获取远程数据...",
  comparing: "比较数据差异...",
  uploading: "上传数据到 GitHub...",
  downloading: "下载数据到本地...",
  merging: "合并数据...",
  done: "完成",
};

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
   * 更新同步步骤
   */
  private updateStep(step: SyncStep, progress: number = 0): void {
    this.options.onStepChange?.({
      step,
      label: SYNC_STEPS[step],
      progress,
    });
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
      // 1. 准备同步
      this.updateStep("prepare", 10);

      // 2. 获取本地数据
      this.updateStep("fetching", 30);
      const localData = loadFromLocalStorage();

      // 3. 获取 GitHub 数据
      const githubData = await getDataFromGitHub(this.options.token!);
      this.updateStep("fetching", 50);

      // 4. 比较数据
      this.updateStep("comparing", 60);

      // 5. 检测冲突并解决
      const result = await this.resolveConflict(localData, githubData);

      // 6. 更新状态
      if (result.success) {
        this.updateStep("done", 100);
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
   * 1. 本地为空（或只有默认分类）+ GitHub 有数据 → 下载
   * 2. GitHub 为空 + 本地有有效数据 → 上传
   * 3. 双方都为空 → 无需操作
   * 4. 双方都有数据 → 比较时间戳决定方向
   */
  private async resolveConflict(localData: NavData | null, githubData: NavData | null): Promise<SyncResult> {
    // 预测同步方向以更新 UI 状态
    const isLocalEmpty = isLocalDataEmpty(localData);
    const direction = isLocalEmpty && githubData ? "download" :
                      githubData === null && !isLocalEmpty ? "upload" : "none";

    if (direction === "download") {
      this.updateStatus(SyncStatus.DOWNLOADING);
      this.updateStep("downloading", 70);
    } else if (direction === "upload") {
      this.updateStatus(SyncStatus.UPLOADING);
      this.updateStep("uploading", 70);
    }

    // 使用共享的同步逻辑
    const result = await resolveSyncDirection(
      localData,
      githubData,
      this.options.token!,
      `[skip ci] Sync`
    );

    if (result.success && result.direction !== "none") {
      this.updateStep("merging", 90);
    }

    return result;
  }

  /**
   * 防抖同步（3秒无新操作才同步）
   */
  private debounceSync(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.processQueue();
    }, STORAGE_CONFIG.SYNC_DEBOUNCE_MS);
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
    // 延迟后重试
    setTimeout(() => {
      this.queue.push(data);
      this.processQueue();
    }, SYNC_CONFIG.RETRY_DELAY_MS);
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

    // 2. 获取 GitHub 数据
    const githubData = await getDataFromGitHub(token);

    // 3. 使用共享的同步逻辑
    return await resolveSyncDirection(localData, githubData, token, `[skip ci] Manual sync`);
  } catch (error) {
    console.error("手动同步失败:", error);
    throw error;
  }
}
