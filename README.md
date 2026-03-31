# navhub.shenzjd.com

个人导航网站，数据存储在 GitHub 仓库，支持离线使用。

## 功能

- **双向同步** — 操作即时生效，3 秒防抖自动同步到 GitHub
- **GitHub OAuth** — 登录授权后自动 Fork 仓库，数据私有可控
- **离线可用** — 无网络时正常使用，恢复后自动同步
- **拖拽排序** — 分类和站点支持拖拽重新排序
- **访客模式** — 未登录可查看示例数据，只读

## 快速开始

### 1. 创建 GitHub OAuth App

在 [GitHub Developer Settings](https://github.com/settings/developers) 创建 OAuth App：

- **Homepage URL**: `http://localhost:3000`
- **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入 OAuth App 的 Client ID 和 Client Secret。

### 3. 运行

```bash
pnpm install
pnpm dev
```

访问 http://localhost:3000

## Docker 部署

```bash
docker pull ghcr.io/wu529778790/navhub.shenzjd.com:main

docker run -d -p 3000:3000 \
  -e NEXT_PUBLIC_GITHUB_CLIENT_ID=your_id \
  -e GITHUB_CLIENT_SECRET=your_secret \
  ghcr.io/wu529778790/navhub.shenzjd.com:main
```

镜像由 GitHub Actions 自动构建并推送到 GHCR。

## 数据同步

```
用户操作 → localStorage (即时) → UI 更新 → 3秒防抖 → /api/github/data → GitHub API → sites.json
```

同步方向基于时间戳自动判断：本地较新则上传，GitHub 较新则下载。

## 技术栈

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- @dnd-kit（拖拽排序）
- Zod（输入校验）
- Vitest（测试）

## 开发

```bash
pnpm dev              # 开发服务器
pnpm build            # 生产构建
pnpm lint             # ESLint
pnpm type-check       # TypeScript 类型检查
pnpm test --run       # 运行测试
pnpm format           # Prettier 格式化
```

## 安全

- Token 存储在服务端 HttpOnly Cookie，前端不接触明文
- API 请求经过 Origin 校验（CSRF 防护）和速率限制
- 用户输入通过 Zod 校验和 XSS 过滤
- 安全响应头（CSP、HSTS、X-Frame-Options 等）由中间件统一注入

## 数据存储

数据存储在你自己的 GitHub 仓库中：

```
your_username/navhub.shenzjd.com
└── data/
    └── sites.json
```

## License

MIT
