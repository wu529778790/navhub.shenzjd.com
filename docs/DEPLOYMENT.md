# 自动部署配置指南

## GitHub Actions 自动部署

本项目配置了完整的 CI/CD 流程，代码推送到 `main` 分支后会自动：
1. 构建 Docker 镜像
2. 推送到 Docker Hub 和 GHCR
3. 自动部署到服务器

## 需要配置的 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets：

### 1. Docker Hub 相关
| Secret | 说明 | 获取方式 |
|--------|------|----------|
| `DOCKER_HUB_USERNAME` | Docker Hub 用户名 | Docker Hub 账户设置 |
| `DOCKER_HUB_TOKEN` | Docker Hub Access Token | [Docker Hub Settings → Security → New Access Token](https://hub.docker.com/settings/security) |

### 2. SSH 服务器相关
| Secret | 说明 | 示例 |
|--------|------|------|
| `SSH_HOST` | 服务器 IP 或域名 | `192.168.1.100` 或 `example.com` |
| `SSH_USERNAME` | SSH 用户名 | `root` 或 `deploy` |
| `SSH_PRIVATE_KEY` | SSH 私钥 | 服务器的 SSH 私钥内容 |
| `SSH_PORT` | SSH 端口 (可选) | `22` (默认) |
| `SSH_DEPLOY_PATH` | 部署目录路径 | `/opt/navhub` |

## 服务器端准备

### 1. 创建专用用户（推荐）

```bash
# 在服务器上创建部署用户
sudo useradd -m -s /bin/bash deploy

# 添加到 docker 组（避免每次使用 sudo）
sudo usermod -aG docker deploy

# 设置 SSH 目录
sudo mkdir -p /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh

# 将公钥添加到 authorized_keys
sudo tee /home/deploy/.ssh/authorized_keys <<EOF
ssh-rsa AAAAB3NzaC1yc2E... your_public_key
EOF

sudo chmod 600 /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
```

### 2. 创建部署目录

```bash
# 创建项目目录
sudo mkdir -p /opt/navhub
sudo chown deploy:deploy /opt/navhub

# 切换到部署用户
su - deploy

# 进入目录并初始化
cd /opt/navhub

# 克隆仓库（如果还没有）
git clone https://github.com/wu529778790/navhub.shenzjd.com.git .

# 创建 docker-compose.yml
# 可以直接使用项目中的 docker-compose.yml
```

### 3. 配置环境变量

在服务器上创建 `.env` 文件：

```bash
# /opt/navhub/.env
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
```

### 4. 首次手动部署测试

```bash
# 在服务器上测试
cd /opt/navhub
docker-compose pull
docker-compose up -d
docker-compose logs -f
```

## GitHub Secrets 配置步骤

### 1. 访问仓库设置
打开 GitHub 仓库 → Settings → Secrets and variables → Actions

### 2. 添加 Secrets
点击 "New repository secret"，逐个添加：

```
Name: DOCKER_HUB_USERNAME
Value: wu529778790
```

```
Name: DOCKER_HUB_TOKEN
Value: (你的 Docker Hub Token)
```

```
Name: SSH_HOST
Value: 你的服务器IP或域名
```

```
Name: SSH_USERNAME
Value: deploy
```

```
Name: SSH_PRIVATE_KEY
Value: (服务器的 SSH 私钥内容)
```

```
Name: SSH_DEPLOY_PATH
Value: /opt/navhub
```

### 3. 获取 SSH 私钥

```bash
# 在本地生成 SSH 密钥对（如果还没有）
ssh-keygen -t rsa -b 4096 -C "github-actions@navhub"

# 查看私钥内容
cat ~/.ssh/id_rsa

# 将公钥添加到服务器
ssh-copy-id -i ~/.ssh/id_rsa.pub deploy@your-server-ip
```

## 部署流程

### 完整流程

1. **本地开发**
   ```bash
   git add .
   git commit -m "你的修改"
   git push origin main
   ```

2. **GitHub Actions 自动执行**
   - ✅ 构建 Docker 镜像
   - ✅ 推送到 Docker Hub
   - ✅ 推送到 GHCR
   - ✅ SSH 连接服务器
   - ✅ 拉取最新代码
   - ✅ 拉取最新镜像
   - ✅ 重启服务
   - ✅ 清理旧镜像

3. **查看部署状态**
   - 在 GitHub 仓库的 Actions 标签页查看进度
   - 部署成功后访问你的网站

## 手动触发部署

如果需要手动触发部署（不推送代码）：

1. 在 GitHub Actions 页面
2. 找到 "Build and Push Docker Images" 工作流
3. 点击 "Run workflow"
4. 选择分支并运行

## 部署脚本说明

工作流中的部署脚本执行以下操作：

```bash
# 1. 进入项目目录
cd /opt/navhub

# 2. 更新代码
git pull origin main

# 3. 拉取最新镜像
docker pull <dockerhub-username>/navhub.shenzjd.com:main

# 4. 停止旧服务
docker-compose down

# 5. 启动新服务
docker-compose up -d

# 6. 清理旧镜像
docker image prune -f
docker container prune -f

# 7. 查看状态
docker-compose ps
```

## 回滚方案

如果新版本有问题，可以快速回滚：

```bash
# 在服务器上执行
cd /opt/navhub

# 拉取之前的镜像版本
docker pull <dockerhub-username>/navhub.shenzjd.com:sha-旧版本哈希

# 修改 docker-compose.yml 使用特定版本
# image: <dockerhub-username>/navhub.shenzjd.com:sha-旧版本哈希

# 重启服务
docker-compose down && docker-compose up -d
```

## 监控部署

### 查看部署日志
```bash
# 在服务器上
docker-compose logs -f

# 查看特定时间的日志
docker-compose logs --since 1h
```

### 检查服务状态
```bash
docker-compose ps
docker stats
```

## 常见问题

### 1. SSH 连接失败
- 检查 `SSH_PRIVATE_KEY` 是否正确
- 确保服务器的 `~/.ssh/authorized_keys` 包含对应的公钥
- 测试 SSH 连接：`ssh -i <私钥文件> <username>@<host>`

### 2. Docker 权限问题
- 确保 `deploy` 用户在 `docker` 组中
- 或者在部署脚本中使用 `sudo docker`

### 3. 端口冲突
- 确保服务器的 3000 端口未被占用
- 或修改 `docker-compose.yml` 中的端口映射

### 4. 环境变量缺失
- 确保服务器上有 `.env` 文件
- 或在 `docker-compose.yml` 中直接定义环境变量

## 安全建议

1. **使用专用用户**：不要用 root 用户部署
2. **限制 SSH 权限**：可以使用 `command` 限制只能执行特定命令
3. **定期更新密钥**：定期轮换 SSH 密钥
4. **使用私有仓库**：如果代码私有，使用 GHCR 或私有 Docker Hub
5. **备份数据**：定期备份数据卷

## 高级配置

### 使用不同的部署环境

可以为不同分支配置不同环境：

```yaml
# 在 workflow 中添加条件
- name: Deploy to staging
  if: github.ref == 'refs/heads/develop'
  run: |
    ssh user@staging-server "cd /opt/navhub-staging && ..."

- name: Deploy to production
  if: github.ref == 'refs/heads/main'
  run: |
    ssh user@prod-server "cd /opt/navhub && ..."
```

## 镜像命名规则（与 CI 一致）

- Docker Hub 镜像名：`${DOCKER_HUB_USERNAME}/${{ github.event.repository.name }}`
- GHCR 镜像名：`ghcr.io/${{ github.repository_owner }}/${{ github.event.repository.name }}`
- 其中 `${{ github.event.repository.name }}` 会自动取当前项目仓库名，无需手动修改。

### 多服务器部署

```yaml
- name: Deploy to multiple servers
  uses: appleboy/ssh-action@v1.0.3
  with:
    host: ${{ secrets.SSH_HOST }}
    username: ${{ secrets.SSH_USERNAME }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    script: |
      for server in server1 server2 server3; do
        ssh $server "cd /opt/navhub && docker-compose pull && docker-compose up -d"
      done
```

## 验证部署

部署完成后，访问：
- 主页：`http://your-domain.com`
- 健康检查：`http://your-domain.com/api/health` (如果配置了)

如果看到应用正常运行，说明部署成功！🎉
