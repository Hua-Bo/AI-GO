import type { AiModelConfig } from '@/types/travelTypes'

export const AI_PROVIDER_DEFAULTS: Record<AiModelConfig['provider'], { baseURL: string; model: string; label: string }> = {
  longcat: {
    label: 'LongCat',
    baseURL: 'https://api.longcat.chat/openai/v1',
    model: 'LongCat-2.0',
  },
  deepseek: {
    label: 'DeepSeek',
    baseURL: 'https://api.deepseek.com',
    model: 'deepseek-chat',
  },
  openai: {
    label: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  qwen: {
    label: '通义千问',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
  },
  zhipu: {
    label: '智谱',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4-flash',
  },
}

export const AI_CONFIG_STORAGE_KEY = 'travel_ai_model_config'
const LEGACY_STORAGE_KEY = 'travel-ai-model-config'

export const defaultAiConfig: AiModelConfig = {
  provider: 'longcat',
  baseURL: AI_PROVIDER_DEFAULTS.longcat.baseURL,
  apiKey: '',
  model: AI_PROVIDER_DEFAULTS.longcat.model,
  requestMode: 'direct',
  endpointMode: 'openai',
  temperature: 0.2,
  maxTokens: 4096,
  thinkingEnabled: false,
}

export function saveAiConfig(config: AiModelConfig) {
  localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify({
    ...config,
    requestMode: 'direct',
  }))
}

export function loadAiConfig(): AiModelConfig {
  const raw = localStorage.getItem(AI_CONFIG_STORAGE_KEY)
    || localStorage.getItem(LEGACY_STORAGE_KEY)

  if (!raw) {
    return { ...defaultAiConfig }
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AiModelConfig>
    const provider = parsed.provider && AI_PROVIDER_DEFAULTS[parsed.provider]
      ? parsed.provider
      : defaultAiConfig.provider
    const defaults = AI_PROVIDER_DEFAULTS[provider]

    return {
      ...defaultAiConfig,
      ...parsed,
      provider,
      baseURL: parsed.baseURL || defaults.baseURL,
      model: parsed.model || defaults.model,
      requestMode: 'direct',
    }
  } catch {
    return { ...defaultAiConfig }
  }
}

export function clearAiConfig() {
  localStorage.removeItem(AI_CONFIG_STORAGE_KEY)
  localStorage.removeItem(LEGACY_STORAGE_KEY)
}
