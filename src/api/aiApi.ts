import type { AiProvider, ChatRequest, ProviderConfig } from '@/types/aiTypes'

const PROVIDER_DEFAULTS: Record<AiProvider, { baseURL: string; modelName: string }> = {
  openai: {
    baseURL: import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1',
    modelName: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
  },
  qwen: {
    baseURL: import.meta.env.VITE_QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    modelName: import.meta.env.VITE_QWEN_MODEL || 'qwen-plus',
  },
  zhipu: {
    baseURL: import.meta.env.VITE_ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
    modelName: import.meta.env.VITE_ZHIPU_MODEL || 'glm-4-flash',
  },
  deepseek: {
    baseURL: import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    modelName: import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat',
  },
  mock: {
    baseURL: '',
    modelName: 'mock-agent',
  },
}

const ENV_API_KEYS: Record<Exclude<AiProvider, 'mock'>, string> = {
  openai: import.meta.env.VITE_OPENAI_API_KEY || '',
  qwen: import.meta.env.VITE_QWEN_API_KEY || '',
  zhipu: import.meta.env.VITE_ZHIPU_API_KEY || '',
  deepseek: import.meta.env.VITE_DEEPSEEK_API_KEY || '',
}

export function getDefaultProviderConfig(provider: AiProvider = 'mock'): ProviderConfig {
  const defaults = PROVIDER_DEFAULTS[provider]
  return {
    provider,
    baseURL: defaults.baseURL,
    modelName: defaults.modelName,
    apiKey: provider === 'mock' ? '' : ENV_API_KEYS[provider],
  }
}

/** 优先用页面配置，其次读环境变量 */
export function resolveApiKey(config: ProviderConfig): string {
  if (config.provider === 'mock') return ''
  const manual = config.apiKey?.trim()
  if (manual) return manual
  return ENV_API_KEYS[config.provider] || ''
}

export function parseSseChunk(buffer: string): { events: string[]; rest: string } {
  const normalized = buffer.replace(/\r\n/g, '\n')
  const parts = normalized.split('\n\n')
  const rest = parts.pop() || ''
  return { events: parts, rest }
}

/** 从单条 SSE data JSON 提取文本增量 */
export function parsePayloadDelta(payload: string): string {
  if (!payload || payload === '[DONE]') return ''
  try {
    const json = JSON.parse(payload) as {
      choices?: Array<{
        delta?: { content?: string | null; reasoning_content?: string | null }
        text?: string
        message?: { content?: string }
      }>
    }
    const choice = json.choices?.[0]
    if (!choice) return ''
    const delta = choice.delta
    if (delta) {
      const text = (delta.content ?? '') + (delta.reasoning_content ?? '')
      if (text) return text
    }
    if (typeof choice.text === 'string') return choice.text
    if (choice.message?.content) return choice.message.content
    return ''
  } catch {
    return ''
  }
}

export function extractSseDelta(eventBlock: string): string {
  const normalized = eventBlock.replace(/\r\n/g, '\n').trim()
  if (!normalized) return ''
  let result = ''
  for (const line of normalized.split('\n')) {
    if (!line.startsWith('data:')) continue
    const payload = line.slice(5).trim()
    result += parsePayloadDelta(payload)
  }
  return result
}

/** 按行解析 SSE，避免 TCP 分片导致 JSON 截断 */
export function consumeSseLines(buffer: string, onPayload: (payload: string) => void): string {
  const normalized = buffer.replace(/\r\n/g, '\n')
  const lines = normalized.split('\n')
  const rest = lines.pop() ?? ''
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('data:')) continue
    const payload = trimmed.slice(5).trim()
    if (payload) onPayload(payload)
  }
  return rest
}

/** OpenAI 兼容接口流式聊天 */
export async function streamChat(
  config: ProviderConfig,
  request: ChatRequest,
  signal: AbortSignal,
  onDelta: (text: string) => void,
): Promise<void> {
  if (config.provider === 'mock') {
    await mockStreamChat(onDelta, signal)
    return
  }
  const apiKey = resolveApiKey(config)
  if (!apiKey) {
    throw new Error(
      `未配置 ${config.provider} 的 API Key。请在项目根目录创建 .env.local 填写 VITE_${config.provider.toUpperCase()}_API_KEY 后重启 dev，或在顶栏 API Key 输入框填写`,
    )
  }

  const response = await fetch(`${config.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      ...request,
      model: config.modelName,
      stream: true,
    }),
    signal,
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`AI 接口错误 ${response.status}: ${errText.slice(0, 200)}`)
  }
  if (!response.body) throw new Error('响应体为空')

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    buffer = consumeSseLines(buffer, (payload) => {
      const delta = parsePayloadDelta(payload)
      if (delta) onDelta(delta)
    })
  }

  if (buffer.trim()) {
    consumeSseLines(`${buffer}\n`, (payload) => {
      const delta = parsePayloadDelta(payload)
      if (delta) onDelta(delta)
    })
  }
}

/** Mock 流式输出 */
export function mockStreamChat(
  onDelta: (text: string) => void,
  signal: AbortSignal,
  text?: string,
): Promise<void> {
  const content = text || '## 答复\n\n已处理您的请求。'
  return new Promise((resolve, reject) => {
    let index = 0
    const timer = window.setInterval(() => {
      if (signal.aborted) {
        clearInterval(timer)
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }
      if (index >= content.length) {
        clearInterval(timer)
        resolve()
        return
      }
      const step = Math.min(3, content.length - index)
      onDelta(content.slice(index, index + step))
      index += step
    }, 30)
    signal.addEventListener('abort', () => {
      clearInterval(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
}
