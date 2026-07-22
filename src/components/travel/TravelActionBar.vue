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
  exportingAmap?: boolean
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
  exportAmap: []
  openAmapNav: []
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
      <el-button size="small" type="success" :disabled="!guideReady" :loading="exportingAmap" @click="emit('exportAmap')">导出高德文件</el-button>
      <el-button size="small" type="success" plain :disabled="!guideReady" @click="emit('openAmapNav')">按天高德导航</el-button>
    </div>

    <div v-if="guideReady" class="amap-help">
      <div class="amap-help-title">高德怎么用？</div>
      <ol class="amap-help-list">
        <li>
          <strong>导出高德文件</strong>：下载 CSV / KML / GPX。
        </li>
        <li>
          电脑打开
          <a href="https://wia.amap.com" target="_blank" rel="noopener noreferrer">wia.amap.com</a>
          ，登录高德账号。
        </li>
        <li>
          创建或打开一张地图 → 点<strong>批量导入</strong> → 上传刚下载的 <strong>CSV</strong>（推荐）或 <strong>KML</strong>。
        </li>
        <li>
          手机打开高德 App → <strong>地图小程序</strong> → 找到刚导入的地图即可查看路线。
        </li>
        <li>
          <strong>按天高德导航</strong>：选某一天，直接调起高德驾车导航（适合当天开跑）。
        </li>
      </ol>
      <p class="amap-help-note">
        说明：高德 App 不能直接打开随便一个文件；需要先用电脑端「地图小程序」导入。KML 导入时数据来源选谷歌/WGS84。
      </p>
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

.amap-help {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.amap-help-title {
  font-size: 12px;
  font-weight: 800;
  margin-bottom: 6px;
}

.amap-help-list {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.55;
}

.amap-help-list li + li {
  margin-top: 4px;
}

.amap-help-list a {
  color: #15803d;
  font-weight: 700;
  text-decoration: underline;
}

.amap-help-note {
  margin: 8px 0 0;
  font-size: 11px;
  line-height: 1.5;
  color: #3f6212;
  opacity: 0.9;
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
