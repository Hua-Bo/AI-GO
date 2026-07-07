<script setup lang="ts">
import type { AiProvider, ProviderConfig } from '@/types/aiTypes'
import { getDefaultProviderConfig } from '@/api/aiApi'

const model = defineModel<ProviderConfig>({ required: true })

defineProps<{
  compact?: boolean
}>()

const providers: Array<{ value: AiProvider; label: string }> = [
  { value: 'mock', label: 'Mock' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'qwen', label: '通义千问' },
  { value: 'zhipu', label: '智谱' },
  { value: 'deepseek', label: 'DeepSeek' },
]

function onProviderChange(provider: AiProvider) {
  model.value = getDefaultProviderConfig(provider)
}
</script>

<template>
  <div class="provider-selector" :class="{ compact }">
    <span v-if="compact" class="label">模型</span>
    <el-select
      :model-value="model.provider"
      size="small"
      :style="{ width: compact ? '100px' : '120px' }"
      @change="onProviderChange"
    >
      <el-option
        v-for="p in providers"
        :key="p.value"
        :label="p.label"
        :value="p.value"
      />
    </el-select>
    <el-input
      v-model="model.modelName"
      size="small"
      placeholder="模型名"
      :class="compact ? 'model-compact' : 'model-input'"
    />
    <el-input
      v-if="model.provider !== 'mock'"
      v-model="model.apiKey"
      size="small"
      type="password"
      show-password
      placeholder="API Key"
      class="key-input"
    />
    <el-input
      v-if="model.provider !== 'mock' && !compact"
      v-model="model.baseURL"
      size="small"
      placeholder="Base URL"
      class="url-input"
    />
  </div>
</template>

<style scoped>
.provider-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.provider-selector.compact {
  flex-wrap: nowrap;
}

.label {
  font-size: 12px;
  color: var(--agent-text-secondary);
  white-space: nowrap;
}

.model-input {
  width: 140px;
}

.model-compact {
  width: 110px;
}

.key-input {
  width: 140px;
}

.url-input {
  flex: 1;
  min-width: 160px;
}
</style>
