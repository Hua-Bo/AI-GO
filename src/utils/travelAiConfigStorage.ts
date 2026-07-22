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
  providerKeys: {},
}

function syncProviderKeys(config: AiModelConfig): AiModelConfig {
  const providerKeys = { ...(config.providerKeys || {}) }
  if (config.apiKey.trim()) {
    providerKeys[config.provider] = config.apiKey.trim()
  }
  return {
    ...config,
    requestMode: 'direct',
    providerKeys,
    apiKey: providerKeys[config.provider] || config.apiKey || '',
  }
}

export function saveAiConfig(config: AiModelConfig) {
  const normalized = syncProviderKeys(config)
  localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(normalized))
}

export function loadAiConfig(): AiModelConfig {
  const raw = localStorage.getItem(AI_CONFIG_STORAGE_KEY)
    || localStorage.getItem(LEGACY_STORAGE_KEY)

  if (!raw) {
    return { ...defaultAiConfig, providerKeys: {} }
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AiModelConfig>
    const provider = parsed.provider && AI_PROVIDER_DEFAULTS[parsed.provider]
      ? parsed.provider
      : defaultAiConfig.provider
    const defaults = AI_PROVIDER_DEFAULTS[provider]
    const providerKeys = { ...(parsed.providerKeys || {}) }
    // 兼容旧数据：把当前 key 归到对应 provider 下
    if (parsed.apiKey?.trim() && !providerKeys[provider]) {
      providerKeys[provider] = parsed.apiKey.trim()
    }

    return {
      ...defaultAiConfig,
      ...parsed,
      provider,
      baseURL: parsed.baseURL || defaults.baseURL,
      model: parsed.model || defaults.model,
      requestMode: 'direct',
      providerKeys,
      apiKey: providerKeys[provider] || '',
    }
  } catch {
    return { ...defaultAiConfig, providerKeys: {} }
  }
}

export function clearAiConfig() {
  localStorage.removeItem(AI_CONFIG_STORAGE_KEY)
  localStorage.removeItem(LEGACY_STORAGE_KEY)
}

/** 切换提供商：先保存当前 key，再加载目标提供商已存 key */
export function switchProviderConfig(
  current: AiModelConfig,
  nextProvider: AiModelConfig['provider'],
): AiModelConfig {
  const providerKeys = { ...(current.providerKeys || {}) }
  if (current.apiKey.trim()) {
    providerKeys[current.provider] = current.apiKey.trim()
  }
  const defaults = AI_PROVIDER_DEFAULTS[nextProvider]
  return {
    ...current,
    provider: nextProvider,
    baseURL: defaults.baseURL,
    model: defaults.model,
    endpointMode: 'openai',
    requestMode: 'direct',
    providerKeys,
    apiKey: providerKeys[nextProvider] || '',
  }
}
