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

export async function proxyAiChat(req: Request, res: Response) {
  try {
    const body = (req.body || {}) as Record<string, unknown>

    if (body.apiKey || body.api_key) {
      return res.status(400).json({
        error: 'Client must not send API Key. Configure AI_API_KEY on server.',
      })
    }

    if (!Array.isArray(body.messages)) {
      return res.status(400).json({
        error: 'messages must be an array',
      })
    }

    if (!env.aiApiKey) {
      return res.status(500).json({
        error: 'AI_API_KEY is not configured on server',
      })
    }

    const { provider, baseURL, model } = resolveProviderConfig(body)
    const url = buildChatCompletionsUrl(baseURL)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), env.aiTimeout)

    const upstreamBody: Record<string, unknown> = {
      model,
      messages: body.messages,
      temperature: body.temperature ?? 0.2,
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
      console.error('[ai-proxy] upstream failed', {
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

    try {
      const json = JSON.parse(text)
      return res.json(json)
    } catch {
      return res.json({ raw: text })
    }
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string }
    if (err?.name === 'AbortError') {
      return res.status(504).json({ error: 'AI request timeout' })
    }

    console.error('[ai-proxy] error', err?.message || error)
    return res.status(500).json({
      error: 'AI proxy error',
      message: err?.message || String(error),
    })
  }
}
