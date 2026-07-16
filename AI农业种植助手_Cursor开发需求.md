# AI 农业种植助手前端开发需求

## 一、项目目标

开发一个适合中老年农户使用的 AI 农业种植助手。

用户可以：

- 按住说话，描述农作物问题
- 拍摄农作物照片
- 获取简单、直接的处理建议
- 查看今天该做什么
- 点击按钮朗读 AI 建议

核心要求：

- 页面文字少
- 字体大
- 按钮大
- 操作简单
- 不展示长篇大论
- AI 结果必须直接告诉用户下一步做什么

---

## 二、技术栈

- Vue 3
- Vite
- TypeScript
- Pinia
- Vue Router
- Axios
- Element Plus
- SCSS
- i18n 预留
- 移动端优先
- 支持 PWA，可添加到手机桌面

项目名称建议：

```text
farm-ai-assistant
```

---

## 三、用户端定位

主要使用者是不会复杂操作、阅读耐心较低的中老年农户。

设计时必须遵循：

- 默认字号不小于 18px
- 标题字号不小于 24px
- 主要按钮高度不小于 56px
- 主要按钮宽度尽量占满
- 一个页面只突出一个主要操作
- 不使用复杂表格
- 不使用专业术语
- 不显示大段 AI 内容
- 所有重要结果支持语音朗读

---

## 四、首页设计

首页只保留四个主要入口。

### 1. 按住说话

按钮文案：

```text
按住说话
```

辅助文案：

```text
告诉我地里出了什么问题
```

交互：

1. 长按按钮开始录音
2. 松开结束录音
3. 显示语音识别后的文字
4. 用户可点击“重新说”
5. 用户可点击“确认提交”

语音示例：

```text
甜瓜叶子发黄，前两天下过雨，现在有些叶子边缘发干。
```

---

### 2. 拍照看看

按钮文案：

```text
拍照看看
```

辅助文案：

```text
拍叶子、果实或者整株
```

交互：

1. 点击后调用手机相机
2. 支持连续拍摄 1 至 5 张
3. 图片上传前自动压缩
4. 显示图片缩略图
5. 支持删除和重新拍摄
6. 上传后进入 AI 分析页面

拍照引导只使用简短文字：

```text
先拍整株
再拍有问题的地方
```

---

### 3. 今天干什么

按钮文案：

```text
今天干什么
```

进入后只显示今天最重要的 1 至 3 个任务。

示例：

```text
1. 上午检查甜瓜叶子
2. 今天先不要浇大水
3. 傍晚再拍一张照片
```

每个任务支持：

- 完成
- 语音朗读
- 稍后提醒

---

### 4. 我的种植记录

按钮文案：

```text
种植记录
```

只展示：

- 日期
- 作物
- 一张缩略图
- 问题标题
- 当前状态

状态包括：

```text
正常
需要注意
建议找农技人员
```

---

## 五、AI 分析结果页面

AI 结果禁止直接展示长篇 Markdown。

页面只显示四个区域。

### 1. 当前判断

最多两句话。

示例：

```text
叶子可能受潮后出现病害。
目前还不能完全确定。
```

显示状态标签：

```text
正常
需要注意
风险较高
```

---

### 2. 今天先做什么

最多三条，每条不超过 20 个字。

示例：

```text
先不要浇大水
检查叶片背面
把严重病叶单独放置
```

---

### 3. 什么时候再看

示例：

```text
明天傍晚再拍一次
```

或者：

```text
两天后检查有没有扩大
```

---

### 4. 风险提醒

只有存在风险时显示。

示例：

```text
如果大面积扩散，请联系当地农技人员。
```

禁止 AI 直接给出高风险农药配比。

涉及农药时，只允许显示：

```text
建议先确认病害，再按农药标签或农技人员指导使用。
```

---

## 六、AI 输出格式

要求后端或模型严格返回 JSON，不要直接返回自由文本。

```json
{
  "status": "attention",
  "statusText": "需要注意",
  "summary": [
    "叶子可能受潮后出现病害。",
    "目前还不能完全确定。"
  ],
  "todayActions": [
    "先不要浇大水",
    "检查叶片背面",
    "拍一张近距离照片"
  ],
  "nextCheck": "明天傍晚再检查一次",
  "riskWarning": "如果大面积扩散，请联系当地农技人员。",
  "needMorePhotos": true,
  "photoTips": [
    "拍叶片正面",
    "拍叶片背面"
  ]
}
```

前端必须对字段做长度限制。

建议：

- summary 最多 2 条
- todayActions 最多 3 条
- photoTips 最多 3 条
- 单条文字超过长度时自动截断或请求重新生成

---

## 七、语音朗读

每个 AI 结果页面必须有一个明显按钮：

```text
听一遍
```

使用浏览器 SpeechSynthesis API。

朗读内容只包括：

1. 当前判断
2. 今天要做的事
3. 风险提醒

不要朗读页面其他内容。

按钮支持：

- 开始朗读
- 暂停
- 重新朗读

---

## 八、作物档案

首次使用时创建简单档案。

字段：

```text
作物名称
种植日期
大棚或露天
种植面积
所在地区
```

表单要求：

- 尽量使用选择按钮
- 不使用复杂下拉框
- 每页只填写一项
- 支持跳过
- 后续可以修改

---

## 九、页面路由

```text
/
首页

/voice
语音输入

/camera
拍照上传

/analyze
AI 分析中

/result
分析结果

/today
今日任务

/records
种植记录

/records/:id
记录详情

/crop
作物档案

/settings
设置
```

---

## 十、分析中页面

不要显示复杂技术词。

显示：

```text
正在帮你看看
```

下面轮播简单提示：

```text
正在看照片
正在听你说的问题
正在整理今天该做什么
```

必须有加载动画。

超过 30 秒时显示：

```text
分析时间有点长，请稍等或重新提交。
```

支持取消。

---

## 十一、异常处理

### 语音识别失败

```text
没听清，请再说一次
```

按钮：

```text
重新说
```

### 图片不清楚

```text
照片有点模糊，请靠近一点再拍
```

按钮：

```text
重新拍
```

### AI 请求失败

```text
暂时没有分析出来
```

按钮：

```text
重新试试
```

### 网络断开

```text
网络不好，请检查后再试
```

---

## 十二、视觉规范

整体风格：

- 简洁
- 温暖
- 清晰
- 不要科技感过强
- 不要大面积深色
- 不要复杂渐变
- 不要密集卡片
- 不要小图标堆砌

颜色建议：

```text
主色：#2F7D32
背景：#F7F8F3
卡片：#FFFFFF
主要文字：#1F2A1F
次要文字：#687268
风险色：#D94B3D
提醒色：#E8A317
```

字体：

```css
body {
  font-size: 18px;
  line-height: 1.6;
}
```

主要按钮：

```css
.primary-button {
  width: 100%;
  min-height: 60px;
  border-radius: 16px;
  font-size: 22px;
  font-weight: 700;
}
```

页面左右间距：

```css
.page {
  padding: 16px;
}
```

---

## 十三、首页布局示例

```text
早上好

今天想做什么？

[ 按住说话 ]
告诉我地里出了什么问题

[ 拍照看看 ]
拍叶子、果实或者整株

[ 今天干什么 ]

[ 种植记录 ]
```

首页不要出现：

- 数据统计图
- 复杂天气图
- 长篇介绍
- 专业术语
- 多层菜单
- 广告位
- 过多设置入口

---

## 十四、组件拆分

建议组件：

```text
src/components/BigActionButton.vue
src/components/VoiceRecorder.vue
src/components/PhotoUploader.vue
src/components/AiResultCard.vue
src/components/SpeakButton.vue
src/components/StatusTag.vue
src/components/TodayTaskItem.vue
src/components/EmptyState.vue
src/components/ErrorState.vue
src/components/BottomNav.vue
```

页面：

```text
src/views/HomeView.vue
src/views/VoiceView.vue
src/views/CameraView.vue
src/views/AnalyzeView.vue
src/views/ResultView.vue
src/views/TodayView.vue
src/views/RecordsView.vue
src/views/RecordDetailView.vue
src/views/CropProfileView.vue
src/views/SettingsView.vue
```

---

## 十五、Pinia 状态

建议 Store：

```text
useUserStore
useCropStore
useVoiceStore
usePhotoStore
useAnalysisStore
useTaskStore
useRecordStore
```

核心状态：

```ts
interface AnalysisResult {
  status: 'normal' | 'attention' | 'danger'
  statusText: string
  summary: string[]
  todayActions: string[]
  nextCheck: string
  riskWarning?: string
  needMorePhotos: boolean
  photoTips: string[]
}
```

---

## 十六、接口约定

### 语音转文字

```http
POST /api/speech/transcribe
```

请求：

```text
multipart/form-data
audio: File
```

返回：

```json
{
  "code": 0,
  "data": {
    "text": "甜瓜叶子发黄，前两天下过雨。"
  }
}
```

---

### 上传图片

```http
POST /api/files/upload
```

返回：

```json
{
  "code": 0,
  "data": {
    "url": "https://example.com/image.jpg"
  }
}
```

---

### AI 分析

```http
POST /api/agriculture/analyze
```

请求：

```json
{
  "cropId": "crop_001",
  "description": "甜瓜叶子发黄，前两天下过雨。",
  "images": [
    "https://example.com/1.jpg",
    "https://example.com/2.jpg"
  ]
}
```

返回：

```json
{
  "code": 0,
  "data": {
    "status": "attention",
    "statusText": "需要注意",
    "summary": [
      "叶子可能受潮后出现病害。",
      "目前还不能完全确定。"
    ],
    "todayActions": [
      "先不要浇大水",
      "检查叶片背面",
      "明天再拍一次"
    ],
    "nextCheck": "明天傍晚再检查一次",
    "riskWarning": "",
    "needMorePhotos": true,
    "photoTips": [
      "拍叶片背面"
    ]
  }
}
```

---

### 今日任务

```http
GET /api/tasks/today
```

### 种植记录

```http
GET /api/records
```

### 记录详情

```http
GET /api/records/:id
```

---

## 十七、前端演示阶段

后端接口未完成时，可以使用 Mock 数据，但必须满足：

- 接口文件统一封装
- Mock 与真实接口结构完全一致
- 禁止在页面组件里写死结果
- 支持通过环境变量切换 Mock

环境变量：

```env
VITE_API_BASE_URL=/api
VITE_USE_MOCK=true
```

---

## 十八、必须完成的第一版功能

第一版只完成以下内容：

1. 移动端首页
2. 大按钮语音输入
3. 拍照与多图上传
4. AI 分析加载页
5. 简短结果页
6. 语音朗读
7. 今日任务
8. 种植记录
9. 作物档案
10. 异常状态处理
11. Mock 接口
12. 移动端适配

暂不开发：

- 复杂后台
- 多角色权限
- 商城
- 社区
- 农资购买
- 专家在线聊天
- 复杂统计图
- 多地块地图
- 自动生成农药配方

---

## 十九、验收标准

### 操作体验

- 用户进入首页后 3 秒内知道怎么使用
- 不需要阅读说明书
- 主要操作最多 3 步完成
- 单手可以完成语音和拍照
- 所有主要按钮都容易点击

### 内容体验

- AI 结果最多一屏半
- 今日任务最多 3 条
- 每条建议简单直接
- 不出现大段 Markdown
- 不出现代码块
- 不出现复杂专业词
- 所有结果可朗读

### 移动端

至少适配：

```text
360px
375px
390px
414px
430px
```

不能出现：

- 横向滚动
- 按钮溢出
- 字体过小
- 弹窗超出屏幕
- 键盘弹起后按钮被完全遮挡

---

## 二十、Cursor 执行要求

请根据本文档直接创建完整 Vue3 项目。

要求：

1. 使用 Vue3 + Vite + TypeScript。
2. 使用 Composition API 和 `<script setup lang="ts">`。
3. 页面优先适配手机。
4. UI 必须简洁、美观、适合中老年用户。
5. 不要生成绿色农业大屏风格。
6. 不要使用密集卡片和复杂图表。
7. 不要只创建静态页面，必须实现完整交互。
8. 语音、拍照、上传、结果页、朗读功能都需要有实际代码。
9. 后端未接入时使用 Mock。
10. 所有接口统一放在 `src/api`。
11. 所有类型统一放在 `src/types`。
12. 所有 Mock 数据统一放在 `src/mock`。
13. 保证项目可以执行：

```bash
npm install
npm run dev
```

14. 完成后补充 README，写明：
   - 如何启动
   - 如何切换 Mock
   - 如何配置真实接口
   - 如何打包
   - 如何部署
