<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import MarkdownRenderer from '@/components/ai/MarkdownRenderer.vue'
import type {
  ApiConfig,
  MinecraftPlanData,
  MinecraftPlannerRequest,
  ProviderType,
} from '@/api/minecraftAiPlanner'
import {
  API_CONFIG_KEY,
  buildMinecraftPlannerPrompt,
  createDefaultApiConfig,
  generateByDirectApi,
  generateByDirectApiStream,
  generateMinecraftPlan,
  generateMinecraftPlanStream,
  getPlayTypeLabel,
  mockGenerateMinecraftPlan,
  providerPresets,
} from '@/api/minecraftAiPlanner'

type HistoryItem = MinecraftPlanData & {
  playType: string
  playerCount: number
  request: MinecraftPlannerRequest
}

const HISTORY_KEY = 'minecraft_ai_planner_history'
const DEMO_MODE_KEY = 'minecraft_ai_demo_mode'

const PLAY_TYPE_OPTIONS = [
  { label: '生存开荒方案', value: 'survival' },
  { label: '建筑主题方案', value: 'building' },
  { label: '红石机关方案', value: 'redstone' },
  { label: '剧情冒险地图', value: 'adventure' },
  { label: '模组整合包', value: 'modpack' },
  { label: '服务器活动', value: 'server_event' },
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
const apiConfig = reactive<ApiConfig>(createDefaultApiConfig())
const apiConfigVisible = ref(false)
const useDemoMode = ref(false)

const loading = ref(false)
const streamContent = ref('')
const result = ref<MinecraftPlanData | null>(null)
const historyList = ref<HistoryItem[]>([])
const activeRequest = ref<MinecraftPlannerRequest | null>(null)
const showAllHistory = ref(false)
const chatSurfaceRef = ref<HTMLElement | null>(null)
const formPanelRef = ref<HTMLElement | null>(null)
let streamController: AbortController | null = null

const templates = [
  {
    id: 'tpl-1',
    title: '4 人联机生存开荒',
    desc: '适合朋友下班后一起玩，节奏轻松但目标明确。',
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
    desc: '规划城堡、村庄、港口、农田和防御系统。',
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
    desc: '自动农场、刷怪塔、仓储分类、村民交易。',
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
    desc: '职业、任务、副本、Boss、剧情推进。',
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

const currentModelLabel = computed(() => {
  if (useDemoMode.value) return '演示模式'
  if (apiConfig.useProxy) return `后端代理 · ${apiConfig.model || '服务端模型'}`
  return `${providerPresets[apiConfig.provider].label} · ${apiConfig.model || '未配置模型'}`
})

const hasApiKey = computed(() => !!apiConfig.apiKey.trim())
const displayContent = computed(() => streamContent.value || result.value?.content || '')
const hasContent = computed(() => !!displayContent.value.trim())

const promptSummary = computed(() => {
  const goal = form.mainGoal.trim() || '未填写目标，由 AI 自行设计完整方案'
  const req = form.requirements.trim() || '无特殊要求'
  return `${getPlayTypeLabel(form.playType)} · ${form.playerCount} 人\n目标：${goal}\n要求：${req}`
})

const outlineList = computed(() => {
  if (!displayContent.value) return []
  return displayContent.value
    .split('\n')
    .filter((line) => line.startsWith('## '))
    .map((line) => line.replace(/^##\s*/, ''))
})

const historyVisible = computed(() =>
  showAllHistory.value ? historyList.value : historyList.value.slice(0, 5),
)

function formatTime(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString()
}

function extractTitle(content: string) {
  const line = content.split('\n').find((item) => item.trim().startsWith('# '))
  return line ? line.replace(/^#\s*/, '').trim() : 'Minecraft 游戏方案'
}

function extractSummary(content: string) {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith('#'))
  return (lines[0] || '根据配置生成的 Minecraft 游戏策划方案。').slice(0, 120)
}

function loadApiConfig() {
  try {
    const saved = localStorage.getItem(API_CONFIG_KEY)
    if (saved) {
      Object.assign(apiConfig, createDefaultApiConfig(), JSON.parse(saved))
      if (apiConfig.thinkingEnabled == null) apiConfig.thinkingEnabled = false
    }
  } catch (e) {
    console.warn('[Minecraft AI] 读取模型配置失败', e)
  }
  useDemoMode.value = localStorage.getItem(DEMO_MODE_KEY) === '1'
}

function saveApiConfig() {
  localStorage.setItem(API_CONFIG_KEY, JSON.stringify(apiConfig))
  localStorage.setItem(DEMO_MODE_KEY, useDemoMode.value ? '1' : '0')
  ElMessage.success('模型配置已保存')
  apiConfigVisible.value = false
}

function clearApiConfig() {
  localStorage.removeItem(API_CONFIG_KEY)
  localStorage.removeItem(DEMO_MODE_KEY)
  Object.assign(apiConfig, createDefaultApiConfig())
  useDemoMode.value = false
  ElMessage.success('模型配置已清除')
}

function handleProviderChange(provider: ProviderType) {
  const preset = providerPresets[provider]
  apiConfig.provider = provider
  apiConfig.baseUrl = preset.baseUrl
  apiConfig.model = preset.model
  if (provider === 'longcat' && apiConfig.thinkingEnabled == null) {
    apiConfig.thinkingEnabled = false
  }
}

function persistHistory(list: HistoryItem[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
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

function saveHistoryItem(data: MinecraftPlanData, request: MinecraftPlannerRequest) {
  const nextList: HistoryItem[] = [
    {
      ...data,
      playType: request.playType,
      playerCount: request.playerCount,
      request,
    },
    ...historyList.value.filter((item) => item.id !== data.id),
  ].slice(0, 10)
  historyList.value = nextList
  persistHistory(nextList)
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

function setResult(
  content: string,
  request: MinecraftPlannerRequest,
  meta?: { model?: string; title?: string; summary?: string; isMock?: boolean },
) {
  const data: MinecraftPlanData = {
    id: String(Date.now()),
    title: meta?.title || extractTitle(content),
    summary: meta?.summary || extractSummary(content),
    content,
    createdAt: new Date().toISOString(),
    model: meta?.model,
    isMock: meta?.isMock,
  }
  result.value = data
  streamContent.value = content
  saveHistoryItem(data, request)
}

function scrollChatToBottom() {
  nextTick(() => {
    if (chatSurfaceRef.value) {
      chatSurfaceRef.value.scrollTop = chatSurfaceRef.value.scrollHeight
    }
  })
}

function validateApiConfig() {
  if (useDemoMode.value) return true

  if (!apiConfig.useProxy && !apiConfig.apiKey) {
    ElMessage.warning('请先配置 API Key，或开启演示模式')
    apiConfigVisible.value = true
    return false
  }
  if (!apiConfig.useProxy && !apiConfig.baseUrl) {
    ElMessage.warning('请填写 Base URL')
    apiConfigVisible.value = true
    return false
  }
  if (!apiConfig.model) {
    ElMessage.warning('请填写模型名称')
    apiConfigVisible.value = true
    return false
  }
  return true
}

function runStream(
  createController: (callbacks: {
    onMessage: (text: string) => void
    onDone?: (meta?: { model?: string; title?: string; summary?: string }) => void
    onError?: (error: unknown) => void
  }) => AbortController,
  payload: MinecraftPlannerRequest,
) {
  return new Promise<void>((resolve, reject) => {
    streamController = createController({
      onMessage: (text) => {
        streamContent.value += text
        scrollChatToBottom()
      },
      onDone: (meta) => {
        streamController = null
        if (!streamContent.value.trim()) {
          reject(new Error('未返回内容'))
          return
        }
        setResult(streamContent.value, payload, {
          model: meta?.model || apiConfig.model,
          title: meta?.title,
          summary: meta?.summary,
        })
        resolve()
      },
      onError: (error) => {
        streamController = null
        reject(error)
      },
    })
  })
}

async function generateByProxy(payload: MinecraftPlannerRequest) {
  if (apiConfig.useStream) {
    await runStream(
      (callbacks) => generateMinecraftPlanStream(payload, callbacks, apiConfig),
      payload,
    )
    return
  }
  const res = await generateMinecraftPlan(payload, apiConfig)
  setResult(res.data.content, payload, {
    model: res.data.model || apiConfig.model,
    title: res.data.title,
    summary: res.data.summary,
  })
}

async function generateByDirectStream(payload: MinecraftPlannerRequest) {
  await runStream(
    (callbacks) => generateByDirectApiStream(payload, apiConfig, callbacks),
    payload,
  )
}

async function handleGenerate(usingRequest?: typeof form) {
  if (loading.value) return
  if (!validateApiConfig()) return

  streamController?.abort()
  streamController = null
  loading.value = true
  streamContent.value = ''
  result.value = null

  const payload = buildPayload(usingRequest)
  activeRequest.value = payload

  try {
    if (useDemoMode.value) {
      const mockRes = await mockGenerateMinecraftPlan(payload)
      setResult(mockRes.data.content, payload, {
        model: 'demo',
        title: mockRes.data.title,
        summary: mockRes.data.summary,
        isMock: true,
      })
    } else if (apiConfig.useProxy) {
      await generateByProxy(payload)
    } else if (apiConfig.useStream) {
      await generateByDirectStream(payload)
    } else {
      const content = await generateByDirectApi(payload, apiConfig)
      setResult(content, payload, { model: apiConfig.model })
    }
  } catch (error) {
    console.error('AI 生成失败:', error)
    ElMessage.error('AI 生成失败，请检查 API Key、Base URL、模型名称或网络权限')
  } finally {
    loading.value = false
    streamController = null
  }
}

function stopGenerate() {
  streamController?.abort()
  streamController = null
  loading.value = false
}

function handleResetForm() {
  Object.assign(form, defaultForm())
}

async function copyResult() {
  if (!displayContent.value) return
  try {
    await navigator.clipboard.writeText(displayContent.value)
    ElMessage.success('方案已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}

function exportMarkdown() {
  const content = displayContent.value
  if (!content) return
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `minecraft-ai-plan-${Date.now()}.md`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('已导出 Markdown')
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
  persistHistory(historyList.value)
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

function scrollToOutline(title: string) {
  if (!chatSurfaceRef.value) return
  const nodes = chatSurfaceRef.value.querySelectorAll('h2')
  for (const node of Array.from(nodes)) {
    if ((node.textContent || '').trim() === title) {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' })
      break
    }
  }
}

onMounted(() => {
  loadApiConfig()
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
          <div class="eyebrow">
            <span class="pixel-dot" />
            AI WORLD PLANNER
          </div>
          <h1>Minecraft 游戏方案策划 AI</h1>
          <p>用 AI 生成服务器玩法、地图剧情、任务系统、建筑规划和开服公告。</p>
        </div>

        <div class="header-actions">
          <div class="model-status" :class="{ configured: useDemoMode || hasApiKey || apiConfig.useProxy }">
            <span class="status-light" />
            <div>
              <strong>{{ currentModelLabel }}</strong>
              <small>
                {{
                  useDemoMode
                    ? '当前模式：演示模式'
                    : apiConfig.useProxy
                      ? '后端代理模式'
                      : hasApiKey
                        ? 'API Key 已配置'
                        : '请先配置 API Key'
                }}
              </small>
            </div>
          </div>
          <el-button class="settings-btn" @click="apiConfigVisible = true">模型设置</el-button>
        </div>
      </header>

      <section class="workspace">
        <aside class="mc-panel config-panel" ref="formPanelRef">
          <div class="panel-head">
            <h2>方案配置</h2>
            <p>像配置一个新世界一样设定参数</p>
          </div>

          <div class="form-section">
            <div class="section-title">游戏基础</div>
            <el-form label-position="top" class="config-form">
              <el-form-item label="玩法类型">
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
              <el-form-item label="方案风格">
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
                <el-input
                  v-model="form.mainGoal"
                  type="textarea"
                  :rows="3"
                  placeholder="例如：适合 4 人联机的生存服务器，前期有明确目标，后期有末地挑战。"
                />
              </el-form-item>
              <el-form-item label="特殊要求">
                <el-input
                  v-model="form.requirements"
                  type="textarea"
                  :rows="3"
                  placeholder="例如：不要太肝；适合新手；每天 1-2 小时也能推进。"
                />
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
              <h2>AI 方案生成器</h2>
              <p>
                {{ apiConfig.useProxy ? '后端代理' : currentModelLabel }}
                · {{ useDemoMode ? '演示数据' : (apiConfig.useStream ? '流式输出' : '普通输出') }}
              </p>
            </div>
            <div class="toolbar-actions">
              <el-button size="small" :disabled="!hasContent || loading" @click="copyResult">复制</el-button>
              <el-button size="small" :disabled="!hasContent || loading" @click="exportMarkdown">导出 MD</el-button>
              <el-button
                size="small"
                :disabled="loading"
                @click="handleGenerate(activeRequest || form)"
              >
                重新生成
              </el-button>
              <el-button v-if="loading" size="small" type="danger" @click="stopGenerate">停止</el-button>
              <el-button size="small" :disabled="!hasContent || loading" @click="clearResult">清空</el-button>
            </div>
          </div>

          <div ref="chatSurfaceRef" class="chat-surface">
            <div v-if="!hasContent && !loading" class="welcome-card">
              <div class="welcome-icon">⌘</div>
              <h3>准备生成一个新的 Minecraft 世界方案</h3>
              <p>配置左侧参数，或从右侧选择模板，然后点击生成。</p>
              <div class="welcome-hints">
                <span>世界观</span>
                <span>阶段目标</span>
                <span>任务系统</span>
                <span>开服公告</span>
              </div>
            </div>

            <div v-else class="message-list">
              <div class="user-summary-message">
                <div class="message-avatar user">你</div>
                <div class="message-bubble">{{ promptSummary }}</div>
              </div>

              <div class="ai-message">
                <div class="message-avatar ai">AI</div>
                <div class="message-bubble markdown-body">
                  <div v-if="!hasContent && loading" class="generating-plain">正在连接模型并生成方案...</div>
                  <MarkdownRenderer v-else :content="displayContent" />
                  <span v-if="loading" class="typing-cursor" />
                </div>
              </div>
            </div>
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
            <div class="side-title">生成目录</div>
            <div v-if="!outlineList.length" class="mini-empty">生成后显示章节目录</div>
            <ul v-else class="outline-list">
              <li v-for="item in outlineList" :key="item" @click="scrollToOutline(item)">{{ item }}</li>
            </ul>
          </div>

          <div class="mc-panel side-block">
            <div class="side-title-row">
              <div class="side-title">最近方案</div>
              <el-button
                v-if="historyList.length > 5"
                link
                type="primary"
                @click="showAllHistory = !showAllHistory"
              >
                {{ showAllHistory ? '收起' : '更多' }}
              </el-button>
            </div>
            <div v-if="!historyVisible.length" class="mini-empty">暂无历史</div>
            <div v-else class="history-list">
              <div v-for="item in historyVisible" :key="item.id" class="history-card">
                <div class="history-top">
                  <strong>{{ item.title }}</strong>
                  <el-tag size="small" :type="item.isMock ? 'warning' : 'success'" effect="plain">
                    {{ item.isMock ? '演示' : 'AI' }}
                  </el-tag>
                </div>
                <div class="history-meta">{{ getPlayTypeLabel(item.playType) }} / {{ item.playerCount }} 人</div>
                <div class="history-time">{{ formatTime(item.createdAt) }}</div>
                <div class="history-actions">
                  <el-button size="small" @click="handleViewHistory(item)">查看</el-button>
                  <el-button size="small" type="danger" @click="handleDeleteHistory(item.id)">删除</el-button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>

    <el-drawer
      v-model="apiConfigVisible"
      title="AI 模型设置"
      size="440px"
      class="model-config-drawer"
    >
      <div class="api-config-panel">
        <el-alert
          title="安全提醒"
          description="API Key 会保存在当前浏览器 localStorage 中，仅适合个人本地或内网演示。正式上线建议使用后端代理，由服务端保存密钥。"
          type="warning"
          show-icon
          :closable="false"
        />

        <el-form label-position="top" class="api-form">
          <el-form-item label="调用方式">
            <el-radio-group v-model="apiConfig.useProxy">
              <el-radio-button :label="false">前端直连</el-radio-button>
              <el-radio-button :label="true">后端代理</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="服务商">
            <el-select v-model="apiConfig.provider" @change="handleProviderChange">
              <el-option label="LongCat" value="longcat" />
              <el-option label="DeepSeek" value="deepseek" />
              <el-option label="OpenAI" value="openai" />
              <el-option label="通义千问" value="qwen" />
              <el-option label="自定义 OpenAI Compatible" value="custom" />
            </el-select>
          </el-form-item>

          <el-form-item v-if="!apiConfig.useProxy" label="API Key">
            <el-input
              v-model="apiConfig.apiKey"
              type="password"
              show-password
              placeholder="请输入 API Key，例如 sk-..."
            />
          </el-form-item>

          <el-form-item label="Base URL">
            <el-input
              v-model="apiConfig.baseUrl"
              placeholder="https://api.longcat.chat/openai/v1"
              :disabled="apiConfig.useProxy"
            />
          </el-form-item>

          <el-form-item label="模型名称">
            <el-input
              v-model="apiConfig.model"
              placeholder="LongCat-2.0 / deepseek-chat / gpt-4o-mini / qwen-plus"
            />
          </el-form-item>

          <el-form-item v-if="apiConfig.provider === 'longcat'" label="LongCat Thinking">
            <el-switch v-model="apiConfig.thinkingEnabled" />
            <div class="form-tip">
              LongCat 支持 OpenAI 兼容接口，本页默认使用 OpenAI 格式调用。关闭 Thinking 通常更快、更稳。
            </div>
          </el-form-item>

          <el-form-item :label="`Temperature ${apiConfig.temperature}`">
            <el-slider v-model="apiConfig.temperature" :min="0" :max="1" :step="0.1" />
          </el-form-item>

          <el-form-item label="流式输出">
            <el-switch v-model="apiConfig.useStream" />
          </el-form-item>

          <el-divider />

          <el-form-item label="演示模式">
            <el-switch v-model="useDemoMode" />
            <div class="form-tip">开启后不调用真实 AI，只使用本地演示数据。</div>
          </el-form-item>
        </el-form>

        <div class="drawer-actions">
          <el-button @click="clearApiConfig">清除配置</el-button>
          <el-button type="primary" @click="saveApiConfig">保存配置</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.minecraft-ai-page {
  --mc-bg: #0b0f14;
  --mc-panel: rgba(18, 24, 33, 0.86);
  --mc-border: rgba(255, 255, 255, 0.09);
  --mc-text: #eef2f7;
  --mc-text-sub: #a7b0be;
  --mc-text-muted: #6f7a89;
  --mc-diamond: #5eead4;
  --mc-diamond-soft: rgba(94, 234, 212, 0.13);
  --mc-wood: #b77945;
  --mc-wood-soft: rgba(183, 121, 69, 0.14);
  --mc-grass: #7ddc83;
  --mc-gold: #f2c766;
  --mc-redstone: #ef6b73;
  --mc-radius-lg: 22px;
  --mc-radius-md: 16px;

  position: relative;
  min-height: 100vh;
  padding: 24px;
  color: var(--mc-text);
  background:
    radial-gradient(circle at 18% 10%, rgba(94, 234, 212, 0.11), transparent 28%),
    radial-gradient(circle at 84% 12%, rgba(183, 121, 69, 0.10), transparent 26%),
    radial-gradient(circle at 80% 80%, rgba(125, 220, 131, 0.07), transparent 28%),
    linear-gradient(180deg, #0b0f14 0%, #0d121a 48%, #090d13 100%);
}

.minecraft-ai-page::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.35;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: linear-gradient(to bottom, black, transparent 82%);
}

.page-shell {
  position: relative;
  z-index: 1;
  max-width: 1680px;
  margin: 0 auto;
}

.mc-panel {
  background: var(--mc-panel);
  border: 1px solid var(--mc-border);
  border-radius: var(--mc-radius-lg);
  backdrop-filter: blur(22px);
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.28);
}

.top-header {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  margin-bottom: 18px;
  padding: 18px 20px;
  border-radius: 24px;
  background: rgba(18, 24, 33, 0.72);
  border: 1px solid var(--mc-border);
  backdrop-filter: blur(22px);
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.28);
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--mc-diamond);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.pixel-dot {
  width: 9px;
  height: 9px;
  background: var(--mc-diamond);
  box-shadow:
    10px 0 0 var(--mc-wood),
    20px 0 0 var(--mc-grass);
}

.top-header h1 {
  margin: 8px 0 6px;
  font-size: 30px;
  line-height: 1.15;
  color: var(--mc-text);
}

.top-header p {
  margin: 0;
  color: var(--mc-text-sub);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.model-status {
  min-width: 230px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 16px;
  background: rgba(9, 13, 19, 0.72);
  border: 1px solid var(--mc-border);
}

.model-status strong,
.model-status small {
  display: block;
}

.model-status small {
  margin-top: 3px;
  color: var(--mc-text-muted);
  font-size: 12px;
}

.status-light {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--mc-redstone);
  box-shadow: 0 0 16px rgba(239, 107, 115, 0.48);
}

.model-status.configured .status-light {
  background: var(--mc-diamond);
  box-shadow: 0 0 16px rgba(94, 234, 212, 0.48);
}

.settings-btn {
  height: 42px;
  border-radius: 14px;
}

.workspace {
  display: grid;
  grid-template-columns: 330px minmax(0, 1fr) 320px;
  gap: 16px;
  align-items: start;
}

.config-panel,
.center-panel,
.side-block {
  overflow: hidden;
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
  color: var(--mc-text-muted);
  font-size: 12px;
}

.form-section {
  margin-top: 14px;
  padding: 14px;
  border-radius: var(--mc-radius-md);
  background: rgba(9, 13, 19, 0.48);
  border: 1px solid var(--mc-border);
}

.section-title,
.side-title {
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 800;
  color: var(--mc-text);
}

.config-form :deep(.el-form-item__label) {
  color: var(--mc-text-sub);
  font-weight: 700;
}

.config-form :deep(.el-input__wrapper),
.config-form :deep(.el-textarea__inner),
.config-form :deep(.el-select__wrapper),
.api-form :deep(.el-input__wrapper),
.api-form :deep(.el-select__wrapper) {
  background: rgba(255, 255, 255, 0.03) !important;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08) inset !important;
  color: var(--mc-text) !important;
  border-radius: 12px;
}

.chip-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  border: 1px solid var(--mc-border);
  background: rgba(9, 13, 19, 0.55);
  color: var(--mc-text-sub);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
}

.chip.active {
  color: var(--mc-diamond);
  border-color: rgba(94, 234, 212, 0.35);
  background: var(--mc-diamond-soft);
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
  border: 1px solid var(--mc-border);
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
  box-shadow:
    0 12px 28px rgba(45, 212, 191, 0.22),
    inset 0 -3px 0 rgba(15, 118, 110, 0.65);
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
  border-bottom: 1px solid var(--mc-border);
}

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.chat-surface {
  flex: 1;
  padding: 18px;
  overflow-y: auto;
  min-height: 560px;
}

.welcome-card {
  max-width: 640px;
  margin: 56px auto 0;
  text-align: center;
}

.welcome-icon {
  width: 54px;
  height: 54px;
  margin: 0 auto 14px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 22px;
  background: var(--mc-diamond-soft);
  color: var(--mc-diamond);
  border: 1px solid rgba(94, 234, 212, 0.28);
}

.welcome-card h3 {
  margin: 0 0 8px;
  font-size: 20px;
}

.welcome-card p {
  margin: 0;
  color: var(--mc-text-sub);
}

.welcome-hints {
  margin-top: 18px;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}

.welcome-hints span {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--mc-border);
  color: var(--mc-text-muted);
  font-size: 12px;
}

.message-list {
  max-width: 920px;
  margin: 0 auto;
}

.user-summary-message,
.ai-message {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
}

.message-avatar {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-weight: 900;
  font-size: 12px;
}

.message-avatar.user {
  background: var(--mc-wood-soft);
  color: #ffd9b0;
  border: 1px solid rgba(183, 121, 69, 0.28);
}

.message-avatar.ai {
  background: var(--mc-diamond-soft);
  color: var(--mc-diamond);
  border: 1px solid rgba(94, 234, 212, 0.28);
}

.message-bubble {
  flex: 1;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(9, 13, 19, 0.62);
  border: 1px solid var(--mc-border);
  color: var(--mc-text);
  line-height: 1.8;
  white-space: pre-wrap;
}

.markdown-body {
  white-space: normal;
}

.markdown-body :deep(.md-renderer .copy-btn) {
  display: none;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  color: #d8f3ef;
}

.generating-plain {
  color: var(--mc-text-sub);
}

.typing-cursor {
  display: inline-block;
  width: 8px;
  height: 18px;
  margin-left: 3px;
  vertical-align: text-bottom;
  background: var(--mc-diamond);
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
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
  border: 1px solid var(--mc-border);
  text-align: left;
  color: inherit;
  cursor: pointer;
  transition: 0.18s ease;
}

.template-card:hover,
.history-card:hover {
  transform: translateY(-2px);
  border-color: rgba(94, 234, 212, 0.35);
  background: rgba(94, 234, 212, 0.08);
}

.template-card strong,
.history-top strong {
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
  color: var(--mc-text-muted);
  line-height: 1.5;
}

.history-top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.history-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

.outline-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
  max-height: 220px;
  overflow: auto;
}

.outline-list li {
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(9, 13, 19, 0.5);
  border: 1px solid var(--mc-border);
  font-size: 12px;
  cursor: pointer;
}

.outline-list li:hover {
  border-color: rgba(94, 234, 212, 0.35);
  color: var(--mc-diamond);
}

.api-config-panel {
  display: grid;
  gap: 16px;
  padding-bottom: 12px;
}

.form-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--mc-text-muted);
  line-height: 1.5;
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
    grid-template-columns: repeat(3, minmax(0, 1fr));
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

  .top-header h1 {
    font-size: 24px;
  }
}
</style>
