/**
 * 首页（服务端组件）
 *
 * 直接 import 本地种子数据 src/data/sites.json 作为首屏内容，保证：
 * 1. 服务端渲染出的 HTML 即包含站点 <a>，搜索引擎可索引（导航站的 SEO 命脉）
 * 2. 首屏不依赖 raw.githubusercontent.com 的网络往返，秒开无白屏
 *
 * ISR：每 1 小时后台重新生成一次（revalidate）。真正的用户数据由
 * DataContext 在客户端加载后无缝替换种子内容。
 */

import seed from "@/data/sites.json";
import HomeClient from "@/components/HomePage/HomeClient";

// 每小时后台重新生成，保持 HTML 新鲜
export const revalidate = 3600;

export default function Page() {
  const initialSites = seed.categories ?? [];
  return <HomeClient initialSites={initialSites} />;
}
