# GitHub 仓库设置说明

当前项目已准备好，但需要连接到 GitHub 仓库。

## 步骤 1: 在 GitHub 上创建新仓库

1. 访问 https://github.com/new
2. 创建一个新仓库（例如：`nav.shenzjd.com`）
3. **不要**初始化 README、.gitignore 或 license（保持空仓库）

## 步骤 2: 添加远程仓库并推送

在终端中执行以下命令（替换 `<your-username>` 和 `<repo-name>`）：

```bash
# 进入项目目录
cd D:\coding\nav.shenzjd.com

# 添加远程仓库
git remote add origin https://github.com/<your-username>/<repo-name>.git

# 推送到新分支
git push -u origin feature/local-storage-sync
```

## 步骤 3: 在 GitHub 上创建 Pull Request

1. 访问你的仓库：https://github.com/<your-username>/<repo-name>
2. 你会看到 `feature/local-storage-sync` 分支的推送提示
3. 点击 "Compare & pull request"
4. 创建 PR，保留 `main` 分支不变

## 已完成的工作

✅ 项目已提交到本地分支 `feature/local-storage-sync`
✅ 所有代码已就绪
✅ 构建测试通过

## 环境变量配置

在 GitHub 仓库的 Settings → Secrets and variables → Actions 中添加：

- `NEXT_PUBLIC_GITHUB_CLIENT_ID` - GitHub OAuth 客户端 ID
- `GITHUB_CLIENT_ID` - GitHub OAuth 客户端 ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth 客户端密钥

（这些是可选的，仅用于 GitHub 登录和同步功能）
