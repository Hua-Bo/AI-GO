<script setup lang="ts">
defineProps<{
  statusTitle: string
  statusDesc?: string
  isGenerating: boolean
  canGenerate: boolean
  hasApiKey: boolean
  providerLabel?: string
  modelName?: string
  guideReady: boolean
  hasParseError: boolean
  failedDay: number | null
  pdfAvailable: boolean
  exportingWord: boolean
  exportingPdf: boolean
  exportingImage: boolean
  exportingImagePlain: boolean
}>()

const emit = defineEmits<{
  reset: []
  plan: []
  stop: []
  retryCurrent: []
  retryFromStart: []
  retryDay: [day: number]
  exportWord: []
  downloadPdf: []
  printGuide: []
  exportImage: []
  exportImagePlain: []
  openConfig: []
}>()
</script>

<template>
  <div class="sidebar-action-panel no-print">
    <el-button
      class="action-primary"
      type="primary"
      :loading="isGenerating"
      :disabled="isGenerating"
      @click="hasApiKey ? emit('plan') : emit('openConfig')"
    >
      {{ isGenerating ? '正在生成...' : (hasApiKey ? 'AI 规划路线' : '配置 API Key 后生成') }}
    </el-button>
    <div class="runtime-row">
      <el-button size="small" @click="emit('reset')">重置</el-button>
      <el-button size="small" @click="emit('openConfig')">AI 配置</el-button>
      <el-button v-if="hasParseError" size="small" @click="emit('retryCurrent')">重生成</el-button>
      <el-button v-if="isGenerating" size="small" type="danger" @click="emit('stop')">停止</el-button>
    </div>
    <div class="action-grid">
      <el-button size="small" :disabled="!guideReady" :loading="exportingWord" @click="emit('exportWord')">Word</el-button>
      <el-button size="small" :disabled="!guideReady" :loading="exportingPdf" @click="emit('downloadPdf')">PDF</el-button>
      <el-button size="small" :disabled="!guideReady" @click="emit('printGuide')">打印</el-button>
      <el-button size="small" :disabled="!guideReady" :loading="exportingImage" @click="emit('exportImage')">长图</el-button>
      <el-button size="small" :disabled="!guideReady" :loading="exportingImagePlain" @click="emit('exportImagePlain')">无图长图</el-button>
    </div>
    <div class="action-status">{{ hasApiKey ? '已配置本地 Key' : '未配置 API Key' }}</div>
  </div>
</template>

<style scoped>
.sidebar-action-panel {
  padding: 14px 18px;
  border-top: 1px solid #e5e7eb;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -8px 24px rgba(15, 23, 42, 0.06);
}
.action-primary {
  width: 100%;
  height: 44px;
  border-radius: 14px;
}
.runtime-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.action-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}
.action-status {
  margin-top: 10px;
  font-size: 12px;
  color: #64748b;
  text-align: left;
}
.sidebar-action-panel :deep(.el-button--primary) {
  border: none;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #06b6d4);
  box-shadow: 0 10px 24px rgba(59, 130, 246, 0.25);
}
.action-grid :deep(.el-button) { margin-left: 0; height: 34px; border-radius: 10px; }
</style>
