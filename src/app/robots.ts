/**
 * robots.txt — 允许全站抓取，并指向 sitemap
 */

import type { MetadataRoute } from "next";

const SITE_URL = "https://navhub.shenzjd.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
