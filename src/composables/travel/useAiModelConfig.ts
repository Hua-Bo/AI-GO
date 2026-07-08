import { computed, ref, watch } from 'vue'
import type { AiModelConfig } from '@/types/travelTypes'
import {
  AI_PROVIDER_DEFAULTS,
  clearAiConfig,
  loadAiConfig,
  saveAiConfig,
} from '@/utils/travelAiConfigStorage'

export { AI_PROVIDER_DEFAULTS }

function buildDefaultConfig(): AiModelConfig {
  const stored = loadAiConfig()
  const envProvider = (import.meta.env.VITE_AI_PROVIDER || '') as AiModelConfig['provider']
  const provider = stored.provider
    || (envProvider && AI_PROVIDER_DEFAULTS[envProvider] ? envProvider : 'longcat')
  const defaults = AI_PROVIDER_DEFAULTS[provider]

  return {
    ...stored,
    provider,
    baseURL: stored.baseURL || defaults.baseURL,
    model: stored.model || defaults.model,
    apiKey: stored.apiKey || import.meta.env.VITE_AI_API_KEY || '',
    endpointMode: stored.endpointMode || 'openai',
    requestMode: 'direct',
    temperature: stored.temperature ?? 0.2,
    maxTokens: stored.maxTokens ?? 4096,
    thinkingEnabled: stored.thinkingEnabled ?? false,
  }
}

export function useAiModelConfig() {
  const config = ref<AiModelConfig>(buildDefaultConfig())
  const configDialogVisible = ref(false)

  const hasApiKey = computed(() => !!config.value.apiKey.trim())

  function saveConfig(next: AiModelConfig) {
    const normalized: AiModelConfig = {
      ...next,
      requestMode: 'direct',
    }
    config.value = normalized
    saveAiConfig(normalized)
  }

  function clearConfig() {
    clearAiConfig()
    config.value = {
      ...config.value,
      apiKey: '',
      requestMode: 'direct',
    }
  }

  function applyProviderDefaults(provider: AiModelConfig['provider']) {
    const d = AI_PROVIDER_DEFAULTS[provider]
    config.value = {
      ...config.value,
      provider,
      baseURL: d.baseURL,
      model: d.model,
      endpointMode: 'openai',
      requestMode: 'direct',
    }
  }

  watch(
    () => config.value.provider,
    (p) => {
      const d = AI_PROVIDER_DEFAULTS[p]
      if (config.value.baseURL === AI_PROVIDER_DEFAULTS.deepseek.baseURL
        || Object.values(AI_PROVIDER_DEFAULTS).some((x) => x.baseURL === config.value.baseURL)) {
        config.value.baseURL = d.baseURL
        config.value.model = d.model
      }
    },
  )

  return {
    config,
    configDialogVisible,
    hasApiKey,
    saveConfig,
    clearConfig,
    applyProviderDefaults,
  }
}
