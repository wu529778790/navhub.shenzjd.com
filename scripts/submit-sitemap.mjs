/**
 * Sitemap 自动提交脚本（百度 + Google Search Console）
 *
 * 用法（由 .github/workflows/sitemap-submit.yml 调用，也可本地 node 手跑）：
 *   SITE_URL=https://navhub.shenzjd.com \
 *   BAIDU_SITE=navhub.shenzjd.com \
 *   BAIDU_TOKEN=xxx \
 *   GOOGLE_CLIENT_EMAIL=xxx@project.iam.gserviceaccount.com \
 *   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..." \
 *   node scripts/submit-sitemap.mjs
 *
 * 设计原则：
 * - 零 npm 依赖，仅用 Node 标准库（fetch / crypto），便于在 CI 里直接跑
 * - 任一平台的凭证缺失 → 优雅跳过该平台，不整体失败（Action 默认能跑通）
 * - Google 的 OAuth JWT 用 crypto 手写，不引入 googleapis 大包
 */

import crypto from "node:crypto";

const SITE_URL = (process.env.SITE_URL || "https://navhub.shenzjd.com").replace(/\/$/, "");
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

// ========== 工具函数 ==========

/** 解析 sitemap.xml，返回其中的 <loc> URL 列表 */
async function fetchSitemapUrls() {
  console.log(`📥 拉取 sitemap: ${SITEMAP_URL}`);
  const res = await fetch(SITEMAP_URL, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`拉取 sitemap 失败: HTTP ${res.status}`);
  }
  const xml = await res.text();
  // 提取所有 <loc>...</loc>（兼容 urlset 与 sitemap index 两种结构）
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
    m[1].trim().replace(/&amp;/g, "&")
  );
  if (urls.length === 0) {
    throw new Error("sitemap 中未解析到任何 URL");
  }
  console.log(`✅ 解析到 ${urls.length} 个 URL`);
  return urls;
}

// ========== 百度 API 推送 ==========

/**
 * 百度普通收录 API 推送
 * 文档: https://ziyuan.baidu.com/college/courseinfo?id=267
 * 接口: POST http://data.zz.baidu.com/urls?site=xxx&token=xxx
 * body: 每行一个 URL（纯文本），单次最多 1000 条
 */
async function submitToBaidu(urls) {
  const site = process.env.BAIDU_SITE;
  const token = process.env.BAIDU_TOKEN;
  if (!site || !token) {
    console.log("⏭️  跳过百度：未配置 BAIDU_SITE / BAIDU_TOKEN");
    return;
  }

  // 只推送本站 URL（百度要求域名与 site 参数匹配），导航站收录的外链不推
  const ownUrls = urls.filter((u) => {
    try {
      return new URL(u).hostname === site;
    } catch {
      return false;
    }
  });

  if (ownUrls.length === 0) {
    console.log("⏭️  跳过百度：sitemap 中没有本站 URL 可推送");
    return;
  }

  // 单次最多 1000 条，超出分批
  const batch = ownUrls.slice(0, 1000);
  const body = batch.join("\n");

  const endpoint = `http://data.zz.baidu.com/urls?site=${encodeURIComponent(
    site
  )}&name=${encodeURIComponent(site)}&token=${encodeURIComponent(token)}`;

  console.log(`📤 推送 ${batch.length} 个 URL 到百度 (${site})`);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body,
  });
  const text = await res.text();
  let result;
  try {
    result = JSON.parse(text);
  } catch {
    result = { raw: text };
  }

  if (res.ok && typeof result.success === "number") {
    console.log(
      `✅ 百度推送成功: success=${result.success}, remain=${result.remain ?? "未知"}`
    );
    if (result.not_same_site?.length) {
      console.warn(`   ⚠️  非本站 URL 被忽略: ${result.not_same_site.length} 条`);
    }
    if (result.not_valid?.length) {
      console.warn(`   ⚠️  无效 URL: ${result.not_valid.length} 条`);
    }
  } else {
    console.error(`❌ 百度推送失败: HTTP ${res.status}`, result);
    process.exitCode = 1;
  }
}

// ========== Google Search Console API ==========

/**
 * 用 service account 私钥签发 OAuth2 JWT，换取 access token（RS256）。
 * 仅用 Node 标准库 crypto，不依赖 googleapis。
 * 参考: https://developers.google.com/identity/protocols/oauth2/service-account#jwtauth
 */
async function getGoogleAccessToken(clientEmail, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/webmasters",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const base64url = (obj) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const signingInput = `${base64url(header)}.${base64url(payload)}`;

  // 私钥里的 \n 转义还原成真实换行
  const pem = privateKey.replace(/\\n/g, "\n");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign.sign(pem, "base64url");

  const jwt = `${signingInput}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const tokenRes = await res.json();
  if (!res.ok) {
    throw new Error(`换取 Google access token 失败: ${JSON.stringify(tokenRes)}`);
  }
  return tokenRes.access_token;
}

/**
 * Google Search Console: 提交 sitemap
 * 文档: https://developers.google.com/webmaster-tools/v1/sitemaps/submit
 * PUT https://www.googleapis.com/webmasters/v1/sites/{siteUrl}/sitemaps/{feedpath}
 *
 * 注意: service account 邮箱必须先在 Search Console 添加为该站点的用户(否则 403)
 */
async function submitToGoogle() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const site = process.env.GOOGLE_SITE_URL || SITE_URL;

  if (!clientEmail || !privateKey) {
    console.log("⏭️  跳过 Google：未配置 GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY");
    return;
  }

  console.log("🔐 获取 Google access token...");
  const token = await getGoogleAccessToken(clientEmail, privateKey);

  // siteUrl 与 feedpath 都要做 URL 编码（Google API 要求 encoded）
  const encodedSite = encodeURIComponent(site);
  const encodedFeedpath = encodeURIComponent(SITEMAP_URL);
  const endpoint = `https://www.googleapis.com/webmasters/v1/sites/${encodedSite}/sitemaps/${encodedFeedpath}`;

  console.log(`📤 提交 sitemap 到 Google Search Console (${site})`);
  const res = await fetch(endpoint, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    // Google API 要求 siteUrl 与提交的 sitemap path 在域名上匹配
    body: JSON.stringify({
      path: SITEMAP_URL,
      type: "sitemap",
    }),
  });

  if (res.ok || res.status === 200) {
    console.log("✅ Google sitemap 提交成功");
  } else if (res.status === 409) {
    console.log("✅ Google sitemap 已存在（无需重复提交）");
  } else {
    const text = await res.text();
    console.error(`❌ Google 提交失败: HTTP ${res.status}`, text);
    process.exitCode = 1;
  }
}

// ========== 主流程 ==========

async function main() {
  console.log(`🚀 Sitemap 提交开始 — ${new Date().toISOString()}`);
  console.log(`   站点: ${SITE_URL}`);

  const urls = await fetchSitemapUrls();

  await submitToBaidu(urls);
  await submitToGoogle();

  console.log("🎉 完成");
}

main().catch((err) => {
  console.error("💥 执行出错:", err.message);
  process.exit(1);
});
