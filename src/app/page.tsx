/**
 * 首页（服务端组件）
 *
 * SSR HTML 直接渲染，首屏立即可见。DataContext 同步从 localStorage 初始化
 * 真实数据（无需 prop 透传 seed），localStorage 优先 → 网络静默刷新。
 */

import HomeClient from "@/components/HomePage/HomeClient";

// 每小时后台重新生成，保持 HTML 新鲜
export const revalidate = 3600;

export default function Page() {
  return <HomeClient />;
}
