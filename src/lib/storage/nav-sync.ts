/**
 * NavSync — 全局单层 SyncManager 实例管理
 *
 * 为什么不用 Hook？
 * - DataContext 是 hook，但 useClientSync 在 useEffect 里调用；CRUD 方法比 mount effect 更早被 dispatch
 * - 我们需要在 DataContext 调用 `manager.sync(data)` 的时刻，manager 已经ready 在等；而不是被挂起
 *
 * 所以我们走 module-level 单例 + lazy init 模式：
 *
 *   getNavSyncManager() → 返回（并在第一次调用时初始化）SyncManager 实例
 *
 * 特点：
 * 1. token 通过 getter 提供，实时读取 isAuthenticated 状态（AuthContext 是 hook，拿不到）
 * 2. sync 在 isAuthenticated 翻转后会生效；未认证时 guard 走 token 不存在分支 → 静默抛错
 * 3. 全局只有一个 SyncManager，避免重复防抖或并发写入
 */

import { SyncManager, SyncStatus } from "./sync-manager";
import type { NavData } from "@/types";
import type { SyncResult } from "@/types";

let instance: SyncManager | null = null;
let lastToken: string | null = null;

/**
 * 暴露的 SyncManager 实例。
 *
 * 使用 getter 形式，每次访问都做 token 一致性校验：
 * - token 变化时（A登录 → B登录），销毁旧实例并重建新实例
 * - 避免上一用户的 SyncManager 把数据推到下用户的仓库
 */
function getOrCreateManager(token: string | null): SyncManager | null {
  if (!token) return null;

  if (instance && lastToken === token) return instance;

  // token 变化 → 销毁旧实例（旧 timers / queue 不再需要）
  if (instance) {
    instance.destroy();
    instance = null;
  }

  lastToken = token;
  instance = new SyncManager({
    // 哨兵值（HttpOnly cookie 真实 token）
    token,
  });
  return instance;
}

/**
 * DataContext 中调用的主入口。
 * token 由 `isAuth()` 在 Context 外部检查后传入。
 */
export function getNavSyncManager(token: string = "cookie"): SyncManager {
  const m = getOrCreateManager(token);
  if (!m) {
    // 不应该到这里；若到，返回一个 dummy no-op 防止崩溃
    return new SyncManager({ token: "cookie" });
  }
  return m;
}

/**
 * DataContext CRUD 操作调用：保存最新数据为 NavData，入队 sync。
 * 入队失败（token 缺失、网络离线）时内部已处理，不做 throw。
 */
export function scheduleSync(data: NavData, immediate = false): void {
  const manager = getOrCreateManager("cookie");
  if (!manager) return;
  if (immediate) {
    void manager.syncNow(data);
  } else {
    manager.sync(data);
  }
}

/**
 * 从"同步钩子"路径调用（useSync hook）：强制双向同步。
 */
export function forceBidirectionalSync(token: string): Promise<SyncResult> {
  const manager = getOrCreateManager(token);
  if (!manager) return Promise.resolve({ success: false, direction: "none", error: "未登录" });
  return manager.bidirectionalSync();
}

/**
 * AuthProvider 在登出 / 用户切换 / token 销毁时调用来清理。
 */
export function releaseSyncManager(): void {
  if (instance) {
    instance.destroy();
    instance = null;
    lastToken = null;
  }
}

/**
 * 获取当前同步状态（调试用 / UI indicator）。
 */
export function getSyncStatus(): SyncStatus {
  return instance?.getStatus() ?? SyncStatus.IDLE;
}
