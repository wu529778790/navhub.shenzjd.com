/**
 * sitemap.xml — 引导搜索引擎发现站点收录的外链
 *
 * 站点本体（首页）+ 种子数据里的每个导航站点都会作为条目，
 * 让爬虫能顺着 sitemap 抓取到导航站收录的外部链接（导航站的 SEO 命脉）。
 */

import type { MetadataRoute } from "next";
import seed from "@/data/sites.json";

const SITE_URL = "https://navhub.shenzjd.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  for (const category of seed.categories ?? []) {
    for (const site of category.sites ?? []) {
      entries.push({
        url: site.url,
        // 导航站收录的外链，更新频率不高
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
