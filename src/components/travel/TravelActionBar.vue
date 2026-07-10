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
  <div class="sidebar-action-panel no-print action-panel">
    <el-button
      class="action-primary"
      type="primary"
      :loading="isGenerating"
      :disabled="isGenerating"
      @click="hasApiKey ? emit('plan') : emit('openConfig')"
    >
      {{ isGenerating ? '正在生成...' : (hasApiKey ? 'AI 规划路线' : '配置 API Key 后生成') }}
    </el-button>
    <div class="action-secondary-row">
      <el-button size="small" @click="emit('reset')">重置</el-button>
      <el-button v-if="hasParseError" size="small" @click="emit('retryCurrent')">重生成</el-button>
      <el-button v-if="isGenerating" size="small" type="danger" @click="emit('stop')">停止</el-button>
    </div>

    <div v-if="guideReady" class="action-export-title">导出攻略</div>
    <div class="action-export-grid">
      <el-button size="small" :disabled="!guideReady" :loading="exportingWord" @click="emit('exportWord')">Word</el-button>
      <el-button size="small" :disabled="!guideReady" :loading="exportingPdf" @click="emit('downloadPdf')">PDF</el-button>
      <el-button size="small" :disabled="!guideReady" @click="emit('printGuide')">打印</el-button>
      <el-button size="small" :disabled="!guideReady" :loading="exportingImage" @click="emit('exportImage')">长图</el-button>
      <el-button size="small" :disabled="!guideReady" :loading="exportingImagePlain" @click="emit('exportImagePlain')">无图长图</el-button>
    </div>
    <div class="action-status">
      <div>{{ hasApiKey ? `当前模型：${modelName || '已配置'}` : '当前模型：未配置' }}</div>
      <div>{{ hasApiKey ? 'Key 状态：已配置本地 Key' : 'Key 状态：未配置 API Key' }}</div>
      <div>部署模式：GitHub Pages 浏览器直连</div>
    </div>
  </div>
</template>

<style scoped>
.sidebar-action-panel {
  width: 100%;
}
.action-panel {
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
}
.action-primary {
  width: 100%;
  height: 44px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 900;
}
.action-secondary-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 8px;
}
.action-secondary-row :deep(.el-button) {
  margin-left: 0;
  width: 100%;
  height: 36px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
}
.action-export-title {
  margin: 12px 0 8px;
  font-size: 12px;
  font-weight: 800;
  color: #64748b;
}
.action-export-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 8px;
}
.action-export-grid :deep(.el-button) {
  min-width: 0;
  margin-left: 0;
  width: 100%;
  height: 36px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
}
.action-export-grid :deep(.el-button > span) {
  min-width: 0;
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.action-status {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  font-size: 12px;
  color: #64748b;
  text-align: left;
  line-height: 1.55;
}
.action-status div + div {
  margin-top: 2px;
}
.sidebar-action-panel :deep(.el-button--primary) {
  border: none;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #06b6d4);
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.22);
}
@media (max-width: 640px) {
  .action-secondary-row,
  .action-export-grid {
    grid-template-columns: 1fr;
  }
}
</style>
