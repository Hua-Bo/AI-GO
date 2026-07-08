import type { Request, Response } from 'express'
import { env } from './env'
import { buildChatCompletionsUrl, maskApiKey } from './provider'

const PROVIDER_DEFAULTS: Record<string, { baseURL: string; model: string }> = {
  longcat: {
    baseURL: 'https://api.longcat.chat/openai/v1',
    model: 'LongCat-2.0',
  },
  deepseek: {
    baseURL: 'https://api.deepseek.com',
    model: 'deepseek-chat',
  },
  openai: {
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  qwen: {
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
  },
  zhipu: {
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4-flash',
  },
}

function resolveProviderConfig(body: Record<string, unknown>) {
  const provider = env.allowClientProvider
    ? String(body.provider || env.aiProvider)
    : env.aiProvider

  const defaults = PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.longcat

  const baseURL = env.allowClientProvider
    ? String(body.baseURL || env.aiBaseURL || defaults.baseURL)
    : env.aiBaseURL || defaults.baseURL

  const model = env.allowClientProvider
    ? String(body.model || env.aiModel || defaults.model)
    : env.aiModel || defaults.model

  return { provider, baseURL, model }
}

function buildPrompt(body: Record<string, unknown>) {
  if (typeof body.prompt === 'string' && body.prompt.trim()) return body.prompt.trim()
  return `请根据以下 Minecraft 方案配置生成完整 Markdown 方案：\n${JSON.stringify(body, null, 2)}`
}

function extractContentFromUpstream(text: string) {
  try {
    const json = JSON.parse(text) as {
      choices?: Array<{ message?: { content?: string } }>
      content?: string
    }
    return json.choices?.[0]?.message?.content || json.content || text
  } catch {
    return text
  }
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

function writeSse(res: Response, payload: unknown) {
  res.write(`data: ${typeof payload === 'string' ? payload : JSON.stringify(payload)}\n\n`)
}

export async function generateMinecraftPlan(req: Request, res: Response) {
  try {
    const body = (req.body || {}) as Record<string, unknown>

    if (body.apiKey || body.api_key) {
      return res.status(400).json({
        error: 'Client must not send API Key. Configure AI_API_KEY on server.',
      })
    }

    if (!env.aiApiKey) {
      return res.status(500).json({
        error: 'AI_API_KEY is not configured on server',
      })
    }

    const { provider, baseURL, model } = resolveProviderConfig(body)
    const url = buildChatCompletionsUrl(baseURL)
    const prompt = buildPrompt(body)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), env.aiTimeout)

    const upstreamBody: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: '你是专业 Minecraft 游戏策划、地图设计师和服务器运营顾问。请输出结构完整、可执行的中文 Markdown 方案。' },
        { role: 'user', content: prompt },
      ],
      temperature: body.temperature ?? 0.7,
      max_tokens: body.max_tokens ?? env.aiMaxTokens,
      stream: false,
    }

    if (provider === 'longcat') {
      upstreamBody.thinking = body.thinking || { type: 'disabled' }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.aiApiKey}`,
      },
      body: JSON.stringify(upstreamBody),
      signal: controller.signal,
    })

    clearTimeout(timer)
    const text = await response.text()

    if (!response.ok) {
      console.error('[minecraft-plan] upstream failed', {
        status: response.status,
        provider,
        model,
        baseURL,
        key: maskApiKey(env.aiApiKey),
      })
      return res.status(response.status).json({
        error: 'AI upstream request failed',
        status: response.status,
        provider,
        model,
        baseURL,
        message: text,
      })
    }

    const content = extractContentFromUpstream(text)
    return res.json({
      code: 200,
      message: 'success',
      data: {
        id: String(Date.now()),
        title: extractTitle(content),
        summary: extractSummary(content),
        content,
        createdAt: new Date().toISOString(),
        model,
      },
    })
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string }
    if (err?.name === 'AbortError') {
      return res.status(504).json({ error: 'AI request timeout' })
    }
    console.error('[minecraft-plan] error', err?.message || error)
    return res.status(500).json({
      error: 'Minecraft plan generate error',
      message: err?.message || String(error),
    })
  }
}

export async function streamMinecraftPlan(req: Request, res: Response) {
  try {
    const body = (req.body || {}) as Record<string, unknown>

    if (body.apiKey || body.api_key) {
      return res.status(400).json({
        error: 'Client must not send API Key. Configure AI_API_KEY on server.',
      })
    }

    if (!env.aiApiKey) {
      return res.status(500).json({
        error: 'AI_API_KEY is not configured on server',
      })
    }

    const { provider, baseURL, model } = resolveProviderConfig(body)
    const url = buildChatCompletionsUrl(baseURL)
    const prompt = buildPrompt(body)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), env.aiTimeout)

    req.on('close', () => {
      controller.abort()
    })

    const upstreamBody: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: '你是专业 Minecraft 游戏策划、地图设计师和服务器运营顾问。请输出结构完整、可执行的中文 Markdown 方案。' },
        { role: 'user', content: prompt },
      ],
      temperature: body.temperature ?? 0.7,
      max_tokens: body.max_tokens ?? env.aiMaxTokens,
      stream: true,
    }

    if (provider === 'longcat') {
      upstreamBody.thinking = body.thinking || { type: 'disabled' }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.aiApiKey}`,
      },
      body: JSON.stringify(upstreamBody),
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => '')
      console.error('[minecraft-plan-stream] upstream failed', {
        status: response.status,
        provider,
        model,
        baseURL,
        key: maskApiKey(env.aiApiKey),
      })
      return res.status(response.status).json({
        error: 'AI upstream stream failed',
        status: response.status,
        provider,
        model,
        baseURL,
        message: text,
      })
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders?.()

    writeSse(res, { meta: { model }, model })

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let fullText = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const rawLine of lines) {
        const line = rawLine.trim()
        if (!line.startsWith('data:')) continue
        const payload = line.slice(5).trim()
        if (!payload) continue

        if (payload === '[DONE]') {
          writeSse(res, {
            meta: {
              model,
              title: extractTitle(fullText),
              summary: extractSummary(fullText),
            },
          })
          writeSse(res, '[DONE]')
          return res.end()
        }

        try {
          const json = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string | null } }>
          }
          const delta = json.choices?.[0]?.delta?.content || ''
          if (delta) {
            fullText += delta
            writeSse(res, { content: delta })
          }
        } catch {
          // ignore malformed chunk
        }
      }
    }

    writeSse(res, {
      meta: {
        model,
        title: extractTitle(fullText),
        summary: extractSummary(fullText),
      },
    })
    writeSse(res, '[DONE]')
    return res.end()
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string }
    if (err?.name === 'AbortError') {
      if (!res.headersSent) {
        return res.status(504).json({ error: 'AI request timeout' })
      }
      writeSse(res, { content: '\n\n> 请求已取消或超时' })
      writeSse(res, '[DONE]')
      return res.end()
    }

    console.error('[minecraft-plan-stream] error', err?.message || error)
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Minecraft plan stream error',
        message: err?.message || String(error),
      })
    }
    writeSse(res, { content: `\n\n> 生成失败：${err?.message || String(error)}` })
    writeSse(res, '[DONE]')
    return res.end()
  }
}
