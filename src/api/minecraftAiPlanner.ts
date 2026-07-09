export type OutputLevel = 'simple' | 'standard' | 'detailed'
export type ProviderType = 'longcat' | 'openai' | 'deepseek' | 'qwen' | 'custom'

export interface ApiConfig {
  provider: ProviderType
  apiKey: string
  baseUrl: string
  model: string
  temperature: number
  stream: boolean
  /** LongCat Thinking */
  thinkingEnabled?: boolean
}

export interface MinecraftPlannerRequest {
  playType: string
  playerCount: number
  gameVersion: string
  difficulty: string
  style: string[]
  worldTheme: string[]
  needEconomy: boolean
  needQuest: boolean
  needBoss: boolean
  needAnnouncement: boolean
  mainGoal: string
  requirements: string
  outputLevel: OutputLevel
  prompt: string
}

export interface MinecraftPlanData {
  id: string
  title: string
  summary: string
  content: string
  createdAt: string
  model?: string
}

export interface StreamCallbacks {
  onMessage: (text: string) => void
  onDone?: () => void
  onError?: (error: unknown) => void
}

export const API_CONFIG_KEY = 'minecraft_ai_user_config'
export const LEGACY_API_CONFIG_KEY = 'minecraft_ai_api_config'

export const providerPresets: Record<ProviderType, { label: string; baseUrl: string; model: string }> = {
  longcat: {
    label: 'LongCat',
    baseUrl: 'https://api.longcat.chat/openai/v1',
    model: 'LongCat-2.0',
  },
  deepseek: {
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
  },
  openai: {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  qwen: {
    label: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
  },
  custom: {
    label: '自定义兼容接口',
    baseUrl: '',
    model: '',
  },
}

export function createDefaultApiConfig(): ApiConfig {
  return {
    provider: 'longcat',
    apiKey: '',
    baseUrl: providerPresets.longcat.baseUrl,
    model: providerPresets.longcat.model,
    temperature: 0.7,
    stream: true,
    thinkingEnabled: false,
  }
}

const PLAY_TYPE_MAP: Record<string, string> = {
  survival: '生存开荒方案',
  building: '建筑主题方案',
  redstone: '红石机关方案',
  adventure: '剧情冒险地图',
  modpack: '模组整合包方案',
  server_event: '服务器活动方案',
  multiplayer: '多人联机玩法',
  beginner: '新手教学路线',
}

const DIFFICULTY_MAP: Record<string, string> = {
  easy: '轻松',
  normal: '普通',
  hardcore: '硬核',
}

const VERSION_MAP: Record<string, string> = {
  java_1_21: 'Java 1.21.x',
  java_1_20: 'Java 1.20.x',
  java_1_19: 'Java 1.19.x',
  bedrock: '基岩版 Bedrock',
  any: '不限版本',
}

const STYLE_MAP: Record<string, string> = {
  casual: '休闲养老',
  challenge: '硬核挑战',
  story: '剧情沉浸',
  teamwork: '多人协作',
  aesthetic: '建筑美学',
  automation: '自动化科技',
  economy: '经济系统',
  quest: '任务驱动',
}

const THEME_MAP: Record<string, string> = {
  medieval: '中世纪王国',
  sky_island: '空岛群落',
  end: '末地远征',
  nether: '下界工业',
  oriental: '东方修仙',
  wasteland: '废土生存',
  magic: '魔法学院',
  tech_city: '科技都市',
}

function joinLabels(values: string[], map: Record<string, string>) {
  if (!values.length) return '不限'
  return values.map((v) => map[v] || v).join('、')
}

export function getPlayTypeLabel(value: string) {
  return PLAY_TYPE_MAP[value] || value
}

export function buildMinecraftPlannerPrompt(form: Omit<MinecraftPlannerRequest, 'prompt'> & { prompt?: string }) {
  return `你是一个专业的 Minecraft 游戏策划、服务器运营策划和地图设计师。

请根据下面的用户需求，生成一份完整、可执行、适合普通玩家阅读的 Minecraft 游戏方案。

【基础信息】
- 游戏类型：${PLAY_TYPE_MAP[form.playType] || form.playType}
- 玩家人数：${form.playerCount}
- 游戏版本：${VERSION_MAP[form.gameVersion] || form.gameVersion}
- 难度：${DIFFICULTY_MAP[form.difficulty] || form.difficulty}
- 世界主题：${joinLabels(form.worldTheme, THEME_MAP)}
- 玩法风格：${joinLabels(form.style, STYLE_MAP)}

【需要包含】
- 任务系统：${form.needQuest ? '需要' : '不需要'}
- 经济系统：${form.needEconomy ? '需要' : '不需要'}
- Boss / 副本：${form.needBoss ? '需要' : '不需要'}
- 开服公告：${form.needAnnouncement ? '需要' : '不需要'}

【用户目标】
${form.mainGoal || '用户没有填写，请你自行设计一个完整、有趣、容易执行的方案。'}

【特殊要求】
${form.requirements || '无特殊要求。'}

【输出格式】
请使用 Markdown 输出，但内容要适合被渲染成网页富文本，并导出为 Word / PDF。
不要输出代码块。
不要输出过多表格，普通用户不方便阅读。
请使用清晰的标题、段落、列表。
根据输出长度「${form.outputLevel}」控制详细程度。

必须包含以下结构：

# Minecraft 游戏方案：请生成一个具体标题

## 1. 方案概览
## 2. 适合玩家
## 3. 世界观与地图主题
## 4. 核心玩法循环
## 5. 阶段目标设计
## 6. 任务系统
## 7. 建筑与基地规划
## 8. 资源与经济系统
## 9. Boss / 副本 / 活动设计
## 10. 服务器规则
## 11. 运营活动节奏
## 12. 风险点与优化建议
## 13. 可直接使用的开服公告`
}

const SYSTEM_PROMPT = '你是专业 Minecraft 游戏策划、服务器运营策划和地图设计师。请输出结构完整、可执行的中文 Markdown 方案。'

function chatCompletionsUrl(baseUrl: string) {
  const base = baseUrl.replace(/\/+$/, '')
  return base.endsWith('/chat/completions') ? base : `${base}/chat/completions`
}

function buildDirectBody(data: MinecraftPlannerRequest, config: ApiConfig, stream: boolean) {
  const body: Record<string, unknown> = {
    model: config.model,
    temperature: config.temperature,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: data.prompt },
    ],
    stream,
  }
  if (config.provider === 'longcat') {
    body.thinking = { type: config.thinkingEnabled ? 'enabled' : 'disabled' }
  }
  return body
}

export async function generateByDirectApi(
  data: MinecraftPlannerRequest,
  config: ApiConfig,
): Promise<string> {
  const response = await fetch(chatCompletionsUrl(config.baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(buildDirectBody(data, config, false)),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'AI 生成失败')
  }

  const json = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>
  }
  return json.choices?.[0]?.message?.content || ''
}

export function generateByDirectApiStream(
  data: MinecraftPlannerRequest,
  config: ApiConfig,
  callbacks: StreamCallbacks,
): AbortController {
  const controller = new AbortController()

  ;(async () => {
    try {
      const response = await fetch(chatCompletionsUrl(config.baseUrl), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(buildDirectBody(data, config, true)),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        const text = await response.text()
        throw new Error(text || 'AI 流式生成失败')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data:')) continue

          const payload = trimmed.slice(5).trim()
          if (!payload) continue
          if (payload === '[DONE]') {
            callbacks.onDone?.()
            return
          }

          try {
            const json = JSON.parse(payload) as {
              choices?: Array<{ delta?: { content?: string | null } }>
            }
            const delta = json.choices?.[0]?.delta?.content || ''
            if (delta) callbacks.onMessage(delta)
          } catch (error) {
            console.warn('SSE parse error', error)
          }
        }
      }

      callbacks.onDone?.()
    } catch (error) {
      if ((error as { name?: string })?.name === 'AbortError') {
        callbacks.onDone?.()
        return
      }
      callbacks.onError?.(error)
    }
  })()

  return controller
}

export function getTitleFromContent(content: string) {
  return content
    .split('\n')
    .find((line) => line.startsWith('# '))
    ?.replace(/^#\s*/, '')
    .trim() || 'Minecraft 游戏方案'
}

export function loadStoredApiConfig(): ApiConfig {
  const defaults = createDefaultApiConfig()
  const raw = localStorage.getItem(API_CONFIG_KEY) || localStorage.getItem(LEGACY_API_CONFIG_KEY)
  if (!raw) return defaults

  try {
    const parsed = JSON.parse(raw) as Partial<ApiConfig & { useStream?: boolean }>
    return {
      ...defaults,
      ...parsed,
      stream: parsed.stream ?? parsed.useStream ?? defaults.stream,
      thinkingEnabled: parsed.thinkingEnabled ?? false,
    }
  } catch {
    return defaults
  }
}

export function saveStoredApiConfig(config: ApiConfig) {
  localStorage.setItem(API_CONFIG_KEY, JSON.stringify(config))
}

export function clearStoredApiConfig() {
  localStorage.removeItem(API_CONFIG_KEY)
  localStorage.removeItem(LEGACY_API_CONFIG_KEY)
}
