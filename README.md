# NavHub - 个人导航网站

一个支持**双向同步**的个人导航网站，数据存储在 GitHub，支持离线使用。

## ✨ 核心功能

- **🔄 双向同步**：操作立即生效，数据自动同步到 GitHub
- **🔐 GitHub 集成**：OAuth 登录，自动 Fork 仓库
- **📱 离线支持**：无网络时可正常使用，恢复后自动同步
- **⚡ 即时响应**：所有操作立即反馈，无需等待

## 🚀 快速开始

### 1. 配置 GitHub OAuth

在 [GitHub Developer Settings](https://github.com/settings/developers) 创建 OAuth App：

- **Homepage URL**: `http://localhost:3000`
- **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`

### 2. 环境配置

```bash
# .env.local
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
```

### 3. 运行项目

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 🐳 Docker 部署

### 快速运行

```bash
# 从 Docker Hub 拉取
docker pull wu529778790/navhub:main

# 运行
docker run -d -p 3000:3000 \
  -e NEXT_PUBLIC_GITHUB_CLIENT_ID=your_id \
  wu529778790/navhub:main
```

### 使用 Docker Compose

```bash
docker-compose up -d
```

详细文档：[docs/DOCKER.md](docs/DOCKER.md)

## 🔄 同步机制

```
用户操作 → localStorage (即时) → UI 更新 → 3秒防抖 → GitHub API
```

**同步方向判断：**
- GitHub 为空 → 📤 上传本地
- 本地为空 → 📥 下载 GitHub
- 本地较新 → 📤 上传覆盖
- GitHub 较新 → 📥 下载覆盖

## 🎯 使用流程

1. **访问网站** → 点击登录
2. **确认 Fork** → 授权 GitHub
3. **开始使用** → 数据自动同步

### 状态图标

| 图标 | 状态 | 说明 |
|------|------|------|
| 🟢 | 在线 | 已登录 + 网络正常 |
| ⚪ | 离线 | 无网络或未登录 |
| 🟡 | 同步中 | 正在处理 |
| ⬆️ | 上传中 | 上传到 GitHub |
| ⬇️ | 下载中 | 从 GitHub 下载 |

## 🛠️ 技术栈

- **框架**: Next.js 14 + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **拖拽**: @dnd-kit
- **图标**: Lucide React
- **存储**: localStorage + GitHub API

## 📦 数据存储

数据存储在你的 GitHub 仓库：
```
your_username/navhub.shenzjd.com
└── data/
    └── sites.json
```

## 🚀 CI/CD

自动部署到 Docker Hub 和 GHCR，并通过 SSH 自动更新服务器。

详细配置：[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## ❓ 常见问题

**Q: 数据存在哪里？**
A: 存储在你自己的 GitHub 仓库中，完全私有。

**Q: 离线能用吗？**
A: 可以。所有操作保存在本地，恢复网络后自动同步。

**Q: 如何解决冲突？**
A: 系统自动解决，基于时间戳选择最新数据。

**Q: 未登录用户能看到什么？**
A: 只读的示例数据，来自 `wu529778790/navhub.shenzjd.com`。

## 📝 开发

```bash
# 开发
pnpm dev

# 构建
pnpm build

# 生产运行
pnpm start

# 类型检查
pnpm type-check

# 代码格式化
pnpm format
```

## 📄 文档

- [Docker 部署](docs/DOCKER.md)
- [自动部署配置](docs/DEPLOYMENT.md)

---

**一句话：** 操作立即生效，数据自动同步，多设备无缝切换。
