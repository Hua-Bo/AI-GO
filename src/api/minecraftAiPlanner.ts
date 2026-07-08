export type OutputLevel = 'simple' | 'standard' | 'detailed'
export type ProviderType = 'longcat' | 'openai' | 'deepseek' | 'qwen' | 'custom'

export interface ApiConfig {
  provider: ProviderType
  apiKey: string
  baseUrl: string
  model: string
  temperature: number
  useStream: boolean
  useProxy: boolean
  /** LongCat Thinking，默认关闭（与旅行方案一致） */
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
  isMock?: boolean
}

export interface MinecraftPlannerResponse {
  code: number
  message: string
  data: MinecraftPlanData
}

export interface StreamCallbacks {
  onMessage: (text: string) => void
  onDone?: (meta?: { model?: string; title?: string; summary?: string }) => void
  onError?: (error: unknown) => void
}

export const API_CONFIG_KEY = 'minecraft_ai_api_config'

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
    label: '自定义',
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
    useStream: true,
    useProxy: false,
    thinkingEnabled: false,
  }
}

const PLAY_TYPE_MAP: Record<string, string> = {
  survival: '生存开荒方案',
  building: '建筑主题方案',
  redstone: '红石机关方案',
  adventure: '剧情冒险地图',
  modpack: '模组整合包',
  server_event: '服务器活动',
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
  return `你是一个专业的 Minecraft 服务器策划、地图设计师和游戏运营策划。

请根据以下需求，生成一份完整、可执行、结构清晰的 Minecraft 游戏方案。

【基础配置】
- 玩法类型：${PLAY_TYPE_MAP[form.playType] || form.playType}
- 玩家人数：${form.playerCount}
- 游戏版本：${VERSION_MAP[form.gameVersion] || form.gameVersion}
- 游戏难度：${DIFFICULTY_MAP[form.difficulty] || form.difficulty}
- 方案风格：${joinLabels(form.style, STYLE_MAP)}
- 世界主题：${joinLabels(form.worldTheme, THEME_MAP)}

【系统要求】
- 是否需要经济系统：${form.needEconomy ? '需要' : '不需要'}
- 是否需要任务系统：${form.needQuest ? '需要' : '不需要'}
- 是否需要 Boss / 副本：${form.needBoss ? '需要' : '不需要'}
- 是否需要开服公告：${form.needAnnouncement ? '需要' : '不需要'}

【用户主要目标】
${form.mainGoal || '用户没有填写，请你自行设计一个完整且有趣的方案。'}

【特殊要求】
${form.requirements || '无特殊要求。'}

【输出要求】
1. 使用中文。
2. 使用 Markdown 格式。
3. 内容要具体，不要空泛。
4. 要能直接给玩家或服主使用。
5. 不要只写概念，要写执行步骤。
6. 根据输出长度：${form.outputLevel} 控制详细程度。
7. 必须包含以下结构：

# Minecraft 游戏方案：方案标题

## 1. 方案定位
## 2. 世界观与地图主题
## 3. 核心玩法循环
## 4. 阶段目标设计
## 5. 任务系统
## 6. 建筑与基地规划
## 7. 资源与经济系统
## 8. Boss / 副本 / 活动设计
## 9. 服务器规则与防坑建议
## 10. 运营活动节奏
## 11. 风险点与优化建议
## 12. 可直接使用的开服公告`
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '')
}

function chatCompletionsUrl(baseUrl: string) {
  const base = normalizeBaseUrl(baseUrl)
  return base.endsWith('/chat/completions') ? base : `${base}/chat/completions`
}

const SYSTEM_PROMPT = '你是专业 Minecraft 游戏策划、服务器运营策划和地图设计师。请输出结构完整、可执行的中文 Markdown 方案。'

function buildDirectRequestBody(
  data: MinecraftPlannerRequest,
  config: ApiConfig,
  stream: boolean,
) {
  const body: Record<string, unknown> = {
    model: config.model,
    temperature: config.temperature,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: data.prompt },
    ],
    stream,
  }
  // 与旅行方案一致：LongCat 需要传 thinking
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
    body: JSON.stringify(buildDirectRequestBody(data, config, false)),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'AI request failed')
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
        body: JSON.stringify(buildDirectRequestBody(data, config, true)),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        const text = await response.text()
        throw new Error(text || 'AI stream request failed')
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
            callbacks.onDone?.({ model: config.model })
            return
          }

          try {
            const json = JSON.parse(payload) as {
              choices?: Array<{ delta?: { content?: string | null } }>
            }
            const delta = json.choices?.[0]?.delta?.content || ''
            if (delta) callbacks.onMessage(delta)
          } catch (error) {
            console.warn('SSE parse error:', error, payload)
          }
        }
      }

      callbacks.onDone?.({ model: config.model })
    } catch (error) {
      if ((error as { name?: string })?.name === 'AbortError') {
        callbacks.onDone?.({ model: config.model })
        return
      }
      callbacks.onError?.(error)
    }
  })()

  return controller
}

export async function generateMinecraftPlan(
  data: MinecraftPlannerRequest,
  config?: Pick<ApiConfig, 'model' | 'temperature'>,
): Promise<MinecraftPlannerResponse> {
  const res = await fetch('/api/ai/minecraft/plan/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      model: config?.model,
      temperature: config?.temperature,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`AI 接口错误 ${res.status}: ${text.slice(0, 200)}`)
  }

  const json = (await res.json()) as MinecraftPlannerResponse
  if (!json || typeof json.code !== 'number') throw new Error('AI 接口返回格式不正确')
  if (json.code !== 200) throw new Error(json.message || 'AI 接口返回失败')
  return json
}

export function generateMinecraftPlanStream(
  data: MinecraftPlannerRequest,
  callbacks: StreamCallbacks,
  config?: Pick<ApiConfig, 'model' | 'temperature'>,
): AbortController {
  const controller = new AbortController()

  ;(async () => {
    try {
      const response = await fetch('/api/ai/minecraft/plan/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          model: config?.model,
          temperature: config?.temperature,
        }),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        const text = await response.text().catch(() => '')
        throw new Error(`AI stream request failed ${response.status}: ${text.slice(0, 200)}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''
      let meta: { model?: string; title?: string; summary?: string } | undefined

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const chunks = buffer.split('\n')
        buffer = chunks.pop() || ''

        for (const rawLine of chunks) {
          const line = rawLine.trim()
          if (!line) continue

          const text = line.startsWith('data:') ? line.slice(5).trim() : line
          if (!text) continue
          if (text === '[DONE]') {
            callbacks.onDone?.(meta)
            return
          }

          try {
            const json = JSON.parse(text) as {
              content?: string
              delta?: string
              model?: string
              title?: string
              summary?: string
              meta?: { model?: string; title?: string; summary?: string }
            }
            if (json.model || json.title || json.summary || json.meta) {
              meta = {
                model: json.model || json.meta?.model || meta?.model,
                title: json.title || json.meta?.title || meta?.title,
                summary: json.summary || json.meta?.summary || meta?.summary,
              }
            }
            const delta = json.content || json.delta || ''
            if (delta) callbacks.onMessage(delta)
          } catch {
            callbacks.onMessage(text)
          }
        }
      }

      callbacks.onDone?.(meta)
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

export function mockGenerateMinecraftPlan(
  form: MinecraftPlannerRequest,
): Promise<MinecraftPlannerResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const playType = PLAY_TYPE_MAP[form.playType] || form.playType
      const difficulty = DIFFICULTY_MAP[form.difficulty] || form.difficulty
      const version = VERSION_MAP[form.gameVersion] || form.gameVersion
      const themes = joinLabels(form.worldTheme, THEME_MAP)
      const styles = joinLabels(form.style, STYLE_MAP)
      const id = String(Date.now())
      const title = `Minecraft 游戏方案：${playType}`

      const content = `# ${title}

## 1. 方案定位
这是一个适合 ${form.playerCount} 人参与的 Minecraft ${playType}，整体难度为 ${difficulty}，建议游戏版本：${version}。
风格偏向「${styles}」，世界主题围绕「${themes}」展开。

## 2. 世界观与地图主题
玩家从草原出生点起步，逐步扩展到森林城、下界通道、沿海港口，最终面向末地远征。

## 3. 核心玩法循环
每日：收集资源、推进建筑、完成协作任务、兑换奖励。
反馈：装备升级、公共贡献、任务积分、建筑里程碑。

## 4. 阶段目标设计
### 前期
建立临时营地、基础仓储、农田与装备过渡。
### 中期
建设主基地分区、红石农场、村民交易与道路网络。
### 后期
准备末地挑战、纪念建筑与周常活动体系。

## 5. 任务系统
${form.needQuest ? '主线推进 + 支线建设 + 每日收集 + 每周活动。' : '弱化任务，强调自由建设。'}

## 6. 建筑与基地规划
建议分区：主城中心、居住区、农业区、工业区、仓储区、交易区、冒险传送区。

## 7. 资源与经济系统
${form.needEconomy ? '绿宝石/钻石积分货币，公共仓、商店、兑换区。' : '以公共共享为主，不强制经济。'}

## 8. Boss / 副本 / 活动设计
${form.needBoss ? '遗迹寻宝、下界突袭、末影龙决战，奖励材料包与称号。' : '弱化 Boss，偏建设探索。'}

## 9. 服务器规则与防坑建议
公共仓保护、活动外关闭 PvP、破坏需申请、争议交管理员。

## 10. 运营活动节奏
首周开荒竞赛，第二周建筑赛，长期周常寻宝与积分兑换。

## 11. 风险点与优化建议
避免目标过大，前期任务轻量，规则清晰，建筑工程拆分里程碑。

## 12. 可直接使用的开服公告
${form.needAnnouncement ? '欢迎来到本次 Minecraft 联机世界！一起打造有目标、有故事、有回忆的方块世界。' : '可不强制公告。'}
`

      resolve({
        code: 200,
        message: 'success',
        data: {
          id,
          title,
          summary: `适合 ${form.playerCount} 人的 ${playType} 演示方案`,
          content,
          createdAt: new Date().toISOString(),
          model: 'demo',
          isMock: true,
        },
      })
    }, 700)
  })
}
