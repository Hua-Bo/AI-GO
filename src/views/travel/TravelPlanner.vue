<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useTravelPlanner } from '@/composables/travel/useTravelPlanner'
import { useResponsive } from '@/composables/useResponsive'
import {
  downloadGuidePdf,
  exportGuideToImage,
  exportGuideToWord,
  isPdfDownloadAvailable,
  printGuide,
} from '@/services/travelExportApi'
import { exportGuideToAmap } from '@/services/travelAmapExport'
import AmapDayNavDialog from '@/components/travel/AmapDayNavDialog.vue'
import TravelActionBar from '@/components/travel/TravelActionBar.vue'
import MobileBottomBar from '@/components/travel/MobileBottomBar.vue'
import AiConfigDialog from '@/components/travel/AiConfigDialog.vue'
import BasicConditionBar from '@/components/travel/BasicConditionBar.vue'
import DestinationIntentPanel from '@/components/travel/DestinationIntentPanel.vue'
import AccommodationPanel from '@/components/travel/AccommodationPanel.vue'
import PreferenceSupplementPanel from '@/components/travel/PreferenceSupplementPanel.vue'
import DepartureConfigPanel from '@/components/travel/DepartureConfigPanel.vue'
import RoutePlanningResult from '@/components/travel/RoutePlanningResult.vue'
import PlanningWaitPanel from '@/components/travel/PlanningWaitPanel.vue'
import '@/styles/travel-theme.css'
import '@/styles/travel-mobile.css'
import '@/components/travel/travel-form.css'
import { getTravelFontScale, setTravelFontScale } from '@/rem'

const { isMobile } = useResponsive()
const mobileCollapse = ref<string[]>([])
const pcPrefsCollapse = ref<string[]>([])

const {
  stage, loadingStep, error, errorDetail, isPlanning, isPlanParseError,
  canGenerate, guideReady, failedDay, rawResponse, showRawResponse,
  aiConfig, hasApiKey, configDialogVisible, saveConfig,
  travelDays, customDays, useCustomDays, departurePoints, travelThemes, budgetLevel, pace,
  withChildren, withElderly, avoidCrowded, preferNaturalScenery, preferFood, preferPhotoSpot,
  preferFreeSpots, preferParks, preferCamping, preferLakeside, preferForest, preferCityWalk,
  preferLowCost, avoidTicketsExpensive, preferDriveToSpot, preferRiverside, preferWaterPlay,
  preferWildSpot, preferEasyParking, maxWalkDistance, specialPlaceHint, customDailyEvents,
  accommodationMode, homeBaseAddress, maxReturnDistanceKm, maxReturnDuration, accommodationNote,
  hotelDays, hotelDayReason,
  destinationIntent, startDate, planMode, remindBeforeMinutes, planResult, effectiveDays,
  planRoute, stopGeneration, retryCurrentStep, retryFromStart, retryFailedDay, regenerateBudget,
  addDeparture, removeDeparture, resetAll,
} = useTravelPlanner()

watch(isMobile, (mobile) => {
  if (mobile && planMode.value === 'detailed') {
    if (!planResult.value) planMode.value = 'simple'
  }
}, { immediate: true })

const exportingWord = ref(false)
const exportingPdf = ref(false)
const exportingImage = ref(false)
const exportingImagePlain = ref(false)
const exportingAmap = ref(false)
const amapDayNavVisible = ref(false)
const pdfAvailable = isPdfDownloadAvailable()

const fontScaleOptions = [
  { label: '小', value: 0.9 },
  { label: '标准', value: 1 },
  { label: '大', value: 1.12 },
  { label: '特大', value: 1.25 },
] as const
const fontScale = ref(getTravelFontScale())
function applyFontScale(scale: number) {
  fontScale.value = scale
  setTravelFontScale(scale)
}
applyFontScale(fontScale.value)

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
  const providerKeys = { ...(aiConfig.value.providerKeys || {}) }
  delete providerKeys[aiConfig.value.provider]
  saveConfig({
    ...aiConfig.value,
    apiKey: '',
    providerKeys,
    requestMode: 'direct',
  })
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
    await downloadGuidePdf(planResult.value || undefined)
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

async function handleExportAmap() {
  if (!planResult.value) return
  exportingAmap.value = true
  try {
    await exportGuideToAmap(planResult.value)
  } finally {
    exportingAmap.value = false
  }
}

async function handleOpenAmapNav() {
  if (!planResult.value) return
  amapDayNavVisible.value = true
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function refreshStackMode() {
  // 手机端用独立单列布局，不再使用上下拖拽分栏
  isStackMode.value = window.innerWidth > 767 && window.innerWidth <= 900
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
    <div class="travel-planner-page" :class="{ 'is-mobile': isMobile }">
      <div class="travel-shell travel-app-shell">
        <header class="travel-topbar travel-header no-print">
          <div class="topbar-left">
            <h1 class="topbar-title">AI 旅游攻略</h1>
            <p class="topbar-subtitle">{{ isMobile ? '填写核心信息，一键生成攻略' : '让 AI 帮你规划路线、预算和图文攻略' }}</p>
            <div v-if="isMobile" class="model-status-bar" :class="hasApiKey ? 'ok' : 'warn'">
              {{ hasApiKey
                ? `当前模型：${providerLabelMap[aiConfig.provider] || aiConfig.provider} / ${aiConfig.model} / 已配置`
                : '当前模型：未配置，请先填写 API Key' }}
            </div>
          </div>
          <div class="topbar-center">
            <span class="model-pill">{{ hasApiKey ? `${providerLabelMap[aiConfig.provider] || aiConfig.provider} · ${aiConfig.model}` : '未配置模型' }}</span>
            <span class="model-pill">{{ keyStatusLabel }}</span>
            <span class="model-pill">{{ requestModeLabel }}</span>
          </div>
          <div class="topbar-actions">
            <div class="font-size-switch" title="全站字体大小">
              <span class="font-label">字体</span>
              <button
                v-for="opt in fontScaleOptions"
                :key="opt.value"
                type="button"
                :class="{ active: Math.abs(fontScale - opt.value) < 0.001 }"
                @click="applyFontScale(opt.value)"
              >{{ opt.label }}</button>
            </div>
            <button
              type="button"
              class="model-config-btn"
              :class="{ configured: hasApiKey }"
              @click="configDialogVisible = true"
            >
              <span class="btn-main">⚙ 模型配置</span>
              <span class="btn-status">{{ hasApiKey ? '已配置' : '未配置' }}</span>
              <span v-if="!hasApiKey" class="status-dot" />
            </button>
            <el-button v-if="!isMobile" @click="resetAll()">重置</el-button>
          </div>
        </header>

        <div ref="workspaceRef" class="travel-workspace" :class="{ 'mobile-workspace': isMobile }" :style="workspaceStyle">
          <aside class="travel-sidebar travel-config-panel no-print">
            <div class="travel-sidebar-scroll">
              <el-alert v-if="stage === 'needApiKey'" type="warning" show-icon :closable="false" title="请先填写你自己的 API Key" description="当前为 GitHub Pages 静态部署版，不内置任何 Key。点击右上角「模型配置」填写你自己的 Key 后保存。" class="key-alert" />

              <!-- 移动端：核心配置 -->
              <template v-if="isMobile">
                <section class="config-card">
                  <div class="config-card-title">🗓️ 核心配置</div>
                  <BasicConditionBar
                    section="core"
                    v-model:travel-days="travelDays"
                    v-model:custom-days="customDays"
                    v-model:use-custom-days="useCustomDays"
                    v-model:start-date="startDate"
                    v-model:plan-mode="planMode"
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
                  v-model:hotel-days="hotelDays"
                  v-model:hotel-day-reason="hotelDayReason"
                  :local-trip-detected="localTripDetected"
                  :travel-days="effectiveDays"
                />

                <el-collapse v-model="mobileCollapse" class="mobile-collapse preference-section">
                  <el-collapse-item title="更多偏好" name="prefs">
                    <section class="config-card">
                      <BasicConditionBar
                        section="advanced"
                        v-model:travel-days="travelDays"
                        v-model:custom-days="customDays"
                        v-model:use-custom-days="useCustomDays"
                        v-model:start-date="startDate"
                        v-model:plan-mode="planMode"
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
                    <PreferenceSupplementPanel
                      v-model:special-place-hint="specialPlaceHint"
                      v-model:custom-daily-events="customDailyEvents"
                    />
                  </el-collapse-item>
                </el-collapse>
                <section class="model-status-only">
                  <div>当前模型：{{ hasApiKey ? `${providerLabelMap[aiConfig.provider] || aiConfig.provider} / ${aiConfig.model}` : '未配置' }}</div>
                  <div>Key 状态：{{ keyStatusLabel }}</div>
                  <div>部署模式：{{ requestModeLabel }}</div>
                </section>
              </template>

              <!-- PC / 平板：核心在前，偏好默认折叠，无重复模型配置入口 -->
              <template v-else>
                <section class="config-card">
                  <div class="config-card-title">🗓️ 基础条件</div>
                  <BasicConditionBar
                    section="core"
                    v-model:travel-days="travelDays"
                    v-model:custom-days="customDays"
                    v-model:use-custom-days="useCustomDays"
                    v-model:start-date="startDate"
                    v-model:plan-mode="planMode"
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
                  v-model:hotel-days="hotelDays"
                  v-model:hotel-day-reason="hotelDayReason"
                  :local-trip-detected="localTripDetected"
                  :travel-days="effectiveDays"
                />
                <el-collapse v-model="pcPrefsCollapse" class="mobile-collapse preference-section">
                  <el-collapse-item title="更多偏好" name="prefs">
                    <section class="config-card">
                      <BasicConditionBar
                        section="advanced"
                        v-model:travel-days="travelDays"
                        v-model:custom-days="customDays"
                        v-model:use-custom-days="useCustomDays"
                        v-model:start-date="startDate"
                        v-model:plan-mode="planMode"
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
                    <PreferenceSupplementPanel
                      v-model:special-place-hint="specialPlaceHint"
                      v-model:custom-daily-events="customDailyEvents"
                    />
                  </el-collapse-item>
                </el-collapse>
                <section class="model-status-only">
                  <div>当前模型：{{ hasApiKey ? `${providerLabelMap[aiConfig.provider] || aiConfig.provider} / ${aiConfig.model}` : '未配置' }}</div>
                  <div>Key 状态：{{ keyStatusLabel }}</div>
                  <div>部署模式：{{ requestModeLabel }}</div>
                </section>
              </template>
            </div>
            <div v-if="!isMobile" class="travel-sidebar-actions trip-action-area">
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
                :exporting-amap="exportingAmap"
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
                @export-amap="handleExportAmap()"
                @open-amap-nav="handleOpenAmapNav()"
              />
            </div>
          </aside>
          <div
            v-if="!isMobile"
            class="travel-splitter no-print"
            @mousedown="startDragMouse"
            @touchstart.prevent="startDragTouch"
          >
            <span class="travel-splitter-handle">⬆⬇ 上下拖动分隔 ⬆⬇</span>
          </div>
          <main class="travel-guide-main travel-canvas">
            <div class="travel-guide-scroll">
              <div class="travel-guide-inner travel-canvas-inner">
            <div v-if="guideReady && isMobile" class="guide-toolbar no-print">
              <el-dropdown trigger="click">
                <el-button>更多操作</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :disabled="exportingWord" @click="handleExportWord()">导出 Word</el-dropdown-item>
                    <el-dropdown-item :disabled="exportingPdf" @click="handleDownloadPdf()">导出 PDF</el-dropdown-item>
                    <el-dropdown-item @click="handlePrintGuide()">打印攻略</el-dropdown-item>
                    <el-dropdown-item :disabled="exportingImage" @click="handleExportImage()">保存长图</el-dropdown-item>
                    <el-dropdown-item :disabled="exportingImagePlain" @click="handleExportImagePlain()">无图长图</el-dropdown-item>
                    <el-dropdown-item :disabled="exportingAmap" @click="handleExportAmap()">导出高德文件（看攻略内说明）</el-dropdown-item>
                    <el-dropdown-item @click="handleOpenAmapNav()">按天高德导航</el-dropdown-item>
                    <el-dropdown-item @click="configDialogVisible = true">模型配置</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
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

            <PlanningWaitPanel :visible="isPlanning" :loading-step="loadingStep" />

            <div v-if="(stage === 'input' || stage === 'needApiKey') && !isPlanning" class="empty-tip empty-guide-card empty-trip-state no-print">
              <div class="empty-trip-card">
                <div class="icon">🧭</div>
                <h3>准备好规划你的旅行了吗？</h3>
                <p>{{ isMobile ? '填写上方核心信息，点底部「生成攻略」即可。' : '填写左侧信息，AI 会帮你生成一份完整图文攻略：路线规划、每日行程、景区图文、费用预算、住宿策略，并支持导出 Word / PDF / 长图。' }}</p>
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

            <div class="guide-content">
              <RoutePlanningResult
                v-if="planResult || stage === 'planned'"
                :guide="planResult"
                v-model:remind-before-minutes="remindBeforeMinutes"
                @regenerate-budget="regenerateBudget()"
              />
            </div>
              </div>
            </div>
          </main>
        </div>

        <MobileBottomBar
          v-if="isMobile"
          :is-generating="isPlanning"
          :has-api-key="hasApiKey"
          :can-generate="canGenerate"
          @reset="resetAll()"
          @plan="planRoute()"
          @stop="stopGeneration()"
          @open-config="configDialogVisible = true"
        />

        <AiConfigDialog
          v-model:visible="configDialogVisible"
          v-model:config="aiConfig"
          @save="onSaveAiConfig"
          @clear="onClearAiConfig"
        />
        <AmapDayNavDialog
          v-model:visible="amapDayNavVisible"
          :guide="planResult"
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
.travel-planner-page.is-mobile {
  height: auto;
  min-height: 100dvh;
  overflow-x: hidden;
  overflow-y: auto;
  padding-bottom: calc(110px + env(safe-area-inset-bottom));
}
.travel-planner-page.is-mobile .travel-shell {
  height: auto;
  min-height: 100dvh;
  overflow: visible;
}
.travel-planner-page.is-mobile .travel-workspace {
  height: auto;
  overflow: visible;
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
.model-status-bar {
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
}
.model-status-bar.ok {
  color: #047857;
  background: #ecfdf5;
  border: 1px solid #bbf7d0;
}
.model-status-bar.warn {
  color: #b45309;
  background: #fffbeb;
  border: 1px solid #fde68a;
}
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
.topbar-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
.model-config-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid #bfdbfe;
  background: linear-gradient(135deg, #eff6ff, #ecfeff);
  color: #1d4ed8;
  font-weight: 800;
  cursor: pointer;
}
.model-config-btn .btn-main { font-size: 14px; }
.model-config-btn .btn-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255,255,255,0.85);
  color: #b45309;
}
.model-config-btn.configured .btn-status {
  color: #047857;
}
.model-config-btn .status-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 0 2px #fff;
}
.font-size-switch {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 12px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}
.font-size-switch .font-label {
  padding: 0 6px;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}
.font-size-switch button {
  min-height: 30px;
  min-width: 40px;
  padding: 0 8px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.font-size-switch button.active {
  background: #fff;
  color: #1d4ed8;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.12);
}
.guide-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-bottom: 12px;
}
.model-status-only {
  margin: 12px 0;
  padding: 12px 14px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  font-size: 12px;
  color: #64748b;
  line-height: 1.55;
}
.model-status-only div + div { margin-top: 2px; }
.preference-section { margin-bottom: 12px; }
.travel-workspace {
  height: calc(100vh - 64px);
  min-height: 0;
  min-width: 0;
  width: 100%;
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
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
  max-width: 100%;
  min-width: 0;
  margin: 0 auto;
  box-sizing: border-box;
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
    grid-template-columns: 360px minmax(0, 1fr);
  }
}
@media (max-width: 1024px) {
  .travel-workspace {
    grid-template-columns: 340px minmax(0, 1fr);
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

/* 手机端：取消 PC 视口锁定，放大字号 */
.travel-planner-page.is-mobile {
  height: auto !important;
  min-height: 100dvh;
  overflow-x: hidden;
  overflow-y: visible;
  padding-bottom: calc(110px + env(safe-area-inset-bottom)) !important;
}
.travel-planner-page.is-mobile .travel-shell,
.travel-planner-page.is-mobile .travel-app-shell,
.travel-planner-page.is-mobile .travel-workspace {
  height: auto !important;
  min-height: 0;
  overflow: visible !important;
  min-width: 0 !important;
  max-width: 100% !important;
}
.travel-planner-page.is-mobile .travel-guide-main,
.travel-planner-page.is-mobile .travel-canvas,
.travel-planner-page.is-mobile .travel-guide-inner,
.travel-planner-page.is-mobile .travel-canvas-inner,
.travel-planner-page.is-mobile .guide-content {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
}
.travel-planner-page.is-mobile .travel-guide-scroll {
  height: auto !important;
  overflow: visible !important;
  overflow-x: hidden !important;
  padding: 12px 12px calc(24px + env(safe-area-inset-bottom)) !important;
}
.travel-planner-page.is-mobile .config-card-title {
  font-size: 20px !important;
}
.travel-planner-page.is-mobile .config-card-desc,
.travel-planner-page.is-mobile .gh-pages-hint,
.travel-planner-page.is-mobile .topbar-subtitle {
  font-size: 16px !important;
  line-height: 1.65;
}
.travel-planner-page.is-mobile .topbar-title {
  font-size: 24px !important;
}
.travel-planner-page.is-mobile .config-card,
.travel-planner-page.is-mobile .form-card,
.travel-planner-page.is-mobile .trip-config-card {
  padding: 18px;
  border-radius: 16px;
}
.travel-planner-page.is-mobile .inspiration-route-card p {
  font-size: 16px;
  line-height: 1.65;
}
.travel-planner-page.is-mobile .empty-tip h3 {
  font-size: 24px;
}
.travel-planner-page.is-mobile .empty-tip p,
.travel-planner-page.is-mobile .empty-tip li {
  font-size: 16px;
  line-height: 1.7;
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
