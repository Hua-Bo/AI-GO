# AI 旅游攻略 — 云服务器部署指南

部署架构：

```text
浏览器 → https://域名 → Nginx → http://127.0.0.1:3000 (Express)
                                    ├─ 托管 dist 静态资源
                                    └─ POST /api/ai/chat → LongCat / DeepSeek / OpenAI
```

线上 **AI Key 只放在服务端** `.env` 的 `AI_API_KEY`，浏览器通过同源 `/api/ai/chat` 代理请求，不会暴露 Key。

---

## 1. 本地开发

安装依赖：

```bash
npm install
```

方式 A：分别启动前后端（推荐调试）：

```bash
# 终端 1：Express 代理 + 健康检查
npm run dev:server

# 终端 2：Vite 前端（5173，/api 代理到 3000）
npm run dev
```

方式 B：一键启动：

```bash
npm run dev:full
```

访问前端：`http://localhost:5173`  
AI 请求路径：`/api/ai/chat` → `http://localhost:3000/api/ai/chat`

本地需在项目根目录配置 `.env`（可复制 `.env.production.example`）：

```env
AI_API_KEY=你的_LongCat_Key
```

---

## 2. 本地生产预览

```bash
npm run build
npm run server
```

或：

```bash
npm run preview:prod
```

访问：`http://localhost:3000`

---

## 3. 云服务器 Docker 部署

建议目录：`/opt/travel-ai`

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | bash
systemctl enable docker
systemctl start docker

# 安装 compose 插件
apt update
apt install docker-compose-plugin -y

# 拉取代码
mkdir -p /opt/travel-ai
cd /opt/travel-ai
git clone 你的仓库地址 .

# 配置 Key（不要提交到 Git）
echo "AI_API_KEY=你的_LongCat_Key" > .env

# 构建并启动
docker compose up -d --build

# 查看日志
docker logs -f travel-ai
```

访问：`http://服务器IP:3000`

---

## 4. Nginx 反向代理

```bash
apt update
apt install nginx -y
cp deploy/nginx.conf.example /etc/nginx/conf.d/travel-ai.conf
# 编辑 server_name 为你的域名
nano /etc/nginx/conf.d/travel-ai.conf
nginx -t
systemctl reload nginx
```

---

## 5. HTTPS

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d 你的域名.com
```

---

## 6. 更新部署

```bash
cd /opt/travel-ai
git pull
docker compose up -d --build
docker logs -f travel-ai
```

非 Docker 方式可用 PM2：

```bash
npm run build
pm2 start ecosystem.config.cjs
pm2 save
```

---

## 7. 健康检查

```bash
curl http://127.0.0.1:3000/api/health
```

期望返回：

```json
{"ok":true,"service":"travel-ai","time":"..."}
```

---

## 8. 常见问题

### Failed to fetch

**原因：** 浏览器直连 AI 接口被 CORS 拦截，或后端未启动。

**解决：**

1. 前端使用代理模式，请求 `/api/ai/chat`
2. 确认 `npm run dev:server` 或 Docker 容器在运行
3. `curl http://127.0.0.1:3000/api/health` 应返回 ok

### API Key 暴露

**说明：** 直连模式会在浏览器 Network 里看到 `Authorization: Bearer ...`。

**解决：** 线上必须使用代理模式；Key 只配置在服务器 `.env` 的 `AI_API_KEY`。

### 401 / 403

**说明：** `AI_API_KEY` 错误或没有权限。

**解决：** 检查 `.env` / `docker-compose` 环境变量中的 Key 是否正确。

### JSON 解析失败

**说明：** 模型输出不是严格 JSON。

**解决：** 降低 temperature，或分步生成；查看接口返回的原始文本。

### Nginx 502

**说明：** Node 服务未启动，或 3000 端口未监听。

**解决：**

```bash
docker ps
docker logs travel-ai
curl http://127.0.0.1:3000/api/health
```

---

## 环境变量说明

| 变量 | 说明 |
|------|------|
| `PORT` | 服务端口，默认 3000 |
| `AI_PROVIDER` | 默认模型提供商，如 `longcat` |
| `AI_MODEL` | 默认模型名 |
| `AI_BASE_URL` | 上游 API 基础地址 |
| `AI_API_KEY` | **服务端 Key，必填** |
| `AI_MAX_TOKENS` | 最大 token，默认 4096 |
| `AI_REQUEST_TIMEOUT` | 超时毫秒，默认 120000 |
| `AI_ALLOW_CLIENT_PROVIDER` | 是否允许前端传 provider/baseURL/model |

前端变量（构建时注入，可选）：

| 变量 | 说明 |
|------|------|
| `VITE_AI_REQUEST_MODE` | 默认 `proxy` |
| `VITE_AI_PROXY_URL` | 默认 `/api/ai/chat` |
| `VITE_AI_PROVIDER` | 默认提供商展示用 |
