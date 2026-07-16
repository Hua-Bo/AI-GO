# AI 农业种植助手

移动端优先的中老年友好农业助手，集成在本仓库中。

## 如何启动

```bash
npm install
npm run dev
```

浏览器打开：

```text
http://localhost:5173/#/agri-assistant
```

## 如何切换 Mock

在 `.env.local`（可复制 `.env.example`）中设置：

```env
VITE_USE_MOCK=true
VITE_API_BASE_URL=/api
```

- `VITE_USE_MOCK=true`：使用本地 Mock（默认），可无后端演示
- `VITE_USE_MOCK=false`：请求 `VITE_API_BASE_URL` 下的真实接口

Mock 时：
- 语音可用浏览器语音识别；不支持时回落演示文案
- 图片本地压缩并转 dataURL
- AI 分析默认返回 Mock JSON；若已在「旅游攻略」页配置过 AI Key，会尝试直连模型

## 如何配置真实接口

后端需提供与需求文档一致的接口：

- `POST /api/speech/transcribe`
- `POST /api/files/upload`
- `POST /api/agriculture/analyze`
- `GET /api/tasks/today`
- `GET /api/records`
- `GET /api/records/:id`

前端封装在 `src/api/agri.ts`。

## 功能入口

| 路径 | 说明 |
|------|------|
| `/#/agri-assistant` | 首页 |
| `/#/agri-assistant/voice` | 按住说话 |
| `/#/agri-assistant/camera` | 拍照 |
| `/#/agri-assistant/analyze` | 分析中 |
| `/#/agri-assistant/result` | 结果 |
| `/#/agri-assistant/today` | 今日任务 |
| `/#/agri-assistant/records` | 种植记录 |
| `/#/agri-assistant/crop` | 作物档案 |
| `/#/agri-assistant/settings` | 设置 |

## 打包与部署

```bash
npm run build
```

静态资源在 `dist/`，与现有 GitHub Pages / Nginx 部署方式相同。部署后访问：

```text
https://你的域名/#/agri-assistant
```
