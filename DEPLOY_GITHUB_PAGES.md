# GitHub Pages 静态部署指南

本项目可部署到 **GitHub Pages**，作为纯前端静态站运行。用户在自己的浏览器中填写 API Key，直连 LongCat / DeepSeek / OpenAI 等模型。

> 如需隐藏 Key、稳定商用，请改用云服务器代理部署，参见 [DEPLOY.md](./DEPLOY.md)。

---

## 1. 部署方式

```text
GitHub Pages 静态站（HTML + CSS + JavaScript）
无 Node 后端 · 无 Docker · 无 Nginx
```

访问地址格式：

```text
https://你的GitHub用户名.github.io/你的仓库名/#/travel-planner
```

例如仓库名为 `travel-ai-demo`：

```text
https://emmaswamn.github.io/travel-ai-demo/#/travel-planner
```

---

## 2. 创建仓库并推送

```bash
git init
git add .
git commit -m "init travel ai demo"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

---

## 3. 开启 GitHub Pages

在 GitHub 仓库中：

```text
Settings → Pages → Build and deployment → Source 选择 GitHub Actions
```

---

## 4. 自动部署

推送到 `main` 或 `master` 分支后，`.github/workflows/deploy-gh-pages.yml` 会自动：

1. `npm ci`
2. `npm run build`
3. 将 `dist/` 发布到 GitHub Pages

可在仓库 **Actions** 标签页查看构建进度。

---

## 5. API Key 配置（用户操作）

进入页面后：

```text
点击「AI 配置」→ 选择模型 → 填写自己的 API Key → 测试连接 → 保存
```

- Key **只保存在当前浏览器** `localStorage`（key: `travel_ai_model_config`）
- 项目**不内置任何 Key**
- 不要在公共电脑上保存 Key

---

## 6. 注意事项

| 项目 | 说明 |
|------|------|
| 静态部署 | 无法提供 `/api/ai/chat` 后端代理 |
| 请求方式 | 浏览器直连模型 API（`requestMode: direct`） |
| Key 归属 | 用户自己填写，不是我们内置的 Key |
| CORS | 部分模型接口不支持浏览器跨域，会报 Failed to fetch |
| 商用场景 | 建议改用云服务器 + Express 代理（见 DEPLOY.md） |

---

## 7. 本地开发

```bash
npm install
npm run dev
```

本地访问：`http://localhost:5173/#/travel-planner`

本地同样使用直连模式，需在 AI 配置弹窗填写自己的 Key。

预览构建结果：

```bash
npm run build
npm run preview
```

---

## 8. 常见问题

### 页面空白

**原因：** Vite `base` 路径与仓库名不一致。

**解决：** 检查 `vite.config.ts` 中 GitHub Actions 构建时 `base` 是否为 `/${仓库名}/`。

### Failed to fetch

**原因：** 模型接口不支持浏览器跨域 CORS，或网络不可用。

**解决：**

- 换支持浏览器直连的模型接口
- 或改用云服务器代理部署（DEPLOY.md）

### 401 / 403

**原因：** 用户填写的 API Key 错误或无权限。

**解决：** 在 AI 配置弹窗重新填写并测试连接。

### Key 会不会暴露我们的 Key？

**说明：**

- 本项目**不会内置任何 Key**，也不会把 Key 提交到 GitHub
- 用户填写的 Key 存在**自己的浏览器** localStorage
- 浏览器直连时，请求头中会出现**用户自己的 Key**
- 不要在公共电脑使用

---

## 9. 相关文件

| 文件 | 作用 |
|------|------|
| `.github/workflows/deploy-gh-pages.yml` | GitHub Actions 自动部署 |
| `vite.config.ts` | GitHub Pages 子路径 `base` 配置 |
| `src/utils/travelAiConfigStorage.ts` | localStorage 读写 |
| `src/components/travel/AiConfigDialog.vue` | AI Key 配置弹窗 |
| `src/services/travelAiChat.ts` | 浏览器直连 AI 请求 |

---

## 10. 与云服务器部署的区别

| | GitHub Pages | 云服务器（DEPLOY.md） |
|--|--|--|
| 成本 | 免费 | 需要服务器 |
| Key 位置 | 用户浏览器 | 服务端 `.env` |
| 请求路径 | 直连模型 API | `/api/ai/chat` 代理 |
| CORS | 可能失败 | 无 CORS 问题 |
| 适用场景 | 演示、个人使用 | 稳定商用 |
