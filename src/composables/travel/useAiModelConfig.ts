import { computed, ref } from 'vue'
import type { AiModelConfig } from '@/types/travelTypes'
import {
  AI_PROVIDER_DEFAULTS,
  clearAiConfig,
  loadAiConfig,
  saveAiConfig,
  switchProviderConfig,
} from '@/utils/travelAiConfigStorage'

export { AI_PROVIDER_DEFAULTS }

function buildDefaultConfig(): AiModelConfig {
  const stored = loadAiConfig()
  const envProvider = (import.meta.env.VITE_AI_PROVIDER || '') as AiModelConfig['provider']
  const provider = stored.provider
    || (envProvider && AI_PROVIDER_DEFAULTS[envProvider] ? envProvider : 'longcat')
  const defaults = AI_PROVIDER_DEFAULTS[provider]
  const providerKeys = { ...(stored.providerKeys || {}) }
  if (stored.apiKey?.trim() && !providerKeys[provider]) {
    providerKeys[provider] = stored.apiKey.trim()
  }

  return {
    ...stored,
    provider,
    baseURL: stored.baseURL || defaults.baseURL,
    model: stored.model || defaults.model,
    apiKey: providerKeys[provider] || import.meta.env.VITE_AI_API_KEY || '',
    endpointMode: stored.endpointMode || 'openai',
    requestMode: 'direct',
    temperature: stored.temperature ?? 0.2,
    maxTokens: stored.maxTokens ?? 4096,
    thinkingEnabled: stored.thinkingEnabled ?? false,
    providerKeys,
  }
}

export function useAiModelConfig() {
  const config = ref<AiModelConfig>(buildDefaultConfig())
  const configDialogVisible = ref(false)

  const hasApiKey = computed(() => !!config.value.apiKey.trim())

  function saveConfig(next: AiModelConfig) {
    const providerKeys = { ...(next.providerKeys || config.value.providerKeys || {}) }
    if (next.apiKey.trim()) {
      providerKeys[next.provider] = next.apiKey.trim()
    }
    const normalized: AiModelConfig = {
      ...next,
      requestMode: 'direct',
      providerKeys,
      apiKey: next.apiKey.trim() || providerKeys[next.provider] || '',
    }
    config.value = normalized
    saveAiConfig(normalized)
  }

  function clearConfig() {
    clearAiConfig()
    config.value = {
      ...config.value,
      apiKey: '',
      providerKeys: {},
      requestMode: 'direct',
    }
  }

  function applyProviderDefaults(provider: AiModelConfig['provider']) {
    config.value = switchProviderConfig(config.value, provider)
  }

  return {
    config,
    configDialogVisible,
    hasApiKey,
    saveConfig,
    clearConfig,
    applyProviderDefaults,
  }
}
