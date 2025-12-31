# Docker 部署指南

## 快速开始

### 1. 使用 Docker Compose (推荐)

```bash
# 克隆仓库
git clone https://github.com/wu529778790/navhub.shenzjd.com.git
cd navhub.shenzjd.com

# 配置环境变量
echo "NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id" > .env

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f navhub
```

### 2. 使用 Docker 直接运行

```bash
# 从 Docker Hub 拉取镜像
docker pull wu529778790/navhub:main

# 运行容器
docker run -d \
  --name navhub \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id \
  -v navhub_data:/app/data \
  --restart unless-stopped \
  wu529778790/navhub:main
```

### 3. 从 GitHub Container Registry 拉取

```bash
# 从 GHCR 拉取镜像
docker pull ghcr.io/wu529778790/navhub:main

# 运行容器
docker run -d \
  --name navhub \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id \
  -v navhub_data:/app/data \
  --restart unless-stopped \
  ghcr.io/wu529778790/navhub:main
```

## 镜像仓库

本项目自动构建并发布到以下镜像仓库：

### Docker Hub
- **仓库**: `wu529778790/navhub`
- **标签**:
  - `main` - 最新开发版本
  - `v1.0.0` - 特定版本
  - `sha-abc123` - SHA 提交哈希

### GitHub Container Registry (GHCR)
- **仓库**: `ghcr.io/wu529778790/navhub`
- **标签**: 同上

## 环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `NEXT_PUBLIC_GITHUB_CLIENT_ID` | 是 | GitHub OAuth 应用的 Client ID |
| `NODE_ENV` | 否 | 运行环境 (production/development)，默认为 production |

## 数据持久化

容器使用命名卷 `navhub_data` 来持久化数据，包括：
- 站点数据 (`data/sites.json`)
- 配置文件

查看卷位置：
```bash
docker volume inspect navhub_data
```

## 配置 GitHub OAuth

1. 在 GitHub 创建 OAuth App:
   - Homepage URL: `http://your-domain.com`
   - Authorization callback URL: `http://your-domain.com/api/auth/callback/github`

2. 获取 Client ID 和 Client Secret

3. 配置环境变量：
   ```bash
   # docker-compose.yml 或 docker run 命令
   NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id
   ```

## 更新部署

### 使用 Docker Compose

```bash
# 停止并删除旧容器
docker-compose down

# 拉取最新镜像
docker-compose pull

# 重新启动
docker-compose up -d
```

### 使用 Docker

```bash
# 停止旧容器
docker stop navhub
docker rm navhub

# 拉取最新镜像
docker pull wu529778790/navhub:main

# 重新运行
docker run -d ... (同上)
```

## 监控和日志

### 查看日志
```bash
# Docker Compose
docker-compose logs -f

# Docker
docker logs -f navhub
```

### 查看状态
```bash
# Docker Compose
docker-compose ps

# Docker
docker ps | grep navhub
```

### 健康检查
容器内置健康检查，每 30 秒检查一次应用是否正常响应。

## 反向代理配置

### Nginx 示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Caddy 示例

```caddyfile
your-domain.com {
    reverse_proxy localhost:3000
}
```

## 常见问题

### 端口冲突
如果 3000 端口已被占用，修改映射：
```bash
docker run -d -p 8080:3000 ...
```

### 权限问题
确保数据卷有正确的权限：
```bash
docker exec -it navhub chown -R nextjs:nodejs /app/data
```

### 内存不足
如果遇到 OOM，可以增加内存限制：
```bash
docker run -d --memory=512m ...
```

## 开发环境

如果要在本地开发，不需要 Docker：

```bash
npm install
npm run dev
```

## CI/CD

GitHub Actions 会在以下情况自动构建镜像：
- 推送到 `main` 分支
- 创建版本标签 (如 `v1.0.0`)
- 手动触发工作流

镜像会同时推送到 Docker Hub 和 GHCR。
