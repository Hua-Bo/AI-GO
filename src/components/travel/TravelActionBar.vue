<script setup lang="ts">
import { ref } from 'vue'

const fetchScenicImages = defineModel<boolean>('fetchScenicImages', { default: false })
const showAmapHelp = ref(false)

const props = defineProps<{
  statusTitle: string
  statusDesc?: string
  isGenerating: boolean
  canGenerate: boolean
  hasApiKey: boolean
  providerLabel?: string
  modelName?: string
  guideReady: boolean
  outlineReady?: boolean
  hasParseError: boolean
  failedDay: number | null
  pdfAvailable: boolean
  exportingWord: boolean
  exportingPdf: boolean
  exportingImage: boolean
  exportingImagePlain: boolean
  exportingAmap?: boolean
  hydratingImages?: boolean
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
  hydrateImages: []
}>()

function onExportAmap() {
  if (!props.guideReady || props.exportingAmap) return
  emit('exportAmap')
}

function onOpenAmapNav() {
  if (!props.guideReady) return
  emit('openAmapNav')
}

function onHydrateImages() {
  if (!props.guideReady || props.hydratingImages) return
  emit('hydrateImages')
}
</script>

<template>
  <div class="sidebar-action-panel no-print action-panel">
    <div class="image-choice">
      <div class="image-choice-title">生成时要不要景区图片？</div>
      <div class="image-choice-grid">
        <button
          type="button"
          class="image-choice-btn"
          :class="{ active: !fetchScenicImages }"
          :disabled="isGenerating"
          @click="fetchScenicImages = false"
        >
          <strong>不要图片</strong>
          <span>更快（推荐）</span>
        </button>
        <button
          type="button"
          class="image-choice-btn"
          :class="{ active: fetchScenicImages }"
          :disabled="isGenerating"
          @click="fetchScenicImages = true"
        >
          <strong>要图片</strong>
          <span>更慢但带图</span>
        </button>
      </div>
      <p class="image-choice-tip">
        {{ fetchScenicImages ? '当前：生成细行程时会抓景区图' : '当前：跳过抓图，生成后可点「补全景区图片」' }}
      </p>
    </div>

    <el-button
      class="action-primary"
      type="primary"
      :loading="isGenerating"
      :disabled="isGenerating"
      @click="hasApiKey ? emit('plan') : emit('openConfig')"
    >
      {{ isGenerating ? '正在生成...' : (hasApiKey ? (outlineReady ? '重新生成大纲' : '① 生成行程大纲') : '配置 API Key 后生成') }}
    </el-button>
    <div class="action-secondary-row">
      <el-button size="small" @click="emit('reset')">重置</el-button>
      <el-button v-if="hasParseError" size="small" @click="emit('retryCurrent')">重生成</el-button>
      <el-button v-if="isGenerating" size="small" type="danger" @click="emit('stop')">停止</el-button>
    </div>

    <div v-if="guideReady" class="action-export-title">导出攻略</div>
    <div v-if="guideReady" class="action-export-grid">
      <el-button size="small" :loading="exportingWord" @click="emit('exportWord')">Word</el-button>
      <el-button size="small" :loading="exportingPdf" @click="emit('downloadPdf')">PDF</el-button>
      <el-button size="small" @click="emit('printGuide')">打印</el-button>
      <el-button size="small" :loading="exportingImage" @click="emit('exportImage')">长图</el-button>
      <el-button size="small" :loading="exportingImagePlain" @click="emit('exportImagePlain')">无图长图</el-button>
      <el-button size="small" type="success" :loading="exportingAmap" @click.stop="onExportAmap">导出高德文件</el-button>
      <el-button size="small" type="success" plain @click.stop="onOpenAmapNav">按天高德导航</el-button>
      <el-button size="small" type="warning" plain :loading="hydratingImages" @click.stop="onHydrateImages">补全景区图片</el-button>
    </div>

    <div v-if="guideReady" class="amap-help">
      <button type="button" class="amap-help-toggle" @click="showAmapHelp = !showAmapHelp">
        {{ showAmapHelp ? '收起高德用法说明' : '查看高德用法说明' }}
      </button>
      <template v-if="showAmapHelp">
        <ol class="amap-help-list">
          <li><strong>导出高德文件</strong>：下载 CSV / KML / GPX。</li>
          <li>
            电脑打开
            <a href="https://wia.amap.com" target="_blank" rel="noopener noreferrer">wia.amap.com</a>
            ，登录高德账号。
          </li>
          <li>创建或打开一张地图 → 点<strong>批量导入</strong> → 上传 <strong>CSV</strong>（推荐）或 <strong>KML</strong>。</li>
          <li>手机打开高德 App → <strong>地图小程序</strong> → 找到刚导入的地图。</li>
          <li><strong>按天高德导航</strong>：选某一天，直接调起高德驾车导航。</li>
        </ol>
        <p class="amap-help-note">
          说明：高德 App 不能直接打开随便一个文件；需先用电脑端「地图小程序」导入。KML 数据来源选谷歌/WGS84。
        </p>
      </template>
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
.image-choice {
  margin-bottom: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: linear-gradient(180deg, #fffbeb, #fff);
  border: 1px solid #fcd34d;
}
.image-choice-title {
  font-size: 13px;
  font-weight: 800;
  color: #b45309;
  margin-bottom: 8px;
}
.image-choice-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.image-choice-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #fff;
  cursor: pointer;
  text-align: left;
}
.image-choice-btn strong {
  font-size: 13px;
  color: #0f172a;
}
.image-choice-btn span {
  font-size: 11px;
  color: #64748b;
}
.image-choice-btn.active {
  border-color: #f59e0b;
  background: #fef3c7;
  box-shadow: 0 6px 14px rgba(245, 158, 11, 0.16);
}
.image-choice-btn.active strong {
  color: #b45309;
}
.image-choice-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.image-choice-tip {
  margin: 8px 0 0;
  font-size: 11px;
  color: #92400e;
  line-height: 1.45;
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
.amap-help {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}
.amap-help-toggle {
  display: block;
  width: 100%;
  border: none;
  background: transparent;
  color: #166534;
  font-size: 12px;
  font-weight: 800;
  text-align: left;
  cursor: pointer;
  padding: 0;
}
.amap-help-list {
  margin: 8px 0 0;
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
  font-size: 11px;
  color: #64748b;
  line-height: 1.55;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.action-status > div {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
