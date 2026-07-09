<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import type {
  ApiConfig,
  MinecraftPlanData,
  MinecraftPlannerRequest,
  ProviderType,
} from '@/api/minecraftAiPlanner'
import {
  buildMinecraftPlannerPrompt,
  clearStoredApiConfig,
  createDefaultApiConfig,
  generateByDirectApi,
  generateByDirectApiStream,
  getPlayTypeLabel,
  getTitleFromContent,
  loadStoredApiConfig,
  providerPresets,
  saveStoredApiConfig,
} from '@/api/minecraftAiPlanner'

type HistoryItem = MinecraftPlanData & {
  playType: string
  playerCount: number
  request: MinecraftPlannerRequest
}

const HISTORY_KEY = 'minecraft_ai_planner_history'
const md = new MarkdownIt({ html: false, linkify: true, breaks: true })

const PLAY_TYPE_OPTIONS = [
  { label: '生存开荒方案', value: 'survival' },
  { label: '建筑主题方案', value: 'building' },
  { label: '红石机关方案', value: 'redstone' },
  { label: '剧情冒险地图', value: 'adventure' },
  { label: '模组整合包方案', value: 'modpack' },
  { label: '服务器活动方案', value: 'server_event' },
  { label: '多人联机玩法', value: 'multiplayer' },
  { label: '新手教学路线', value: 'beginner' },
]

const GAME_VERSION_OPTIONS = [
  { label: 'Java 1.21.x', value: 'java_1_21' },
  { label: 'Java 1.20.x', value: 'java_1_20' },
  { label: 'Java 1.19.x', value: 'java_1_19' },
  { label: '基岩版 Bedrock', value: 'bedrock' },
  { label: '不限版本', value: 'any' },
]

const DIFFICULTY_OPTIONS = [
  { label: '轻松', value: 'easy' },
  { label: '普通', value: 'normal' },
  { label: '硬核', value: 'hardcore' },
]

const STYLE_OPTIONS = [
  { label: '休闲养老', value: 'casual' },
  { label: '硬核挑战', value: 'challenge' },
  { label: '剧情沉浸', value: 'story' },
  { label: '多人协作', value: 'teamwork' },
  { label: '建筑美学', value: 'aesthetic' },
  { label: '自动化科技', value: 'automation' },
  { label: '经济系统', value: 'economy' },
  { label: '任务驱动', value: 'quest' },
]

const WORLD_THEME_OPTIONS = [
  { label: '中世纪王国', value: 'medieval' },
  { label: '空岛群落', value: 'sky_island' },
  { label: '末地远征', value: 'end' },
  { label: '下界工业', value: 'nether' },
  { label: '东方修仙', value: 'oriental' },
  { label: '废土生存', value: 'wasteland' },
  { label: '魔法学院', value: 'magic' },
  { label: '科技都市', value: 'tech_city' },
]

const OUTPUT_LEVEL_OPTIONS = [
  { label: '简洁', value: 'simple' },
  { label: '标准', value: 'standard' },
  { label: '详细', value: 'detailed' },
] as const

const templates = [
  {
    id: 'tpl-1',
    title: '4 人联机生存开荒',
    desc: '适合朋友一起轻松推进，有明确阶段目标。',
    form: {
      playType: 'survival',
      playerCount: 4,
      gameVersion: 'java_1_21',
      difficulty: 'normal',
      style: ['teamwork', 'quest'],
      worldTheme: ['medieval'],
      needEconomy: true,
      needQuest: true,
      needBoss: true,
      needAnnouncement: true,
      mainGoal: '设计一个适合 4 人联机的生存开荒方案，从出生点建设、资源分工、主基地规划，到末地挑战都有明确阶段目标。',
      requirements: '不要太肝，适合晚上下班后一起玩，每次游玩 1-2 小时也能推进进度。',
      outputLevel: 'standard' as const,
    },
  },
  {
    id: 'tpl-2',
    title: '中世纪城堡建设',
    desc: '规划城堡、村庄、港口、农田和道路。',
    form: {
      playType: 'building',
      playerCount: 1,
      gameVersion: 'java_1_21',
      difficulty: 'easy',
      style: ['aesthetic', 'quest'],
      worldTheme: ['medieval'],
      needEconomy: false,
      needQuest: true,
      needBoss: false,
      needAnnouncement: false,
      mainGoal: '设计一个中世纪城堡建筑主题方案，需要包含主城堡、城墙、村庄、农田、港口、道路和内部装饰规划。',
      requirements: '方案要分阶段，先做小规模核心建筑，再逐步扩建成完整城镇。',
      outputLevel: 'detailed' as const,
    },
  },
  {
    id: 'tpl-3',
    title: '服务器周末活动',
    desc: '适合 20 人左右服务器，包含流程、规则和奖励。',
    form: {
      playType: 'server_event',
      playerCount: 20,
      gameVersion: 'java_1_20',
      difficulty: 'normal',
      style: ['teamwork', 'challenge', 'economy'],
      worldTheme: ['sky_island'],
      needEconomy: true,
      needQuest: true,
      needBoss: true,
      needAnnouncement: true,
      mainGoal: '设计一个 Minecraft 服务器周末活动方案，适合 20 人左右参与，需要有活动主题、规则、流程、奖励和主持人执行说明。',
      requirements: '活动时间控制在 60-90 分钟，规则简单，玩家容易理解，最好能促进玩家互动。',
      outputLevel: 'standard' as const,
    },
  },
  {
    id: 'tpl-4',
    title: '红石自动化基地',
    desc: '自动农场、刷怪塔、仓储分类和村民交易。',
    form: {
      playType: 'redstone',
      playerCount: 2,
      gameVersion: 'java_1_21',
      difficulty: 'normal',
      style: ['automation', 'challenge'],
      worldTheme: ['tech_city'],
      needEconomy: true,
      needQuest: false,
      needBoss: false,
      needAnnouncement: false,
      mainGoal: '设计一个红石自动化基地建设方案，包括自动农场、刷怪塔、物品分类、村民交易和资源循环系统。',
      requirements: '不要过于复杂，适合会基础红石但不是大神的玩家。',
      outputLevel: 'detailed' as const,
    },
  },
  {
    id: 'tpl-5',
    title: 'RPG 剧情冒险地图',
    desc: '职业、任务、副本、Boss 和剧情推进。',
    form: {
      playType: 'adventure',
      playerCount: 8,
      gameVersion: 'java_1_21',
      difficulty: 'hardcore',
      style: ['story', 'challenge', 'quest'],
      worldTheme: ['magic', 'medieval'],
      needEconomy: true,
      needQuest: true,
      needBoss: true,
      needAnnouncement: true,
      mainGoal: '设计一个 RPG 剧情冒险地图方案，玩家从新手村出发，通过主线任务、副本挑战、职业成长和 Boss 战逐步拯救王国。',
      requirements: '需要剧情沉浸感，任务不要太空，要有区域解锁、装备成长和最终 Boss。',
      outputLevel: 'detailed' as const,
    },
  },
]

function defaultForm(): Omit<MinecraftPlannerRequest, 'prompt'> {
  return {
    playType: 'survival',
    playerCount: 4,
    gameVersion: 'java_1_21',
    difficulty: 'normal',
    style: ['teamwork', 'quest'],
    worldTheme: ['medieval'],
    needEconomy: true,
    needQuest: true,
    needBoss: true,
    needAnnouncement: true,
    mainGoal: '',
    requirements: '',
    outputLevel: 'standard',
  }
}

const form = reactive(defaultForm())
const aiConfig = reactive<ApiConfig>(createDefaultApiConfig())
const configVisible = ref(false)
const loading = ref(false)
const streamContent = ref('')
const result = ref<MinecraftPlanData | null>(null)
const historyList = ref<HistoryItem[]>([])
const activeRequest = ref<MinecraftPlannerRequest | null>(null)
const showAllHistory = ref(false)
const previewRef = ref<HTMLElement | null>(null)
const formPanelRef = ref<HTMLElement | null>(null)
let streamController: AbortController | null = null

const hasApiConfig = computed(() => !!aiConfig.apiKey.trim())
const currentProviderLabel = computed(() => providerPresets[aiConfig.provider].label)
const displayContent = computed(() => streamContent.value || result.value?.content || '')
const hasContent = computed(() => !!displayContent.value.trim())

const renderedHtml = computed(() => {
  const source = displayContent.value
  if (!source) return ''
  return DOMPurify.sanitize(md.render(source), { USE_PROFILES: { html: true } })
})

const historyVisible = computed(() =>
  showAllHistory.value ? historyList.value : historyList.value.slice(0, 5),
)

function formatTime(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString()
}

function renderMarkdownToHtml(content: string) {
  return DOMPurify.sanitize(md.render(content || ''), { USE_PROFILES: { html: true } })
}

function escapeHtml(text: string) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function safeFileName(name: string) {
  const date = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const time = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`
  return `${name || 'minecraft-plan'}-${time}`.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '-').slice(0, 80)
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function getResultTitle(content?: string) {
  return getTitleFromContent(content || displayContent.value)
}

function exportWordFromContent(content: string, title?: string) {
  const html = renderMarkdownToHtml(content)
  if (!html) {
    ElMessage.warning('暂无可导出的内容')
    return
  }
  const docTitle = title || getTitleFromContent(content)
  const wordHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(docTitle)}</title>
  <style>
    body { font-family: "Microsoft YaHei", Arial, sans-serif; font-size: 12pt; line-height: 1.8; color: #1f2937; }
    h1 { font-size: 22pt; border-bottom: 1px solid #dddddd; padding-bottom: 10px; }
    h2 { font-size: 16pt; margin-top: 24px; color: #111827; border-left: 4px solid #14b8a6; padding-left: 10px; }
    h3 { font-size: 14pt; color: #374151; }
    li { margin: 6px 0; }
  </style>
</head>
<body>${html}</body>
</html>`
  downloadFile(`${safeFileName(docTitle)}.doc`, wordHtml, 'application/msword;charset=utf-8')
  ElMessage.success('Word 文件已导出，可用 Word 或 WPS 打开')
}

function printPdfFromContent(content: string, title?: string) {
  const html = renderMarkdownToHtml(content)
  if (!html) {
    ElMessage.warning('暂无可导出的内容')
    return
  }
  const docTitle = title || getTitleFromContent(content)
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    ElMessage.error('浏览器阻止了弹窗，请允许弹窗后重试')
    return
  }
  printWindow.document.write(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(docTitle)}</title>
  <style>
    body { margin: 0; padding: 32px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; color: #1f2937; line-height: 1.8; }
    h1 { font-size: 28px; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; }
    h2 { margin-top: 28px; padding-left: 12px; border-left: 4px solid #14b8a6; font-size: 20px; }
    li { margin: 6px 0; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>${html}</body>
</html>`)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => printWindow.print(), 300)
}

function exportWord() {
  exportWordFromContent(displayContent.value, getResultTitle())
}

function printPdf() {
  printPdfFromContent(displayContent.value, getResultTitle())
}

function loadAiConfig() {
  Object.assign(aiConfig, loadStoredApiConfig())
}

function saveAiConfig() {
  saveStoredApiConfig({ ...aiConfig })
  ElMessage.success('AI 设置已保存')
  configVisible.value = false
}

function clearAiConfig() {
  clearStoredApiConfig()
  Object.assign(aiConfig, createDefaultApiConfig())
  ElMessage.success('AI 设置已清除')
}

function handleProviderChange(provider: ProviderType) {
  const preset = providerPresets[provider]
  aiConfig.provider = provider
  aiConfig.baseUrl = preset.baseUrl
  aiConfig.model = preset.model
}

function validateAiConfig() {
  if (!aiConfig.apiKey) {
    ElMessage.warning('请先在 AI 设置中填写 API Key')
    configVisible.value = true
    return false
  }
  if (!aiConfig.baseUrl) {
    ElMessage.warning('请填写 Base URL')
    configVisible.value = true
    return false
  }
  if (!aiConfig.model) {
    ElMessage.warning('请填写模型名称')
    configVisible.value = true
    return false
  }
  return true
}

function buildPayload(source?: typeof form): MinecraftPlannerRequest {
  const base = { ...(source || form) }
  const next: MinecraftPlannerRequest = {
    ...base,
    style: [...(base.style || [])],
    worldTheme: [...(base.worldTheme || [])],
    prompt: '',
  }
  if (!next.mainGoal.trim()) {
    next.mainGoal = `想做一个适合 ${next.playerCount} 人联机的 Minecraft 玩法，从出生点建设、阶段目标到末地挑战都有明确规划。`
  }
  if (!next.requirements.trim()) {
    next.requirements = '不要太肝；适合新手；需要有每日任务；最好包含建筑、探索、战斗和交易系统。'
  }
  next.prompt = buildMinecraftPlannerPrompt(next)
  return next
}

function setResult(content: string, request: MinecraftPlannerRequest) {
  const title = getTitleFromContent(content)
  const data: MinecraftPlanData = {
    id: String(Date.now()),
    title,
    summary: 'AI 生成的 Minecraft 游戏方案',
    content,
    createdAt: new Date().toISOString(),
    model: aiConfig.model,
  }
  result.value = data
  streamContent.value = content
  saveHistoryItem(data, request)
}

function saveHistoryItem(data: MinecraftPlanData, request: MinecraftPlannerRequest) {
  const nextList: HistoryItem[] = [
    { ...data, playType: request.playType, playerCount: request.playerCount, request },
    ...historyList.value.filter((item) => item.id !== data.id),
  ].slice(0, 10)
  historyList.value = nextList
  localStorage.setItem(HISTORY_KEY, JSON.stringify(nextList))
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as HistoryItem[]
    if (Array.isArray(parsed)) historyList.value = parsed.slice(0, 10)
  } catch (e) {
    console.warn('[Minecraft AI] 读取历史失败', e)
  }
}

function scrollPreviewToBottom() {
  nextTick(() => {
    if (previewRef.value) previewRef.value.scrollTop = previewRef.value.scrollHeight
  })
}

async function handleGenerate(usingRequest?: typeof form) {
  if (loading.value || !validateAiConfig()) return

  streamController?.abort()
  streamController = null
  loading.value = true
  streamContent.value = ''
  result.value = null

  const payload = buildPayload(usingRequest)
  activeRequest.value = payload

  try {
    if (aiConfig.stream) {
      await new Promise<void>((resolve, reject) => {
        streamController = generateByDirectApiStream(payload, aiConfig, {
          onMessage: (text) => {
            streamContent.value += text
            scrollPreviewToBottom()
          },
          onDone: () => {
            streamController = null
            if (!streamContent.value.trim()) {
              reject(new Error('未返回内容'))
              return
            }
            setResult(streamContent.value, payload)
            resolve()
          },
          onError: reject,
        })
      })
    } else {
      const content = await generateByDirectApi(payload, aiConfig)
      setResult(content, payload)
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('生成失败，请检查 AI 设置或稍后重试')
  } finally {
    loading.value = false
    streamController = null
  }
}

function stopGenerate() {
  streamController?.abort()
  streamController = null
  loading.value = false
  ElMessage.info('已停止生成')
}

function handleResetForm() {
  Object.assign(form, defaultForm())
}

async function copyResult() {
  const content = displayContent.value
  if (!content) {
    ElMessage.warning('暂无可复制内容')
    return
  }
  try {
    await navigator.clipboard.writeText(content)
    ElMessage.success('方案内容已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}

function clearResult() {
  result.value = null
  streamContent.value = ''
}

function handleViewHistory(item: HistoryItem) {
  result.value = item
  streamContent.value = item.content
  activeRequest.value = item.request
}

function handleDeleteHistory(id: string) {
  historyList.value = historyList.value.filter((item) => item.id !== id)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(historyList.value))
  if (result.value?.id === id) clearResult()
  ElMessage.success('已删除历史')
}

async function handleApplyTemplate(tplId: string) {
  const tpl = templates.find((item) => item.id === tplId)
  if (!tpl) return
  Object.assign(form, tpl.form)
  await nextTick()
  formPanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  ElMessage.success('模板已填入，可继续调整后生成')
}

onMounted(() => {
  loadAiConfig()
  loadHistory()
})

onBeforeUnmount(() => {
  streamController?.abort()
})
</script>

<template>
  <div class="minecraft-ai-page">
    <div class="page-shell">
      <header class="top-header">
        <div>
          <div class="eyebrow">AI WORLD PLANNER</div>
          <h1>Minecraft 游戏方案策划 AI</h1>
          <p>输入玩法需求，AI 生成服务器方案、地图剧情、任务系统和开服公告。</p>
        </div>

        <div class="header-actions">
          <div class="ai-status" :class="{ ready: hasApiConfig }">
            <span class="status-dot" />
            <div>
              <strong>{{ hasApiConfig ? 'AI 已配置' : 'AI 未配置' }}</strong>
              <small>{{ hasApiConfig ? currentProviderLabel : '请先填写自己的 API Key' }}</small>
            </div>
          </div>
          <el-button class="settings-btn" @click="configVisible = true">AI 设置</el-button>
        </div>
      </header>

      <section class="workspace">
        <aside class="mc-panel config-panel" ref="formPanelRef">
          <div class="panel-head">
            <h2>方案配置</h2>
            <p>填写你的游戏需求，生成完整方案</p>
          </div>

          <div class="form-section">
            <div class="section-title">游戏基础</div>
            <el-form label-position="top" class="config-form">
              <el-form-item label="游戏类型">
                <el-select v-model="form.playType">
                  <el-option v-for="opt in PLAY_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="玩家人数">
                <el-input-number v-model="form.playerCount" :min="1" :max="100" style="width: 100%" />
              </el-form-item>
              <el-form-item label="游戏版本">
                <el-select v-model="form.gameVersion">
                  <el-option v-for="opt in GAME_VERSION_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="难度">
                <el-radio-group v-model="form.difficulty">
                  <el-radio-button v-for="opt in DIFFICULTY_OPTIONS" :key="opt.value" :label="opt.value">
                    {{ opt.label }}
                  </el-radio-button>
                </el-radio-group>
              </el-form-item>
            </el-form>
          </div>

          <div class="form-section">
            <div class="section-title">世界风格</div>
            <el-form label-position="top" class="config-form">
              <el-form-item label="玩法风格">
                <div class="chip-grid">
                  <button
                    v-for="opt in STYLE_OPTIONS"
                    :key="opt.value"
                    type="button"
                    class="chip"
                    :class="{ active: form.style.includes(opt.value) }"
                    @click="form.style.includes(opt.value)
                      ? form.style = form.style.filter((v) => v !== opt.value)
                      : form.style.push(opt.value)"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </el-form-item>
              <el-form-item label="世界主题">
                <div class="chip-grid">
                  <button
                    v-for="opt in WORLD_THEME_OPTIONS"
                    :key="opt.value"
                    type="button"
                    class="chip"
                    :class="{ active: form.worldTheme.includes(opt.value) }"
                    @click="form.worldTheme.includes(opt.value)
                      ? form.worldTheme = form.worldTheme.filter((v) => v !== opt.value)
                      : form.worldTheme.push(opt.value)"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </el-form-item>
            </el-form>
          </div>

          <div class="form-section">
            <div class="section-title">玩法系统</div>
            <div class="switch-list">
              <label><span>经济系统</span><el-switch v-model="form.needEconomy" /></label>
              <label><span>任务系统</span><el-switch v-model="form.needQuest" /></label>
              <label><span>Boss / 副本</span><el-switch v-model="form.needBoss" /></label>
              <label><span>开服公告</span><el-switch v-model="form.needAnnouncement" /></label>
            </div>
          </div>

          <div class="form-section">
            <div class="section-title">输出要求</div>
            <el-form label-position="top" class="config-form">
              <el-form-item label="主要目标">
                <el-input v-model="form.mainGoal" type="textarea" :rows="3" placeholder="描述你想做的玩法目标" />
              </el-form-item>
              <el-form-item label="特殊要求">
                <el-input v-model="form.requirements" type="textarea" :rows="3" placeholder="例如：不要太肝、适合新手" />
              </el-form-item>
              <el-form-item label="输出长度">
                <el-segmented v-model="form.outputLevel" :options="[...OUTPUT_LEVEL_OPTIONS]" />
              </el-form-item>
            </el-form>
          </div>

          <div class="form-actions">
            <button class="primary-generate-btn" type="button" :disabled="loading" @click="handleGenerate()">
              {{ loading ? '正在生成...' : '生成游戏方案' }}
            </button>
            <el-button :disabled="loading" @click="handleResetForm">重置</el-button>
          </div>
        </aside>

        <section class="mc-panel center-panel">
          <div class="panel-toolbar">
            <div>
              <h2>方案预览</h2>
              <p>生成完成后可导出 Word 或保存 PDF</p>
            </div>
            <div class="toolbar-actions">
              <el-button size="small" :disabled="!hasContent || loading" @click="copyResult">复制</el-button>
              <el-button size="small" :disabled="!hasContent || loading" @click="exportWord">导出 Word</el-button>
              <el-button size="small" :disabled="!hasContent || loading" @click="printPdf">保存 PDF</el-button>
              <el-button size="small" :disabled="loading" @click="handleGenerate(activeRequest || form)">重新生成</el-button>
              <el-button v-if="loading" size="small" type="danger" @click="stopGenerate">停止</el-button>
              <el-button size="small" :disabled="!hasContent || loading" @click="clearResult">清空</el-button>
            </div>
          </div>

          <div ref="previewRef" class="preview-surface">
            <div v-if="!hasContent && !loading" class="empty-state">
              <h3>还没有生成方案</h3>
              <p>填写左侧需求后，点击「生成游戏方案」，这里会展示排版好的方案预览。</p>
              <ul>
                <li>导出 Word</li>
                <li>保存 PDF</li>
                <li>复制内容</li>
              </ul>
            </div>

            <div v-else-if="loading && !hasContent" class="loading-state">
              <el-skeleton :rows="12" animated />
              <p>AI 正在生成方案，请稍候...</p>
            </div>

            <div v-else class="preview-document" v-html="renderedHtml" />
          </div>
        </section>

        <aside class="side-panel">
          <div class="mc-panel side-block">
            <div class="side-title">快速模板</div>
            <div class="template-list">
              <button
                v-for="tpl in templates"
                :key="tpl.id"
                type="button"
                class="template-card"
                @click="handleApplyTemplate(tpl.id)"
              >
                <strong>{{ tpl.title }}</strong>
                <span>{{ tpl.desc }}</span>
              </button>
            </div>
          </div>

          <div class="mc-panel side-block">
            <div class="side-title-row">
              <div class="side-title">历史方案</div>
              <el-button
                v-if="historyList.length > 5"
                link
                type="primary"
                @click="showAllHistory = !showAllHistory"
              >
                {{ showAllHistory ? '收起' : '更多' }}
              </el-button>
            </div>
            <div v-if="!historyVisible.length" class="mini-empty">暂无历史记录</div>
            <div v-else class="history-list">
              <div v-for="item in historyVisible" :key="item.id" class="history-card">
                <strong>{{ item.title }}</strong>
                <div class="history-meta">{{ getPlayTypeLabel(item.playType) }} / {{ item.playerCount }} 人</div>
                <div class="history-time">{{ formatTime(item.createdAt) }}</div>
                <div class="history-actions">
                  <el-button size="small" @click="handleViewHistory(item)">查看</el-button>
                  <el-button size="small" @click="exportWordFromContent(item.content, item.title)">Word</el-button>
                  <el-button size="small" @click="printPdfFromContent(item.content, item.title)">PDF</el-button>
                  <el-button size="small" type="danger" @click="handleDeleteHistory(item.id)">删除</el-button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>

    <el-drawer v-model="configVisible" title="AI 设置" size="440px">
      <div class="api-config-panel">
        <p class="config-intro">请填写你自己的 AI 服务配置。API Key 只会保存在当前浏览器本地，不会展示在主页面上。</p>

        <el-alert
          title="安全提醒"
          description="API Key 会保存在当前浏览器 localStorage 中，仅适合个人本地使用。正式线上项目建议改为后端代理保存密钥。"
          type="warning"
          show-icon
          :closable="false"
        />

        <el-form label-position="top" class="api-form">
          <el-form-item label="服务商">
            <el-select v-model="aiConfig.provider" @change="handleProviderChange">
              <el-option label="LongCat" value="longcat" />
              <el-option label="DeepSeek" value="deepseek" />
              <el-option label="OpenAI" value="openai" />
              <el-option label="通义千问" value="qwen" />
              <el-option label="自定义兼容接口" value="custom" />
            </el-select>
          </el-form-item>

          <el-form-item label="API Key">
            <el-input
              v-model="aiConfig.apiKey"
              type="password"
              show-password
              placeholder="请输入 API Key，例如 sk-..."
            />
          </el-form-item>

          <el-form-item label="Base URL">
            <el-input v-model="aiConfig.baseUrl" placeholder="https://api.longcat.chat/openai/v1" />
          </el-form-item>

          <el-form-item label="模型名称">
            <el-input v-model="aiConfig.model" placeholder="LongCat-2.0 / deepseek-chat / gpt-4o-mini" />
          </el-form-item>

          <el-form-item v-if="aiConfig.provider === 'longcat'" label="LongCat Thinking">
            <el-switch v-model="aiConfig.thinkingEnabled" />
            <div class="form-tip">关闭 Thinking 通常更快、更稳定。</div>
          </el-form-item>

          <el-form-item :label="`Temperature ${aiConfig.temperature}`">
            <el-slider v-model="aiConfig.temperature" :min="0" :max="1" :step="0.1" />
          </el-form-item>

          <el-form-item label="流式生成">
            <el-switch v-model="aiConfig.stream" />
          </el-form-item>
        </el-form>

        <div class="drawer-actions">
          <el-button @click="clearAiConfig">清除配置</el-button>
          <el-button type="primary" @click="saveAiConfig">保存配置</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.minecraft-ai-page {
  --page-bg: #0d1117;
  --panel-bg: rgba(22, 27, 34, 0.92);
  --panel-border: rgba(255, 255, 255, 0.08);
  --text-main: #f0f6fc;
  --text-sub: #9ba7b4;
  --text-muted: #6e7681;
  --accent: #5eead4;
  --accent-soft: rgba(94, 234, 212, 0.14);
  --wood: #b77945;
  --danger: #ef6b73;

  position: relative;
  min-height: 100vh;
  padding: 24px;
  color: var(--text-main);
  background:
    radial-gradient(circle at 20% 10%, rgba(94, 234, 212, 0.10), transparent 28%),
    radial-gradient(circle at 84% 18%, rgba(183, 121, 69, 0.10), transparent 26%),
    linear-gradient(180deg, #0d1117 0%, #0b1018 100%);
}

.page-shell {
  position: relative;
  z-index: 1;
  max-width: 1680px;
  margin: 0 auto;
}

.mc-panel {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 20px;
  backdrop-filter: blur(18px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.24);
}

.top-header {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  margin-bottom: 18px;
  padding: 18px 20px;
  border-radius: 22px;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
}

.eyebrow {
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.top-header h1 {
  margin: 8px 0 6px;
  font-size: 28px;
  line-height: 1.15;
}

.top-header p {
  margin: 0;
  color: var(--text-sub);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.ai-status {
  min-width: 220px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  background: rgba(9, 13, 19, 0.72);
  border: 1px solid var(--panel-border);
}

.ai-status strong,
.ai-status small {
  display: block;
}

.ai-status small {
  margin-top: 3px;
  color: var(--text-muted);
  font-size: 12px;
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--danger);
  box-shadow: 0 0 14px rgba(239, 107, 115, 0.45);
}

.ai-status.ready .status-dot {
  background: var(--accent);
  box-shadow: 0 0 14px rgba(94, 234, 212, 0.45);
}

.settings-btn {
  height: 42px;
  border-radius: 12px;
}

.workspace {
  display: grid;
  grid-template-columns: 330px minmax(0, 1fr) 320px;
  gap: 16px;
  align-items: start;
}

.config-panel {
  padding: 16px;
}

.panel-head h2,
.panel-toolbar h2 {
  margin: 0;
  font-size: 16px;
}

.panel-head p,
.panel-toolbar p {
  margin: 6px 0 0;
  color: var(--text-muted);
  font-size: 12px;
}

.form-section {
  margin-top: 14px;
  padding: 14px;
  border-radius: 14px;
  background: rgba(9, 13, 19, 0.48);
  border: 1px solid var(--panel-border);
}

.section-title,
.side-title {
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 800;
}

.config-form :deep(.el-form-item__label),
.api-form :deep(.el-form-item__label) {
  color: var(--text-sub);
  font-weight: 700;
}

.config-form :deep(.el-input__wrapper),
.config-form :deep(.el-textarea__inner),
.config-form :deep(.el-select__wrapper),
.api-form :deep(.el-input__wrapper),
.api-form :deep(.el-select__wrapper) {
  background: rgba(255, 255, 255, 0.03) !important;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08) inset !important;
  color: var(--text-main) !important;
  border-radius: 12px;
}

.chip-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  border: 1px solid var(--panel-border);
  background: rgba(9, 13, 19, 0.55);
  color: var(--text-sub);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
}

.chip.active {
  color: var(--accent);
  border-color: rgba(94, 234, 212, 0.35);
  background: var(--accent-soft);
}

.switch-list {
  display: grid;
  gap: 10px;
}

.switch-list label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--panel-border);
  font-size: 13px;
}

.form-actions {
  margin-top: 14px;
  display: grid;
  gap: 10px;
}

.primary-generate-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 14px;
  color: #052e33;
  font-weight: 900;
  cursor: pointer;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.42), transparent 45%),
    linear-gradient(135deg, #99f6e4, #5eead4 56%, #2dd4bf);
  box-shadow: 0 12px 28px rgba(45, 212, 191, 0.22);
}

.primary-generate-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.center-panel {
  min-height: calc(100vh - 150px);
  display: flex;
  flex-direction: column;
}

.panel-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--panel-border);
}

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.preview-surface {
  flex: 1;
  padding: 18px;
  overflow-y: auto;
  min-height: 560px;
}

.empty-state,
.loading-state {
  max-width: 520px;
  margin: 48px auto 0;
  text-align: center;
  color: var(--text-sub);
}

.empty-state h3 {
  margin: 0 0 10px;
  color: var(--text-main);
}

.empty-state ul {
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.empty-state li {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--panel-border);
  font-size: 12px;
}

.loading-state p {
  margin-top: 14px;
}

.preview-document {
  max-width: 880px;
  margin: 0 auto;
  padding: 32px;
  border-radius: 18px;
  background: #f8fafc;
  color: #1f2937;
  line-height: 1.82;
  font-size: 15px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.28);
}

.preview-document :deep(h1) {
  margin: 0 0 20px;
  font-size: 28px;
  color: #111827;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 14px;
}

.preview-document :deep(h2) {
  margin-top: 28px;
  margin-bottom: 12px;
  padding-left: 12px;
  border-left: 4px solid #14b8a6;
  color: #111827;
  font-size: 20px;
}

.preview-document :deep(h3) {
  margin-top: 18px;
  color: #374151;
}

.preview-document :deep(p) {
  margin: 10px 0;
}

.preview-document :deep(ul),
.preview-document :deep(ol) {
  padding-left: 24px;
}

.preview-document :deep(li) {
  margin: 6px 0;
}

.side-panel {
  display: grid;
  gap: 14px;
}

.side-block {
  padding: 14px;
}

.side-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.template-list,
.history-list {
  display: grid;
  gap: 10px;
}

.template-card,
.history-card {
  padding: 13px;
  border-radius: 15px;
  background: rgba(9, 13, 19, 0.56);
  border: 1px solid var(--panel-border);
  text-align: left;
  color: inherit;
  cursor: pointer;
  transition: 0.18s ease;
}

.template-card:hover {
  transform: translateY(-2px);
  border-color: rgba(94, 234, 212, 0.35);
  background: rgba(94, 234, 212, 0.08);
}

.template-card strong,
.history-card strong {
  display: block;
  font-size: 13px;
}

.template-card span,
.history-meta,
.history-time,
.mini-empty {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
}

.history-actions {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.api-config-panel {
  display: grid;
  gap: 16px;
  padding-bottom: 12px;
}

.config-intro,
.form-tip {
  margin: 0;
  font-size: 13px;
  color: var(--text-sub);
  line-height: 1.6;
}

.drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 1360px) {
  .workspace {
    grid-template-columns: 320px minmax(0, 1fr);
  }

  .side-panel {
    grid-column: 1 / -1;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .minecraft-ai-page {
    padding: 14px;
  }

  .top-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .workspace,
  .side-panel {
    grid-template-columns: 1fr;
  }

  .panel-toolbar {
    flex-direction: column;
  }

  .toolbar-actions {
    justify-content: flex-start;
  }
}
</style>
