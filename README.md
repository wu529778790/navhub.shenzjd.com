# 个人导航网站

一个支持**双向同步**的个人导航网站，数据存储在 GitHub，支持离线使用。

## ✨ 核心功能

### 🔄 双向同步机制
- **即时响应**：操作立即保存到本地，UI 瞬时更新
- **自动同步**：3秒防抖后自动上传到 GitHub
- **双向同步**：手动同步时自动判断方向（上传/下载）
- **冲突解决**：基于时间戳自动解决冲突，无需用户干预

### 🔐 GitHub 集成
- **OAuth 登录**：使用 GitHub 账号登录
- **自动 Fork**：登录时自动 Fork 仓库到你的账户
- **数据隔离**：每个用户独立仓库，数据完全私有
- **离线支持**：无网络时可正常使用，恢复网络后自动同步

### 🎯 用户体验
- **即时反馈**：所有操作立即响应
- **清晰状态**：状态图标 + Toast 通知
- **二次确认**：退出登录需要确认
- **友好提示**：登录时说明数据存储位置

## 🚀 快速开始

### 1. 环境配置

创建 `.env.local` 文件：

```env
# GitHub OAuth 配置
NEXT_PUBLIC_GITHUB_CLIENT_ID=你的_client_id
GITHUB_CLIENT_SECRET=你的_client_secret

# GitHub 仓库配置（必需）
NEXT_PUBLIC_GITHUB_OWNER=wu529778790
NEXT_PUBLIC_GITHUB_REPO=nav.shenzjd.com
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 启动开发

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 📊 同步机制详解

### 同步方向判断

```
GitHub 为空 → 📤 上传本地数据
本地为空 → 📥 下载 GitHub 数据
本地较新 → 📤 上传覆盖
GitHub 较新 → 📥 下载覆盖
时间相同 → ✅ 无需操作
```

### 数据流向

```
用户操作
  ↓
localStorage (即时保存)
  ↓
UI 更新 (瞬时响应)
  ↓
同步队列 (3秒防抖)
  ↓
GitHub API (异步上传)
```

### 状态图标说明

| 图标 | 含义 | 说明 |
|------|------|------|
| 🟢 | 在线 | 已登录 + 网络正常 |
| ⚪ | 离线/待同步 | 无网络或未登录 |
| 🟡 | 同步中 | 正在处理 |
| ⬆️ | 上传中 | 上传到 GitHub |
| ⬇️ | 下载中 | 从 GitHub 下载 |
| ⚠️ | 冲突 | 检测到冲突 |
| 🔴 | 错误 | 同步失败 |

## 🎯 使用流程

### 首次使用

1. **访问网站**
   ```
   http://localhost:3000
   ```

2. **登录 GitHub**
   - 点击 "GitHub 登录"
   - 确认 Fork 提示
   - 授权并返回

3. **开始使用**
   - 添加/编辑站点
   - 数据自动同步

### 多设备同步

```
设备 A:
1. 添加站点
2. 3秒后自动上传

设备 B:
1. 点击"同步"按钮
2. 📥 下载数据
3. 显示更新
```

## 🔧 技术实现

### 核心文件

| 文件 | 说明 |
|------|------|
| `src/lib/storage/local-storage.ts` | 本地存储管理 |
| `src/lib/storage/github-storage.ts` | GitHub API 操作 |
| `src/lib/storage/sync-manager.ts` | 同步逻辑核心 |
| `src/hooks/use-sync.ts` | React 同步 Hook |
| `src/contexts/SitesContext.tsx` | 全局状态管理 |

### 冲突解决逻辑

```typescript
const localTime = localData.lastModified || 0;
const githubTime = githubData.lastModified || 0;

if (localTime > githubTime) {
  // 本地新 → 上传
  await saveDataToGitHub(token, localData);
} else if (githubTime > localTime) {
  // GitHub 新 → 下载
  saveToLocalStorage(githubData);
} else {
  // 相同 → 无操作
}
```

## 📱 使用说明

### 登录流程

```
点击登录 → 显示 Fork 提示 → 确认 → GitHub 授权 → 自动 Fork → 返回网站
```

**Fork 提示内容：**
```
登录后，系统会自动 Fork 仓库 'wu529778790/nav.shenzjd.com' 到你的 GitHub 账户。

数据将存放在你的仓库中：
  - 文件路径: data/sites.json
  - 仓库名称: nav.shenzjd.com

其他用户登录时，会 fork 同一个仓库到他们自己的账户，数据互不干扰。

是否继续？
```

### 退出流程

```
点击头像 → 退出登录 → 二次确认 → 清除数据 → 刷新页面
```

**确认内容：**
```
⚠️ 确认退出登录

退出登录后，你将无法同步数据到 GitHub。

你的本地数据仍然保留，下次登录后可以继续使用。
```

### 同步操作

**自动同步：**
- 添加/编辑/删除站点后
- 等待 3 秒
- 自动上传到 GitHub

**手动同步：**
- 点击右上角 "同步" 按钮
- 系统自动判断方向
- 显示同步结果（Toast）

## 🛠️ 环境变量说明

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `NEXT_PUBLIC_GITHUB_CLIENT_ID` | GitHub OAuth Client ID | ✅ |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Client Secret | ✅ |
| `NEXT_PUBLIC_GITHUB_OWNER` | GitHub 用户名 | ✅ |
| `NEXT_PUBLIC_GITHUB_REPO` | 仓库名称 | ✅ |

## 📦 数据存储

### 仓库结构

```
你的仓库: your_username/nav.shenzjd.com
└── data/
    └── sites.json
```

### 数据格式

```json
{
  "version": "1.0",
  "lastModified": 1704067200000,
  "categories": [
    {
      "id": "work",
      "name": "工作",
      "icon": "💼",
      "sort": 0,
      "sites": [
        {
          "id": "site1",
          "title": "GitHub",
          "url": "https://github.com",
          "icon": "https://github.com/favicon.ico",
          "sort": 0
        }
      ]
    }
  ]
}
```

## 🔍 常见问题

### Q: 数据存在哪里？

**A:** 存储在你自己的 GitHub 仓库中（`your_username/nav.shenzjd.com`），完全私有。

### Q: 多个设备如何同步？

**A:** 只要在不同设备上登录同一个 GitHub 账号，点击"同步"即可。

### Q: 离线能用吗？

**A:** 可以。所有操作保存在本地，恢复网络后自动同步。

### Q: 如何解决冲突？

**A:** 系统自动解决，基于时间戳选择最新数据，无需手动干预。

### Q: 可以删除数据吗？

**A:** 可以。在 GitHub 仓库中删除 `data/sites.json`，或清除浏览器 localStorage。

## 📝 最佳实践

1. **保持登录状态** - 方便自动同步
2. **定期手动同步** - 确保多设备数据一致
3. **查看 GitHub 仓库** - 备份和历史记录
4. **设置仓库为私有** - 保护个人数据

## 🎉 总结

**核心优势：**
- ✅ 双向同步，数据不丢失
- ✅ 即时响应，体验流畅
- ✅ 离线支持，随时可用
- ✅ 数据私有，安全可控

**一句话：**
> 操作立即生效，数据自动同步，多设备无缝切换。

---

**版本：** v1.0
**更新日期：** 2025-12-31
