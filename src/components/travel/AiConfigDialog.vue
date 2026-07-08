<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { AiModelConfig } from '@/types/travelTypes'
import { AI_PROVIDER_DEFAULTS } from '@/composables/travel/useAiModelConfig'
import { AiRequestError, testAiConnection } from '@/services/travelAiChat'

const visible = defineModel<boolean>('visible', { required: true })
const config = defineModel<AiModelConfig>('config', { required: true })

const emit = defineEmits<{
  save: [config: AiModelConfig]
  clear: []
}>()

const providers = Object.entries(AI_PROVIDER_DEFAULTS).map(([value, meta]) => ({
  value: value as AiModelConfig['provider'],
  label: meta.label,
}))

function onProviderChange(provider: AiModelConfig['provider']) {
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

function onEndpointModeChange(mode: 'openai' | 'anthropic') {
  config.value.endpointMode = mode
  if (config.value.provider === 'longcat') {
    config.value.baseURL = mode === 'anthropic'
      ? 'https://api.longcat.chat/anthropic/v1'
      : 'https://api.longcat.chat/openai/v1'
    if (!config.value.model) config.value.model = 'LongCat-2.0'
  }
}

const testing = ref(false)
async function handleTestConnection() {
  if (!config.value.apiKey.trim()) {
    ElMessage.warning('请先填写你自己的 API Key')
    return
  }
  testing.value = true
  try {
    await testAiConnection({ ...config.value, requestMode: 'direct' })
    ElMessage.success('连接成功')
  } catch (e) {
    if (e instanceof AiRequestError) {
      if (e.type === 'missing_key') ElMessage.error('请先填写你自己的 API Key')
      else if (e.type === 'auth') ElMessage.error('API Key 无效或没有权限，请检查你填写的 Key。')
      else if (e.type === 'cors' || e.type === 'network') ElMessage.error(e.message)
      else if (e.type === 'json_parse') ElMessage.error('接口有响应，但不是 JSON。请检查模型输出格式。')
      else ElMessage.error(e.message || '连接失败，请检查 Base URL、API Key 和模型名')
      return
    }
    ElMessage.error('连接失败，请检查 Base URL、API Key 和模型名')
  } finally {
    testing.value = false
  }
}

function clearKey() {
  config.value.apiKey = ''
  emit('clear')
  ElMessage.success('已清空 API Key')
}

function handleSave() {
  if (!config.value.apiKey.trim()) {
    ElMessage.warning('请先填写你自己的 API Key')
    return
  }
  emit('save', { ...config.value, requestMode: 'direct' })
  visible.value = false
}
</script>

<template>
  <el-dialog v-model="visible" title="AI 模型配置" width="560px" destroy-on-close>
    <el-alert
      type="info"
      :closable="false"
      show-icon
      class="deploy-alert"
      title="GitHub Pages 静态部署 / 浏览器直连"
      description="当前为 GitHub Pages 静态部署版：不内置任何 API Key，使用时请填写你自己的 Key。Key 只保存在当前浏览器 localStorage 中，不要在公共电脑保存。如果模型服务不支持浏览器跨域 CORS，请使用云服务器代理部署（见 DEPLOY.md）。"
    />
    <el-form label-position="top">
      <el-form-item label="模型提供商">
        <el-select :model-value="config.provider" style="width: 100%" @change="onProviderChange">
          <el-option v-for="p in providers" :key="p.value" :label="p.label" :value="p.value" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="config.provider === 'longcat'" label="接口模式">
        <el-radio-group :model-value="config.endpointMode || 'openai'" @change="onEndpointModeChange">
          <el-radio-button value="openai">OpenAI 兼容</el-radio-button>
          <el-radio-button value="anthropic">Anthropic 兼容</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="Base URL">
        <el-input v-model="config.baseURL" placeholder="https://api.longcat.chat/openai/v1" />
      </el-form-item>
      <el-form-item label="Model">
        <el-input v-model="config.model" placeholder="LongCat-2.0" />
      </el-form-item>
      <el-form-item label="API Key">
        <el-input
          v-model="config.apiKey"
          type="password"
          show-password
          placeholder="请填写你自己的 API Key"
        />
        <p class="hint">Key 只保存在当前浏览器 localStorage，浏览器直连模型时会出现在请求头中</p>
      </el-form-item>
      <el-form-item label="Temperature">
        <el-input-number v-model="config.temperature" :min="0" :max="1" :step="0.1" />
      </el-form-item>
      <el-form-item label="Max Tokens">
        <el-input-number v-model="config.maxTokens" :min="256" :max="32768" :step="256" />
      </el-form-item>
      <el-form-item v-if="config.provider === 'longcat'" label="LongCat Thinking">
        <el-switch v-model="config.thinkingEnabled" />
      </el-form-item>
      <p v-if="config.provider === 'longcat'" class="hint">
        LongCat 支持 OpenAI / Anthropic 兼容接口，本页面默认使用 OpenAI 格式调用。
      </p>
    </el-form>
    <template #footer>
      <el-button :loading="testing" @click="handleTestConnection">测试连接</el-button>
      <el-button @click="clearKey">清空 Key</el-button>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSave">保存配置</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.deploy-alert { margin-bottom: 16px; }
.hint { margin: 6px 0 0; font-size: 12px; color: var(--travel-text-secondary); }
</style>
