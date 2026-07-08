import type { AiModelConfig } from '@/types/travelTypes'
export type AiErrorType =
  | 'missing_key'
  | 'network'
  | 'cors'
  | 'auth'
  | 'http'
  | 'json_parse'
  | 'empty_response'
  | 'unknown'

const GH_PAGES_CORS_HINT =
  '请求失败，可能是模型接口不支持浏览器跨域 CORS，或者网络不可用。GitHub Pages 是纯静态部署，无法隐藏 Key，也无法提供后端代理。如果该模型不支持浏览器直连，请改用云服务器代理部署。'

export class AiRequestError extends Error {
  type: AiErrorType
  status?: number
  raw?: unknown
  constructor(message: string, type: AiErrorType, status?: number, raw?: unknown) {
    super(message)
    this.name = 'AiRequestError'
    this.type = type
    this.status = status
    this.raw = raw
  }
}

export class AiJsonParseError extends Error {
  rawText?: string
  constructor(message: string, rawText?: string) {
    super(message)
    this.name = 'AiJsonParseError'
    this.rawText = rawText
  }
}

export function extractJsonText(raw: string): string {
  let text = raw.trim()
  text = text.replace(/^```json\s*/i, '')
  text = text.replace(/^```\s*/i, '')
  text = text.replace(/```\s*$/i, '')

  const objectStart = text.indexOf('{')
  const objectEnd = text.lastIndexOf('}')
  const arrayStart = text.indexOf('[')
  const arrayEnd = text.lastIndexOf(']')

  if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
    return text.slice(objectStart, objectEnd + 1)
  }
  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
    return text.slice(arrayStart, arrayEnd + 1)
  }
  return text
}

export function cleanJsonText(raw: string): string {
  return raw
    .replace(/，/g, ',')
    .replace(/：/g, ':')
    .replace(/“|”/g, '"')
    .replace(/‘|’/g, "'")
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
    .trim()
}

export function safeParseAiJson<T>(text: string, tryClean = false): T {
  const trimmed = text.trim()
  if (!trimmed) throw new AiJsonParseError('AI 返回内容为空', trimmed)

  const candidates = [trimmed, extractJsonText(trimmed)]
  if (tryClean) {
    candidates.push(cleanJsonText(extractJsonText(trimmed)))
  }

  let lastError: unknown
  const unique = [...new Set(candidates.filter(Boolean))]
  for (const candidate of unique) {
    try {
      return JSON.parse(candidate) as T
    } catch (e) {
      lastError = e
    }
  }

  throw new AiJsonParseError(
    `AI 返回的 JSON 无法解析：${lastError instanceof Error ? lastError.message : '格式错误'}`,
    trimmed.slice(0, 8000),
  )
}

export function buildChatCompletionsUrl(config: AiModelConfig): string {
  if (config.requestMode === 'proxy') {
    return config.proxyURL || '/api/ai/chat'
  }
  const base = String(config.baseURL || '').replace(/\/+$/, '')
  if (base.endsWith('/chat/completions')) return base
  return `${base}/chat/completions`
}

function normalizeChatUrl(baseURL: string): string {
  const base = baseURL.replace(/\/+$/, '')
  if (base.endsWith('/chat/completions')) return base
  if (base.endsWith('/v1') || base.endsWith('/compatible-mode/v1') || base.endsWith('/api/paas/v4')) {
    return `${base}/chat/completions`
  }
  return `${base}/v1/chat/completions`
}

function getAiMessageContent(response: any): string {
  const content = response?.choices?.[0]?.message?.content
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item
        if (typeof item?.text === 'string') return item.text
        return ''
      })
      .join('')
  }
  return ''
}

export async function callAiChatRaw(params: {
  config: AiModelConfig
  systemPrompt: string
  userPrompt: string
  maxTokens?: number
  temperature?: number
  signal?: AbortSignal
  withJsonFormat?: boolean
}): Promise<string> {
  const { config, systemPrompt, userPrompt, signal } = params
  const isProxy = config.requestMode === 'proxy'
  const apiKey = config.apiKey.trim()
  if (!isProxy && !apiKey) {
    throw new AiRequestError('请先在 AI 配置中填写你自己的 API Key', 'missing_key')
  }

  const url = normalizeChatUrl(config.baseURL)
  const endpointMode = config.endpointMode || 'openai'
  const body: Record<string, unknown> = {
    model: config.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: params.temperature ?? config.temperature ?? 0.2,
  }
  if (params.maxTokens || config.maxTokens) body.max_tokens = params.maxTokens || config.maxTokens
  if (config.provider === 'longcat') {
    body.thinking = { type: config.thinkingEnabled ? 'enabled' : 'disabled' }
  }
  if (params.withJsonFormat !== false && config.provider === 'openai') {
    body.response_format = { type: 'json_object' }
  }

  const openaiUrl = config.provider === 'longcat' ? buildChatCompletionsUrl(config) : url
  const anthropicUrl = `${config.baseURL.replace(/\/+$/, '')}/messages`
  const requestBody = endpointMode === 'anthropic'
    ? {
        model: config.model,
        max_tokens: params.maxTokens || config.maxTokens || 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }
    : body
  const requestUrl = isProxy
    ? (config.proxyURL || '/api/ai/chat')
    : (endpointMode === 'anthropic' ? anthropicUrl : openaiUrl)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(isProxy ? {} : { Authorization: `Bearer ${apiKey}` }),
    ...(!isProxy && endpointMode === 'anthropic' ? { 'anthropic-version': '2023-06-01' } : {}),
  }

  let res: Response
  try {
    res = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(isProxy
        ? {
            provider: config.provider,
            baseURL: config.baseURL,
            model: config.model,
            messages: body.messages,
            temperature: body.temperature,
            max_tokens: body.max_tokens,
            stream: false,
            ...(config.provider === 'longcat'
              ? { thinking: body.thinking }
              : {}),
          }
        : requestBody),
      signal,
    })
  } catch (error) {
    if (error instanceof TypeError && String(error.message).toLowerCase().includes('fetch')) {
      throw new AiRequestError(GH_PAGES_CORS_HINT, 'cors')
    }
    throw new AiRequestError(error instanceof Error ? error.message : '请求失败', 'network')
  }

  if (!res.ok) {
    let detail = res.statusText || ''
    try {
      const errText = await res.text()
      detail = errText || detail
    } catch {}
    throw new AiRequestError(
      res.status === 401 || res.status === 403
        ? 'API Key 无效或没有权限，请检查你填写的 Key。'
        : `AI 接口请求失败：HTTP ${res.status}${detail ? ` - ${detail.slice(0, 300)}` : ''}`,
      res.status === 401 || res.status === 403 ? 'auth' : 'http',
      res.status,
      detail,
    )
  }

  let data: any
  try {
    data = await res.json()
  } catch (e) {
    throw new AiRequestError('接口有响应，但不是 JSON。请检查模型输出格式。', 'json_parse', undefined, e)
  }
  const content = endpointMode === 'anthropic'
    ? (Array.isArray(data?.content) ? data.content.map((item: any) => item?.text || '').join('') : '')
    : getAiMessageContent(data)
  if (!content) throw new AiRequestError('AI 返回内容为空', 'empty_response', undefined, data)
  return content
}

export async function testAiConnection(config: AiModelConfig): Promise<void> {
  await callAiChatRaw({
    config,
    systemPrompt: '你只返回严格 JSON，不要解释。',
    userPrompt: `请返回 {"ok":true,"provider":"${config.provider}","model":"${config.model}"}`,
    temperature: 0.1,
    maxTokens: 256,
    withJsonFormat: false,
  })
}

export async function repairJsonByAi(params: {
  config: AiModelConfig
  brokenJson: string
  errorMessage: string
  expectedSchemaHint: string
  signal?: AbortSignal
}): Promise<string> {
  const truncated = params.brokenJson.length > 12000
    ? params.brokenJson.slice(0, 12000) + '\n...(truncated)'
    : params.brokenJson

  const userPrompt = `下面是一段格式错误的 JSON。请你只修复 JSON 格式，不要改变字段含义，不要新增解释，不要输出 Markdown。

错误信息：
${params.errorMessage}

期望结构：
${params.expectedSchemaHint}

错误 JSON：
${truncated}

请只返回修复后的严格 JSON。`

  return callAiChatRaw({
    config: params.config,
    systemPrompt: '你是 JSON 修复助手。只输出修复后的合法 JSON，不要 Markdown，不要解释。',
    userPrompt,
    temperature: 0.1,
    maxTokens: 8192,
    signal: params.signal,
    withJsonFormat: true,
  })
}

export async function callAiChatJson<T>(params: {
  config: AiModelConfig
  systemPrompt: string
  userPrompt: string
  maxTokens?: number
  temperature?: number
  retry?: number
  repairOnFail?: boolean
  expectedSchemaHint?: string
  signal?: AbortSignal
}): Promise<T> {
  const maxRetry = params.retry ?? 2
  const repairOnFail = params.repairOnFail !== false
  let lastRaw = ''
  let lastError: AiJsonParseError | Error | null = null

  for (let attempt = 0; attempt <= maxRetry; attempt++) {
    try {
      let text: string
      try {
        text = await callAiChatRaw({
          config: params.config,
          systemPrompt: params.systemPrompt,
          userPrompt: params.userPrompt,
          maxTokens: params.maxTokens,
          temperature: params.temperature ?? 0.2,
          signal: params.signal,
          withJsonFormat: true,
        })
      } catch (e) {
        if (params.signal?.aborted) throw e
        text = await callAiChatRaw({
          config: params.config,
          systemPrompt: params.systemPrompt,
          userPrompt: params.userPrompt,
          maxTokens: params.maxTokens,
          temperature: params.temperature ?? 0.2,
          signal: params.signal,
          withJsonFormat: false,
        })
      }
      lastRaw = text
      try {
        return safeParseAiJson<T>(text)
      } catch (parseErr) {
        if (!(parseErr instanceof AiJsonParseError)) throw parseErr
        try {
          return safeParseAiJson<T>(text, true)
        } catch {
          if (!repairOnFail || attempt >= maxRetry) throw parseErr
          const repaired = await repairJsonByAi({
            config: params.config,
            brokenJson: extractJsonText(text),
            errorMessage: parseErr.message,
            expectedSchemaHint: params.expectedSchemaHint || '合法 JSON 对象',
            signal: params.signal,
          })
          lastRaw = repaired
          return safeParseAiJson<T>(repaired, true)
        }
      }
    } catch (e) {
      if (params.signal?.aborted) throw new Error('已停止生成')
      lastError = e instanceof AiJsonParseError ? e : (e instanceof Error ? e : new Error(String(e)))
      if (attempt >= maxRetry) break
    }
  }

  if (lastError instanceof AiJsonParseError) {
    throw new AiJsonParseError(lastError.message, lastRaw || lastError.rawText)
  }
  if (lastError instanceof AiRequestError) throw lastError
  throw new AiRequestError(lastError?.message || 'AI 请求失败', 'unknown')
}
