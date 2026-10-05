# PromptForge Docker Compose 部署

当前部署方案把前端、后端和 Nginx 放在同一台 Ubuntu 24.04 ECS 上：只有 Nginx 发布宿主机的 80/443 端口，前端和后端只通过 Compose 内部网络通信。

## 1. 服务器准备

在服务器上安装 Docker Engine 和 Docker Compose Plugin，然后确认：

```bash
docker --version
docker compose version
```

安全组只需要保留：

- TCP 22：SSH
- TCP 80：HTTP / ACME 验证
- TCP 443：HTTPS

不要把 3000、7001 或数据库端口发布到公网。

## 2. 上传项目并配置环境变量

把整个仓库上传到服务器，例如 `/opt/promptforge`，然后执行：

```bash
cd /opt/promptforge
cp backend/.env.example backend/.env
nano backend/.env
```

至少需要根据实际使用的模型填写：

- `MAIN_MODEL_PROVIDER=gpt` 时填写 `OPENAI_API_KEY`、`OPENAI_MODEL`，必要时调整 `OPENAI_BASE_URL`。
- `MAIN_MODEL_PROVIDER=deepseek` 时填写 `DEEPSEEK_API_KEY`、`DEEPSEEK_MODEL`，必要时调整 `DEEPSEEK_BASE_URL`。

真实 API Key 只放在服务器上的 `backend/.env`，不要提交到 Git、不要写入 Dockerfile，也不要把它复制到聊天中。若只想验证页面和容器连通性，可临时设置 `MOCK_MODE=true`；正式使用模型时改回 `false`。

## 3. 域名解析

在阿里云域名解析中添加：

```text
记录类型：A
主机记录：promptforge
记录值：47.97.98.39
```

解析生效后，`promptforge.pjhao.xyz` 会指向这台 ECS。当前方案不需要 Sites 的 CNAME 或 TXT 记录。

若在同一台 ECS 部署 SQLChat，还需添加 `db-genius` 的 A 记录，指向相同公网 IP。SQLChat 前端容器需接入 `promptforge_promptforge` Docker 网络并注册 `sqlchat-frontend` 网络别名；Nginx 使用该别名和 Docker 内置 DNS 转发请求。对应的 TLS 证书 SAN 也必须包含 `db-genius.pjhao.xyz`。

## 4. 推荐：GitHub Actions 自动发布并部署

推送到 GitHub 的 `main` 分支后，`Publish and deploy PromptForge` 会在 GitHub-hosted runner 构建 `linux/amd64` 的后端、前端和 Nginx 镜像，推送到 GHCR，并通过严格校验 SSH 主机密钥的连接，在 ECS 上按该提交的完整 SHA 拉取镜像。ECS 只拉取和运行镜像，不会安装 pnpm 依赖或构建代码，适合当前 2 vCPU、约 2 GiB 内存服务器。按 SHA 部署可准确识别版本；部署失败时脚本会恢复部署前的三个镜像标签并重新启动旧版本。

首次使用前，在 GitHub 的 PromptForge 仓库打开 `Settings → Secrets and variables → Actions`，新增以下 **Repository secrets**。这些值是仓库专用的；SQLChat 仓库中的 secrets 不会自动共享：

| Secret 名称 | 内容 |
| --- | --- |
| `PROMPTFORGE_ECS_HOST` | ECS 公网 IP 或 SSH 主机名 |
| `PROMPTFORGE_ECS_USER` | 具备 root 权限的 SSH 用户（当前服务器使用 `root`） |
| `PROMPTFORGE_ECS_SSH_PRIVATE_KEY` | 对应 ECS `authorized_keys` 公钥的 SSH 私钥全文；必须能在 GitHub Actions 中无交互使用（请使用未设置 passphrase 的部署专用密钥） |
| `PROMPTFORGE_ECS_KNOWN_HOSTS` | 已核实的 ECS SSH 主机公钥记录全文；不得通过 Action 临时 `ssh-keyscan` 信任未知主机 |

可选的 `PROMPTFORGE_ECS_SSH_PORT` 用于非默认 SSH 端口；不设置时使用 `22`。GHCR 登录使用本次 Actions 运行的短期 `GITHUB_TOKEN`，通过 SSH 标准输入传给 ECS，不需要额外的长期 Registry token secret。三个 GHCR packages 必须关联到本仓库并允许 Actions 访问；workflow 为 `GITHUB_TOKEN` 授予 `packages: write`。部署时凭据放在临时 Docker 配置目录，完成或失败都会删除。

确认 `/opt/promptforge/docker-compose.yml` 和服务器专用 `/opt/promptforge/backend/.env` 已存在且可用后，配置上述 secrets。此后每次将变更推送到 `main`，Actions 会自动构建、发布和部署；在 Actions 运行详情中查看三个服务的健康检查结果。部署过程不会覆盖服务器的 `backend/.env`、TLS 证书或 ACME webroot。脚本保留按 SHA 发布的镜像，失败时会把 Compose 使用的 `latest` 标签恢复到原镜像并尝试重新启动原栈。

工作流也支持在 `main` 上手动 `workflow_dispatch`。旧的 `Build Docker images` 手动 artifact 工作流仍保留为回退方式：选择 `Build Docker images` 并下载 artifact，然后按下一节手动传输和加载。

### 手动 Artifact 回退

1. 打开仓库的 `Actions`，选择 `Build Docker images` 并运行。
2. 下载本次运行的 `promptforge-images-<commit-sha>.zip`，解压得到 `promptforge-images.tar.gz`。
3. 在 PowerShell 上传：`scp .\promptforge-images.tar.gz root@<ECS_IP>:/opt/promptforge/`。
4. 在 ECS 执行：

```bash
cd /opt/promptforge
docker load --input ./promptforge-images.tar.gz
docker compose up -d --no-build
docker compose ps
```

该 workflow 只使用 `.env.example` 和公共 npm registry 构建，不会读取模型 API Key。

## 5. 备用：本地构建镜像并上传到 ECS

这台 ECS 只有 2 vCPU 和约 2 GiB 内存，推荐在本地 Docker Desktop 构建镜像，服务器只负责加载镜像和运行容器。下面的命令在 Windows PowerShell 中执行。

先启动 Docker Desktop，然后在项目根目录执行：

```powershell
Set-Location "C:\path\to\promptFormat"

docker compose build backend frontend nginx

docker save --output .\promptforge-images.tar `
  promptforge-backend:latest `
  promptforge-frontend:latest `
  promptforge-nginx:latest

scp .\promptforge-images.tar root@47.97.98.39:/opt/promptforge/
```

`docker compose build` 默认使用中国大陆可访问性更好的 npm 镜像；需要切换 registry 时，可以在构建前设置：

```powershell
$env:NPM_REGISTRY = "https://registry.npmjs.org"
docker compose build backend frontend nginx
```

上传完成后，在 ECS 上执行：

```bash
cd /opt/promptforge
docker load --input ./promptforge-images.tar
docker image ls --filter=reference='promptforge-*'
docker compose up -d --no-build
docker compose ps
```

`docker compose up -d --no-build` 会直接使用刚刚加载的三个镜像，不会在服务器上执行 `pnpm install` 或重新构建。确认启动成功后，可以删除服务器上的导出包释放空间：

```bash
rm -- ./promptforge-images.tar
```

不要把 `backend/.env` 放进压缩包或上传包，也不要把 `promptforge-images*.tar` 提交到 Git；导出包通常很大，根目录 `.gitignore` 已经忽略了这类文件。服务器仍需要单独配置 `backend/.env`，具体见第 2 节。

如果仓库中的 Compose 配置还没有同步到服务器，先执行：

```bash
cd /opt/promptforge
git pull --ff-only origin main
```

注意：`git pull` 只同步 Compose 和 Nginx 等配置，不会替代镜像上传；服务器必须先执行 `docker load`。

## 6. 构建依赖源与启动 HTTP 版本

Docker 构建默认使用中国大陆可访问性更好的 npm 镜像：

```text
https://registry.npmmirror.com
```

前端和后端的所有 `pnpm install` 都会使用这个源。需要切换到其他 registry 时，在构建时覆盖 `NPM_REGISTRY` 即可，例如：

```bash
NPM_REGISTRY=https://registry.npmjs.org docker compose build
```

也可以只构建单个服务：

```bash
NPM_REGISTRY=https://registry.npmjs.org docker compose build frontend
```

不设置 `NPM_REGISTRY` 时，会回退到 Dockerfile 和 Compose 中声明的默认镜像源。

如果改为在服务器本地构建，首次启动前端和后端可以执行：

```bash
docker compose build
docker compose up -d
docker compose ps
```

没有证书文件时，Nginx 自动使用 HTTP 配置；此时可以先访问：

```text
http://promptforge.pjhao.xyz
```

Nginx 的 `/api/` 请求会转发到 `backend:7001`，其他请求会转发到 `frontend:3000`。前端浏览器请求默认使用同源 `/api`，不会暴露后端容器地址。

查看日志：

```bash
docker compose logs --tail=100 backend
docker compose logs --tail=100 frontend
docker compose logs --tail=100 nginx
```

## 7. 启用 HTTPS

可以使用阿里云 SSL 证书或 ACME 工具申请证书。将证书文件放到服务器上的以下路径：

```text
deploy/nginx/certs/fullchain.pem
deploy/nginx/certs/privkey.pem
```

文件只保存在服务器，不要提交到仓库。然后重新创建 Nginx 容器：

```bash
chmod 600 deploy/nginx/certs/privkey.pem
docker compose up -d --force-recreate nginx
```

检测到两个非空证书文件后，Nginx 会自动加载 HTTPS 配置：80 重定向到 443，SSE 的 `/api/chat` 保持 HTTP/1.1、关闭代理缓冲，并允许较长的读取时间。

证书续期后重新执行 `docker compose up -d --force-recreate nginx` 即可加载新证书。

配置包含 `db-genius.pjhao.xyz` 的独立 HTTP/HTTPS 虚拟主机：有证书时 HTTP 会跳转 HTTPS，ACME challenge 路径仍由 webroot 提供；HTTPS 请求转发至 `sqlchat-frontend:80`，最大上传体积为 21 MiB，并关闭代理缓冲、设置长超时以支持 SSE。无证书时使用的 `http.conf` 也包含该域名的 HTTP 代理入口。上游以变量配合 `127.0.0.11` 动态解析，因此 SQLChat 前端尚未启动时 Nginx 仍能启动；此时访问新域名会返回上游连接错误。

## 8. 更新版本

正常更新只需将代码推送到 `main`，等待 `Publish and deploy PromptForge` 成功。需要人工回退时，在 ECS 上选择之前成功发布的 commit SHA，并运行：

```bash
cd /opt/promptforge
read -r -p 'GitHub 用户名: ' GHCR_USERNAME
read -r -s -p '有 read:packages 权限的 GitHub token: ' GHCR_READ_TOKEN; printf '\n'
read -r -p '要回退的 40 位 commit SHA: ' PROMPTFORGE_COMMIT_SHA
printf '%s\n%s\n' "$GHCR_READ_TOKEN" "$GHCR_USERNAME" | sudo bash deploy/deploy-ghcr.sh "$PROMPTFORGE_COMMIT_SHA"
unset GHCR_READ_TOKEN GHCR_USERNAME PROMPTFORGE_COMMIT_SHA
```

手动回退时需要 GitHub 用户名和一个有 `read:packages` 权限的 token（可使用单独的最小权限 PAT）。以上 `read -s` 会隐藏 token 输入；脚本会重新拉取指定 SHA 并执行同样的健康检查和失败回滚。旧的手动 artifact 和本地构建流程仍可按第 4、5 节回退。

如果使用旧手动 artifact 流程，重新运行 `Build Docker images`，下载带有新 commit SHA 的 artifact，上传 `promptforge-images.tar.gz`，然后在 ECS 上执行：

```bash
cd /opt/promptforge
git pull --ff-only origin main
docker load --input ./promptforge-images.tar.gz
docker compose up -d --no-build
docker compose ps
rm -- ./promptforge-images.tar.gz
```

如果 Docker 不接受 gzip 输入，改用：

```bash
gunzip -c ./promptforge-images.tar.gz | docker load
```

本地构建并上传仍然可用，完整命令如下：

在本地重新构建并导出三个同名镜像，然后上传到服务器：

```powershell
docker compose build backend frontend nginx
docker save --output .\promptforge-images.tar `
  promptforge-backend:latest `
  promptforge-frontend:latest `
  promptforge-nginx:latest
scp .\promptforge-images.tar root@47.97.98.39:/opt/promptforge/
```

服务器上执行：

```bash
cd /opt/promptforge
git pull --ff-only origin main
docker load --input ./promptforge-images.tar
docker compose up -d --no-build
docker image prune -f
rm -- ./promptforge-images.tar
```

`docker image prune -f` 只清理未被容器使用的悬空镜像；执行前仍建议确认服务器上没有其他重要的 Docker 工作负载依赖这些镜像。更新过程中不会覆盖服务器上的 `backend/.env`。

## 9. 本地开发

本地默认仍使用 Next rewrite：浏览器请求 `/api`，Next 将其转发到 `http://localhost:7001`。如需让浏览器直接访问其他 API 地址，可在前端构建/开发环境设置：

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:7001/api
```

这个变量会进入浏览器端代码，只能填写公开地址，不能填写 API Key。

## 10. 公开接口保护

`POST /api/chat` 默认每个 IP 在 10 分钟内最多 5 次，同时限制每个 IP 只有 1 个生成请求在运行；单次请求还限制消息数量、提示词长度、JSON 体积，并在 SSE 长时间没有模型事件时发送心跳。限流状态只存在于当前后端进程，重启后会清空，不依赖数据库。
