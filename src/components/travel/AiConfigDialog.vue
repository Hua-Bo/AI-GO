<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { AiModelConfig } from '@/types/travelTypes'
import { AI_PROVIDER_DEFAULTS } from '@/composables/travel/useAiModelConfig'
import { AiRequestError, testAiConnection } from '@/services/travelAiChat'
import { useResponsive } from '@/composables/useResponsive'
import { switchProviderConfig } from '@/utils/travelAiConfigStorage'

const visible = defineModel<boolean>('visible', { required: true })
const config = defineModel<AiModelConfig>('config', { required: true })

const emit = defineEmits<{
  save: [config: AiModelConfig]
  clear: []
}>()

const { isMobile } = useResponsive()

const providers = Object.entries(AI_PROVIDER_DEFAULTS).map(([value, meta]) => ({
  value: value as AiModelConfig['provider'],
  label: meta.label,
}))

const showAdvanced = ref(false)
const testing = ref(false)

function onProviderChange(provider: AiModelConfig['provider']) {
  // 切换提供商时：保存当前 key，加载该提供商已保存的 key（没有则为空）
  config.value = switchProviderConfig(config.value, provider)
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
  ElMessage.success('配置已保存')
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="AI 模型配置"
    class="model-config-dialog"
    :class="{ 'is-mobile-drawer': isMobile }"
    :width="isMobile ? '100%' : '520px'"
    align-center
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
  >
    <p class="short-hint">Key 仅保存在当前浏览器，不会上传到服务器。</p>

    <div class="model-config-body">
      <el-form label-position="top" class="compact-form">
        <el-form-item label="模型提供商">
          <el-select :model-value="config.provider" style="width: 100%" @change="onProviderChange">
            <el-option v-for="p in providers" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
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
            :placeholder="`请填写 ${AI_PROVIDER_DEFAULTS[config.provider]?.label || ''} 的 API Key`"
          />
          <p class="key-hint">各模型密钥分开保存；切换提供商不会沿用上一个模型的 Key。</p>
        </el-form-item>

        <button type="button" class="advanced-toggle" @click="showAdvanced = !showAdvanced">
          高级设置 {{ showAdvanced ? '↑' : '↓' }}
        </button>

        <div v-if="showAdvanced" class="advanced-block">
          <el-form-item v-if="config.provider === 'longcat'" label="接口模式">
            <el-radio-group :model-value="config.endpointMode || 'openai'" @change="onEndpointModeChange">
              <el-radio-button value="openai">OpenAI 兼容</el-radio-button>
              <el-radio-button value="anthropic">Anthropic 兼容</el-radio-button>
            </el-radio-group>
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
          <div class="advanced-actions">
            <el-button :loading="testing" @click="handleTestConnection">测试连接</el-button>
            <el-button @click="clearKey">清空配置</el-button>
          </div>
        </div>
      </el-form>
    </div>

    <template #footer>
      <div class="model-config-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存配置</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.short-hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
}

.key-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.4;
}

.model-config-body {
  max-height: min(420px, calc(100vh - 220px));
  overflow-y: auto;
  padding-right: 2px;
}

.compact-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.compact-form :deep(.el-form-item__label) {
  margin-bottom: 4px !important;
  font-weight: 700;
}

.advanced-toggle {
  display: block;
  width: 100%;
  margin: 4px 0 10px;
  padding: 8px 0;
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 14px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.advanced-block {
  padding: 10px 12px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.advanced-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.model-config-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  width: 100%;
}
</style>

<style>
.model-config-dialog.el-dialog {
  width: min(520px, calc(100vw - 48px)) !important;
  max-width: calc(100vw - 48px);
  max-height: min(720px, calc(100vh - 80px));
  border-radius: 20px;
  overflow: hidden;
  margin: 0 auto !important;
  display: flex;
  flex-direction: column;
}

.model-config-dialog .el-dialog__header {
  padding: 16px 20px 8px;
  flex-shrink: 0;
}

.model-config-dialog .el-dialog__body {
  padding: 4px 20px 8px;
  overflow: hidden;
}

.model-config-dialog .el-dialog__footer {
  flex-shrink: 0;
  padding: 12px 20px 16px;
  background: #fff;
  border-top: 1px solid #edf0f5;
}

/* 手机端：底部抽屉 */
@media (max-width: 768px) {
  .model-config-dialog.el-dialog,
  .model-config-dialog.is-mobile-drawer.el-dialog {
    width: 100% !important;
    max-width: 100% !important;
    max-height: 75vh !important;
    margin: 0 !important;
    position: fixed !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    top: auto !important;
    transform: none !important;
    border-radius: 20px 20px 0 0;
  }

  .model-config-dialog .el-dialog__body .model-config-body,
  .model-config-dialog .model-config-body {
    max-height: calc(75vh - 140px);
  }

  .model-config-dialog .el-dialog__footer {
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
  }
}

/* 覆盖 Element Plus 默认 margin-top，保证 PC 居中 */
.el-overlay-dialog:has(.model-config-dialog) {
  display: flex !important;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .el-overlay-dialog:has(.model-config-dialog) {
    align-items: flex-end;
  }
}
</style>
