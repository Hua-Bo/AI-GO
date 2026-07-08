<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useTravelPlanner } from '@/composables/travel/useTravelPlanner'
import {
  downloadGuidePdf,
  exportGuideToImage,
  exportGuideToWord,
  isPdfDownloadAvailable,
  printGuide,
} from '@/services/travelExportApi'
import TravelActionBar from '@/components/travel/TravelActionBar.vue'
import AiConfigDialog from '@/components/travel/AiConfigDialog.vue'
import BasicConditionBar from '@/components/travel/BasicConditionBar.vue'
import DestinationIntentPanel from '@/components/travel/DestinationIntentPanel.vue'
import AccommodationPanel from '@/components/travel/AccommodationPanel.vue'
import PreferenceSupplementPanel from '@/components/travel/PreferenceSupplementPanel.vue'
import DepartureConfigPanel from '@/components/travel/DepartureConfigPanel.vue'
import RoutePlanningResult from '@/components/travel/RoutePlanningResult.vue'
import '@/styles/travel-theme.css'
import '@/components/travel/travel-form.css'

const {
  stage, loadingStep, error, errorDetail, isPlanning, isPlanParseError,
  canGenerate, guideReady, failedDay, rawResponse, showRawResponse,
  aiConfig, hasApiKey, configDialogVisible, saveConfig,
  travelDays, customDays, useCustomDays, departurePoints, travelThemes, budgetLevel, pace,
  withChildren, withElderly, avoidCrowded, preferNaturalScenery, preferFood, preferPhotoSpot,
  preferFreeSpots, preferParks, preferCamping, preferLakeside, preferForest, preferCityWalk,
  preferLowCost, avoidTicketsExpensive, preferDriveToSpot, preferRiverside, preferWaterPlay,
  preferWildSpot, preferEasyParking, maxWalkDistance, specialPlaceHint,
  accommodationMode, homeBaseAddress, maxReturnDistanceKm, maxReturnDuration, accommodationNote,
  destinationIntent, planResult,
  planRoute, stopGeneration, retryCurrentStep, retryFromStart, retryFailedDay, regenerateBudget,
  addDeparture, removeDeparture, resetAll,
} = useTravelPlanner()

const exportingWord = ref(false)
const exportingPdf = ref(false)
const exportingImage = ref(false)
const exportingImagePlain = ref(false)
const pdfAvailable = isPdfDownloadAvailable()

const errorTitle = computed(() =>
  isPlanParseError.value ? 'AI 返回格式错误，已停止生成。' : error.value,
)

const actionStatusTitle = computed(() => {
  if (isPlanning.value) return '正在生成攻略'
  if (stage.value === 'planned' && planResult.value) return '攻略已生成'
  if (stage.value === 'error') return '生成未完成'
  if (!hasApiKey.value) return '请先配置 API Key'
  return '等待生成'
})

const actionStatusDesc = computed(() => {
  if (loadingStep.value) return loadingStep.value
  if (stage.value === 'planned' && planResult.value) return planResult.value.title
  if (stage.value === 'error' && errorDetail.value) return errorDetail.value
  if (stage.value === 'input') return '填写出发地和终点后，点击「AI 规划路线」'
  return ''
})

const providerLabelMap: Record<string, string> = {
  deepseek: 'DeepSeek',
  qwen: '通义千问',
  zhipu: '智谱',
  openai: 'OpenAI',
  longcat: 'LongCat',
}
const aiStatusLine = computed(() =>
  hasApiKey.value
    ? `${providerLabelMap[aiConfig.value.provider] || aiConfig.value.provider} · ${aiConfig.value.model}`
    : 'AI 未配置',
)

const quickStats = computed(() => ([
  { label: '出发地数量', value: `${departurePoints.value.length} 个`, emoji: '📍' },
  { label: '游玩天数', value: `${useCustomDays.value ? customDays.value : travelDays.value} 天`, emoji: '🗓️' },
  { label: '目标终点', value: destinationIntent.value.destinationText || '待填写', emoji: '🎯' },
  { label: '当前预算', value: budgetLevel.value === 'low' ? '经济实惠' : budgetLevel.value === 'high' ? '品质轻奢' : '标准舒适', emoji: '💰' },
]))

const localTripDetected = computed(() => {
  const d = departurePoints.value[0]?.address || ''
  const t = destinationIntent.value.destinationText || ''
  const text = `${d} ${t}`
  const localKeywords = ['周边', '附近', '本地', '滨湖', '太湖', '蠡湖', '长广溪', '鼋头渚', '雪浪山', '惠山', '宜兴']
  return departurePoints.value.length === 1 && (localKeywords.some((k) => text.includes(k)) || (d.includes('无锡') && t.includes('无锡')))
})

const debugRequestUrl = computed(() => {
  const base = (aiConfig.value.baseURL || '').replace(/\/+$/, '')
  if (aiConfig.value.requestMode === 'proxy') return aiConfig.value.proxyURL || '/api/ai/chat'
  if (aiConfig.value.endpointMode === 'anthropic') return `${base}/messages`
  return `${base}/chat/completions`
})

const requestModeLabel = 'GitHub Pages · 浏览器直连'
const keyStatusLabel = computed(() => (hasApiKey.value ? '已配置本地 Key' : '未配置 API Key'))
const workspaceRef = ref<HTMLElement | null>(null)
const isStackMode = ref(false)
const sidebarRatio = ref(52)
let dragging = false

function applyPreset(kind: 'wuxi' | 'qingdao' | 'sichuan') {
  if (kind === 'wuxi') {
    destinationIntent.value.destinationText = '无锡周边'
    travelDays.value = 2
    useCustomDays.value = false
    if (departurePoints.value[0]) departurePoints.value[0].address = '无锡'
  }
  if (kind === 'qingdao') {
    destinationIntent.value.destinationText = '青岛'
    travelDays.value = 3
    useCustomDays.value = false
    if (departurePoints.value[0]) departurePoints.value[0].address = '无锡'
  }
  if (kind === 'sichuan') {
    destinationIntent.value.destinationText = '川西'
    useCustomDays.value = true
    customDays.value = 5
    if (departurePoints.value[0]) departurePoints.value[0].address = '成都'
  }
}

function clearError() {
  error.value = ''
  errorDetail.value = ''
  stage.value = hasApiKey.value ? 'input' : 'needApiKey'
}

async function copyDiagnosticInfo() {
  const text = `请求 URL: ${debugRequestUrl.value}
Provider: ${aiConfig.value.provider}
Model: ${aiConfig.value.model}
Request Mode: ${aiConfig.value.requestMode || 'direct'}
错误原文: ${rawResponse.value || errorDetail.value || error.value}`
  await navigator.clipboard.writeText(text)
}

function onSaveAiConfig(cfg: typeof aiConfig.value) {
  saveConfig(cfg)
  if (stage.value === 'needApiKey' && cfg.apiKey.trim()) {
    stage.value = 'input'
    error.value = ''
  }
}

function onClearAiConfig() {
  aiConfig.value.apiKey = ''
  saveConfig({ ...aiConfig.value, apiKey: '', requestMode: 'direct' })
  if (stage.value !== 'planning') stage.value = 'needApiKey'
}

async function handleExportWord() {
  if (!planResult.value) return
  exportingWord.value = true
  try {
    await exportGuideToWord(planResult.value)
  } finally {
    exportingWord.value = false
  }
}

async function handleDownloadPdf() {
  exportingPdf.value = true
  try {
    await downloadGuidePdf()
  } finally {
    exportingPdf.value = false
  }
}

function handlePrintGuide() {
  printGuide()
}

async function handleExportImage() {
  if (!planResult.value) return
  exportingImage.value = true
  try {
    await exportGuideToImage(planResult.value)
  } finally {
    exportingImage.value = false
  }
}

async function handleExportImagePlain() {
  if (!planResult.value) return
  exportingImagePlain.value = true
  try {
    await exportGuideToImage(planResult.value, { skipExternalImages: true })
  } finally {
    exportingImagePlain.value = false
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function refreshStackMode() {
  isStackMode.value = window.innerWidth <= 900
}

function updateRatioByClientY(clientY: number) {
  if (!workspaceRef.value || !isStackMode.value) return
  const rect = workspaceRef.value.getBoundingClientRect()
  const ratio = ((clientY - rect.top) / rect.height) * 100
  sidebarRatio.value = clamp(ratio, 35, 75)
}

function onMouseMove(e: MouseEvent) {
  if (!dragging) return
  updateRatioByClientY(e.clientY)
}

function onTouchMove(e: TouchEvent) {
  if (!dragging || !e.touches.length) return
  updateRatioByClientY(e.touches[0].clientY)
}

function stopDrag() {
  dragging = false
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', stopDrag)
}

function startDragMouse(e: MouseEvent) {
  if (!isStackMode.value) return
  e.preventDefault()
  dragging = true
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', stopDrag)
}

function startDragTouch(e: TouchEvent) {
  if (!isStackMode.value || !e.touches.length) return
  dragging = true
  updateRatioByClientY(e.touches[0].clientY)
  document.addEventListener('touchmove', onTouchMove)
  document.addEventListener('touchend', stopDrag)
}

const workspaceStyle = computed(() =>
  isStackMode.value
    ? ({ '--sidebar-ratio': `${sidebarRatio.value}%` } as Record<string, string>)
    : {},
)

onMounted(() => {
  refreshStackMode()
  window.addEventListener('resize', refreshStackMode)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', refreshStackMode)
  stopDrag()
})
</script>

<template>
  <el-config-provider :locale="zhCn">
    <div class="travel-planner-page">
      <div class="travel-shell travel-app-shell">
        <header class="travel-topbar travel-header no-print">
          <div class="topbar-left">
            <h1 class="topbar-title">AI 旅游攻略</h1>
            <p class="topbar-subtitle">让 AI 帮你规划路线、预算和图文攻略</p>
          </div>
          <div class="topbar-center">
            <span class="model-pill">{{ hasApiKey ? `${providerLabelMap[aiConfig.provider] || aiConfig.provider}-${aiConfig.model}` : '未配置模型' }}</span>
            <span class="model-pill">{{ keyStatusLabel }}</span>
            <span class="model-pill">{{ requestModeLabel }}</span>
          </div>
          <div class="topbar-actions">
            <el-button @click="configDialogVisible = true">AI 配置</el-button>
            <el-button @click="resetAll()">重置</el-button>
          </div>
        </header>

        <div ref="workspaceRef" class="travel-workspace" :style="workspaceStyle">
          <aside class="travel-sidebar travel-config-panel no-print">
            <div class="travel-sidebar-scroll">
              <el-alert v-if="stage === 'needApiKey'" type="warning" show-icon :closable="false" title="请先填写你自己的 API Key" description="当前为 GitHub Pages 静态部署版，不内置任何 Key。点击「AI 配置」填写你自己的 Key 后保存。" class="key-alert" />
              <section class="config-card">
                <div class="config-card-title">🗓️ 基础条件</div>
                <BasicConditionBar
                  v-model:travel-days="travelDays"
                  v-model:custom-days="customDays"
                  v-model:use-custom-days="useCustomDays"
                  v-model:travel-themes="travelThemes"
                  v-model:budget-level="budgetLevel"
                  v-model:pace="pace"
                  v-model:with-children="withChildren"
                  v-model:with-elderly="withElderly"
                  v-model:avoid-crowded="avoidCrowded"
                  v-model:prefer-natural-scenery="preferNaturalScenery"
                  v-model:prefer-food="preferFood"
                  v-model:prefer-photo-spot="preferPhotoSpot"
                  v-model:prefer-free-spots="preferFreeSpots"
                  v-model:prefer-parks="preferParks"
                  v-model:prefer-camping="preferCamping"
                  v-model:prefer-lakeside="preferLakeside"
                  v-model:prefer-forest="preferForest"
                  v-model:prefer-city-walk="preferCityWalk"
                  v-model:prefer-low-cost="preferLowCost"
                  v-model:avoid-tickets-expensive="avoidTicketsExpensive"
                  v-model:prefer-drive-to-spot="preferDriveToSpot"
                  v-model:prefer-riverside="preferRiverside"
                  v-model:prefer-water-play="preferWaterPlay"
                  v-model:prefer-wild-spot="preferWildSpot"
                  v-model:prefer-easy-parking="preferEasyParking"
                  v-model:max-walk-distance="maxWalkDistance"
                />
              </section>
              <DestinationIntentPanel v-model:destination="destinationIntent" />
              <DepartureConfigPanel v-model:departure-points="departurePoints" @add-departure="addDeparture()" @remove-departure="removeDeparture" />
              <AccommodationPanel
                v-model:accommodation-mode="accommodationMode"
                v-model:home-base-address="homeBaseAddress"
                v-model:max-return-distance-km="maxReturnDistanceKm"
                v-model:max-return-duration="maxReturnDuration"
                v-model:accommodation-note="accommodationNote"
                :local-trip-detected="localTripDetected"
              />
              <PreferenceSupplementPanel v-model:special-place-hint="specialPlaceHint" />
              <section class="form-card ai-model-card">
                <div class="form-card-header">
                  <span class="form-card-icon">🤖</span>
                  <div>
                    <div class="form-card-title">AI 模型</div>
                    <div class="form-card-desc">{{ aiStatusLine }} · {{ requestModeLabel }}</div>
                  </div>
                </div>
                <p class="gh-pages-hint">当前为 GitHub Pages 静态部署版：不内置任何 API Key，使用时请填写你自己的 Key。</p>
                <el-button size="small" @click="configDialogVisible = true">修改 AI 配置</el-button>
              </section>
            </div>
            <div class="travel-sidebar-actions trip-action-area">
              <TravelActionBar
                :status-title="actionStatusTitle"
                :status-desc="actionStatusDesc"
                :is-generating="isPlanning"
                :has-api-key="hasApiKey"
                :model-name="aiConfig.model"
                :can-generate="canGenerate"
                :guide-ready="guideReady"
                :has-parse-error="isPlanParseError"
                :failed-day="failedDay"
                :exporting-word="exportingWord"
                :exporting-pdf="exportingPdf"
                :exporting-image="exportingImage"
                :pdf-available="pdfAvailable"
                :exporting-image-plain="exportingImagePlain"
                @reset="resetAll()"
                @open-config="configDialogVisible = true"
                @plan="planRoute()"
                @stop="stopGeneration()"
                @retry-current="retryCurrentStep()"
                @retry-from-start="retryFromStart()"
                @retry-day="retryFailedDay($event)"
                @export-word="handleExportWord()"
                @download-pdf="handleDownloadPdf()"
                @print-guide="handlePrintGuide()"
                @export-image="handleExportImage()"
                @export-image-plain="handleExportImagePlain()"
              />
            </div>
          </aside>
          <div
            class="travel-splitter no-print"
            @mousedown="startDragMouse"
            @touchstart.prevent="startDragTouch"
          >
            <span class="travel-splitter-handle">⬆⬇ 上下拖动分隔 ⬆⬇</span>
          </div>
          <main class="travel-guide-main travel-canvas">
            <div class="travel-guide-scroll">
              <div class="travel-guide-inner travel-canvas-inner">
            <div v-if="stage === 'error' && error" class="error-card no-print">
              <h3>生成失败</h3>
              <p>{{ errorTitle }}</p>
              <p v-if="errorDetail">{{ errorDetail }}</p>
              <div class="error-actions">
                <el-button size="small" type="primary" @click="retryCurrentStep()">重新生成当前步骤</el-button>
                <el-button size="small" @click="retryFromStart()">从头生成</el-button>
                <el-button size="small" @click="configDialogVisible = true">打开 AI 配置</el-button>
                <el-button size="small" link @click="showRawResponse = !showRawResponse">
                  {{ showRawResponse ? '收起调试信息' : '查看调试信息' }}
                </el-button>
                <el-button size="small" link @click="copyDiagnosticInfo()">复制诊断信息</el-button>
              </div>
              <el-collapse v-if="showRawResponse" class="raw-collapse no-print">
                <el-collapse-item title="调试信息" name="raw">
                  <pre class="raw-pre">请求 URL: {{ debugRequestUrl }}
Provider: {{ aiConfig.provider }}
Model: {{ aiConfig.model }}
Request Mode: {{ aiConfig.requestMode || 'direct' }}
错误原文: {{ rawResponse || errorDetail || error }}</pre>
                </el-collapse-item>
              </el-collapse>
            </div>
            <div v-if="stage === 'input' || stage === 'needApiKey'" class="empty-tip empty-guide-card empty-trip-state no-print">
              <div class="empty-trip-card">
                <div class="icon">🧭</div>
                <h3>准备好规划你的旅行了吗？</h3>
                <p>填写左侧信息，AI 会帮你生成一份完整图文攻略：路线规划、每日行程、景区图文、费用预算、住宿策略，并支持导出 Word / PDF / 长图。</p>
                <div class="inspiration-routes">
                  <div class="inspiration-route-card" @click="applyPreset('wuxi')">
                    <strong>无锡周边玩水 2 日</strong>
                    <p>周末轻松游，公园+河边+亲子友好</p>
                  </div>
                  <div class="inspiration-route-card" @click="applyPreset('qingdao')">
                    <strong>青岛海边摄影 3 日</strong>
                    <p>海岸线漫游，拍照打卡与美食并行</p>
                  </div>
                  <div class="inspiration-route-card" @click="applyPreset('sichuan')">
                    <strong>川西自驾 5 日</strong>
                    <p>高颜值公路与山川草甸沉浸体验</p>
                  </div>
                </div>
              </div>
            </div>

            <RoutePlanningResult
              v-if="planResult || stage === 'planned'"
              :guide="planResult"
              @regenerate-budget="regenerateBudget()"
            />
              </div>
            </div>
          </main>
        </div>

        <AiConfigDialog
          v-model:visible="configDialogVisible"
          v-model:config="aiConfig"
          @save="onSaveAiConfig"
          @clear="onClearAiConfig"
        />
      </div>
    </div>
  </el-config-provider>
</template>

<style scoped>
.travel-planner-page {
  height: 100vh;
  overflow: hidden;
  color: #172033;
  background:
    radial-gradient(circle at 12% 8%, rgba(56, 189, 248, 0.16), transparent 28%),
    radial-gradient(circle at 88% 10%, rgba(34, 197, 94, 0.14), transparent 26%),
    linear-gradient(180deg, #f7fbff 0%, #f4f7fb 48%, #eef4f7 100%);
}
.travel-shell {
  height: 100vh;
  display: grid;
  grid-template-rows: 64px 1fr;
  overflow: hidden;
}
.travel-topbar {
  height: 64px;
  margin: 0;
  padding: 0 26px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.86);
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  backdrop-filter: blur(16px);
  z-index: 10;
}
.topbar-title { margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.03em; }
.topbar-subtitle { margin: 4px 0 0; font-size: 12px; color: #64748b; }
.topbar-center { display: flex; gap: 8px; flex-wrap: wrap; }
.model-pill {
  height: 32px;
  display: inline-flex;
  align-items: center;
  padding: 0 14px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ecfeff, #eff6ff);
  border: 1px solid #bfdbfe;
  color: #0369a1;
  font-weight: 800;
  font-size: 12px;
}
.topbar-actions { display: flex; gap: 8px; }
.travel-workspace {
  height: calc(100vh - 64px);
  min-height: 0;
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  overflow: hidden;
}
.travel-sidebar {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255,255,255,0.82);
  backdrop-filter: blur(16px);
  overflow: hidden;
}
.travel-sidebar-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px;
  box-sizing: border-box;
}
.travel-sidebar-actions {
  flex-shrink: 0;
  padding: 12px 14px 14px;
  box-sizing: border-box;
  border-top: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -10px 28px rgba(15, 23, 42, 0.06);
}
.travel-guide-main {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
.travel-splitter {
  display: none;
}
.travel-guide-scroll {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  scroll-behavior: smooth;
  padding: 24px 32px;
  box-sizing: border-box;
  background: radial-gradient(circle at 90% 0%, rgba(56,189,248,0.10), transparent 28%), #f8fafc;
}
.travel-guide-inner {
  width: min(900px, 100%);
  margin: 0 auto;
}
.config-card {
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 12px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(255,255,255,0.88);
  border: 1px solid rgba(226,232,240,0.9);
  box-shadow: 0 12px 30px rgba(15,23,42,0.045);
}
.config-card-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 900; color: #172033; }
.config-card-desc { margin: 4px 0 12px; font-size: 12px; color: #64748b; }
.form-card,
.trip-config-card {
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 12px;
  padding: 14px;
  border-radius: 18px;
}
.ai-model-card { margin-bottom: 14px; }
.gh-pages-hint {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: #64748b;
}
.key-alert, .raw-collapse { margin-bottom: 12px; }
.error-card { padding: 24px; border-radius: 24px; background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; }
.error-card h3 { margin: 0 0 8px; color: #9a3412; }
.error-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.raw-pre {
  max-height: 320px; overflow: auto; font-size: 12px; line-height: 1.5;
  white-space: pre-wrap; word-break: break-all; background: #f8fafc; padding: 12px; border-radius: 8px;
}
.empty-tip {
  text-align: center;
  color: #64748b;
  margin-bottom: 16px;
}
.empty-guide-card {
  min-height: 520px;
  display: grid;
  place-items: center;
  padding: 40px;
  border-radius: 32px;
  background: radial-gradient(circle at 80% 10%, rgba(59,130,246,0.12), transparent 28%), rgba(255,255,255,0.9);
  border: 1px solid #e5e7eb;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
}
.empty-tip .icon { font-size: 40px; margin-bottom: 12px; }
.empty-tip h3 { margin: 0 0 8px; font-size: 22px; color: var(--travel-text); }
.example-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 14px; }
.empty-trip-state { min-height: calc(100vh - 140px); display: flex; align-items: center; justify-content: center; }
.empty-trip-card {
  width: min(820px, 100%);
  padding: 44px;
  border-radius: 36px;
  background: linear-gradient(135deg, rgba(255,255,255,0.94), rgba(240,249,255,0.88)), radial-gradient(circle at 84% 10%, rgba(59,130,246,0.16), transparent 30%);
  border: 1px solid rgba(226,232,240,0.95);
  box-shadow: 0 28px 80px rgba(15,23,42,0.09);
  text-align: center;
}
.inspiration-routes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 28px; }
.inspiration-route-card {
  padding: 18px;
  border-radius: 22px;
  background: #fff;
  border: 1px solid #e2e8f0;
  text-align: left;
  cursor: pointer;
  transition: all .18s ease;
}
.inspiration-route-card strong { display: block; color: #0f172a; }
.inspiration-route-card p { margin: 8px 0 0; font-size: 12px; color: #64748b; line-height: 1.5; }
.inspiration-route-card:hover { transform: translateY(-3px); box-shadow: 0 18px 40px rgba(37,99,235,0.14); }
@media (max-width: 1280px) {
  .travel-topbar { padding: 0 20px; }
  .travel-guide-scroll { padding: 22px 24px; }
  .inspiration-routes { grid-template-columns: 1fr; }
}
@media (min-width: 1025px) {
  .travel-workspace {
    grid-template-columns: 340px minmax(0, 1fr);
  }
}
@media (max-width: 1024px) {
  .travel-workspace {
    grid-template-columns: 320px minmax(0, 1fr);
    grid-template-rows: 1fr;
  }
  .travel-guide-scroll {
    padding: 18px 20px;
  }
}
@media (max-width: 900px) {
  .travel-workspace {
    grid-template-columns: 1fr;
    grid-template-rows: var(--sidebar-ratio, 52%) 10px minmax(0, 1fr);
    height: calc(100vh - 64px);
  }
  .travel-sidebar {
    border-right: none !important;
    border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  }
  .travel-splitter {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 34px;
    border-top: 1px solid rgba(37, 99, 235, 0.35);
    border-bottom: 1px solid rgba(14, 165, 233, 0.35);
    background: linear-gradient(90deg, rgba(191, 219, 254, 0.92), rgba(153, 246, 228, 0.92));
    cursor: row-resize;
    touch-action: none;
    user-select: none;
    opacity: 1;
    z-index: 12;
  }
  .travel-splitter-handle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    min-width: 188px;
    padding: 0 18px;
    border-radius: 999px;
    border: 1px solid rgba(146, 64, 14, 0.85);
    background: linear-gradient(135deg, #f59e0b, #f97316);
    color: #ffffff;
    font-size: 12px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: 0.01em;
    box-shadow:
      0 0 0 2px rgba(254, 215, 170, 0.95),
      0 6px 16px rgba(194, 65, 12, 0.35);
    text-shadow: 0 1px 2px rgba(15, 23, 42, 0.4);
    animation: splitterPulse 1.8s ease-in-out infinite;
  }
  .travel-splitter:active .travel-splitter-handle {
    transform: translateY(-1px);
    box-shadow:
      0 0 0 2px rgba(251, 191, 36, 1),
      0 10px 20px rgba(194, 65, 12, 0.42);
  }
  .travel-guide-scroll {
    padding: 18px;
  }
  .travel-sidebar-actions {
    position: static;
  }
  @keyframes splitterPulse {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-1px); }
  }
}
</style>

<style>
@media print {
  body * {
    visibility: hidden;
  }

  #travel-route-report,
  #travel-route-report * {
    visibility: visible;
  }

  #travel-route-report {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    background: #fff;
    border: none;
    margin: 0;
    padding: 16px;
  }

  .sidebar-action-panel,
  .travel-header,
  .no-print {
    display: none !important;
  }

  #travel-route-report img {
    max-width: 100%;
    page-break-inside: avoid;
  }

  #travel-route-report .spot-detail-card,
  #travel-route-report .day-block,
  #travel-route-report table {
    page-break-inside: avoid;
  }
}
</style>
