<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PlanGenerationState } from '@/types/travelTypes'

const props = defineProps<{
  loadingStep?: string
  visible: boolean
  /** outline=只生成大纲；detail=细行程；budget/images=单项任务 */
  mode?: 'idle' | 'outline' | 'detail' | 'budget' | 'images'
  travelDays?: number
  fetchScenicImages?: boolean
  weatherFetched?: boolean
  generationState?: PlanGenerationState | null
}>()

const elapsedSec = ref(0)
let timer: number | null = null

type StepKey = 'weather' | 'outline' | 'meeting' | 'daily' | 'budget' | 'tips' | 'images' | 'compose'

interface StepDef {
  key: StepKey
  label: string
  match: RegExp
}

const OUTLINE_STEPS: StepDef[] = [
  { key: 'weather', label: '天气', match: /天气/ },
  { key: 'outline', label: '路线大纲', match: /大纲|总览|路线框架/ },
]

const DETAIL_STEPS: StepDef[] = [
  { key: 'weather', label: '天气', match: /天气/ },
  { key: 'meeting', label: '出发/集合', match: /出发|集合|meeting/i },
  { key: 'daily', label: '每日行程', match: /第\s*\d+\s*天|每日|行程/ },
  { key: 'budget', label: '预算', match: /预算|费用/ },
  { key: 'tips', label: '注意事项', match: /注意|贴士|tips/i },
  { key: 'compose', label: '合成攻略', match: /合成|compose/i },
  { key: 'images', label: '景区图片', match: /图片|景区图/ },
]

const BUDGET_STEPS: StepDef[] = [
  { key: 'budget', label: '重新估算费用', match: /预算|费用|高速/ },
]

const IMAGE_STEPS: StepDef[] = [
  { key: 'images', label: '补全景区图片', match: /图片|景区图/ },
]

const steps = computed(() => {
  if (props.mode === 'outline') return OUTLINE_STEPS
  if (props.mode === 'budget') return BUDGET_STEPS
  if (props.mode === 'images') return IMAGE_STEPS
  // detail：不开抓图就不显示图片步骤
  if (!props.fetchScenicImages) {
    return DETAIL_STEPS.filter((s) => s.key !== 'images')
  }
  return DETAIL_STEPS
})

const titleText = computed(() => {
  if (props.mode === 'outline') return '正在生成行程大纲'
  if (props.mode === 'budget') return '正在重新估算费用'
  if (props.mode === 'images') return '正在补全景区图片'
  if (props.mode === 'detail') return '正在生成详细行程'
  return '正在生成'
})

const etaText = computed(() => {
  const sec = elapsedSec.value
  if (props.mode === 'outline') {
    if (sec < 20) return '大纲通常约 20–60 秒'
    if (sec < 60) return '正在整理按天骨架，请稍候'
    return '模型较慢时大纲也可能超过 1 分钟'
  }
  if (props.mode === 'budget' || props.mode === 'images') {
    return sec < 30 ? '通常很快完成' : '仍在处理，请稍候'
  }
  const days = props.travelDays || 0
  if (sec < 30) return days ? `约 ${days} 天细行程，通常需要几分钟` : '通常需要几分钟，请稍候'
  if (sec < 90) return '正在按天展开，可在下方查看已生成内容'
  return '天数较多时会久一点，已生成的内容会实时出现在下方'
})

const activeStepIndex = computed(() => {
  const list = steps.value
  const text = props.loadingStep || ''
  let idx = list.findIndex((s) => s.match.test(text))
  if (idx >= 0) return idx

  // 用真实状态推断当前步
  const st = props.generationState
  if (props.mode === 'outline') {
    if (st?.outline) return list.length - 1
    if (props.weatherFetched) return Math.min(1, list.length - 1)
    return 0
  }
  if (props.mode === 'detail') {
    if (/跳过.*图片|合成/.test(text)) {
      const i = list.findIndex((s) => s.key === 'compose' || s.key === 'images')
      return i >= 0 ? i : list.length - 1
    }
    if (st?.tips) {
      const i = list.findIndex((s) => s.key === 'compose' || s.key === 'tips')
      return Math.max(i, 0)
    }
    if (st?.budget) {
      const i = list.findIndex((s) => s.key === 'tips')
      return i >= 0 ? i : list.length - 1
    }
    if ((st?.dailyPlans?.length || 0) > 0) {
      const i = list.findIndex((s) => s.key === 'daily')
      return i >= 0 ? i : 0
    }
    if (st?.startPlan || st?.meetingPlan) {
      const i = list.findIndex((s) => s.key === 'daily')
      return i >= 0 ? i : 0
    }
    if (props.weatherFetched) {
      const i = list.findIndex((s) => s.key === 'meeting')
      return i >= 0 ? i : 0
    }
  }
  return 0
})

  const doneFlags = computed(() => {
  const st = props.generationState
  const daysDone = st?.dailyPlans?.length || 0
  const totalDays = props.travelDays || 0
  const stepText = props.loadingStep || ''
  const pastWeather = props.weatherFetched
    || (!!stepText && !/天气/.test(stepText))
    || activeStepIndex.value > 0
  return {
    weather: pastWeather,
    outline: !!st?.outline,
    meeting: !!(st?.startPlan || st?.meetingPlan),
    daily: totalDays > 0 && daysDone >= totalDays,
    budget: !!st?.budget,
    tips: !!st?.tips,
  }
})

function isStepDone(step: StepDef, index: number): boolean {
  if (index < activeStepIndex.value) return true
  const f = doneFlags.value
  if (step.key === 'weather') return f.weather && index !== activeStepIndex.value
  if (step.key === 'outline') return f.outline
  if (step.key === 'meeting') return f.meeting
  if (step.key === 'daily') return f.daily
  if (step.key === 'budget') return f.budget
  if (step.key === 'tips') return f.tips
  return false
}

function stepExtra(step: StepDef): string {
  if (step.key === 'daily') {
    const done = props.generationState?.dailyPlans?.length || 0
    const total = props.travelDays || 0
    if (total > 0) return `${done}/${total} 天`
  }
  if (step.key === 'outline' && props.generationState?.outline) return '已出'
  if (step.key === 'meeting' && (props.generationState?.startPlan || props.generationState?.meetingPlan)) return '已出'
  if (step.key === 'budget' && props.generationState?.budget) return '已出'
  return ''
}

const livePreview = computed(() => {
  const st = props.generationState
  if (!st) return null
  if (props.mode === 'outline' && st.outline) {
    const o = st.outline
    return {
      title: o.title || o.routeName,
      lines: [
        o.routeSummary || o.summary,
        (o.coreCities || []).length ? `核心城市：${o.coreCities.join('、')}` : '',
        (o.dailyOutlines || []).length ? `已规划 ${o.dailyOutlines!.length} 天骨架` : '',
      ].filter(Boolean),
    }
  }
  if (props.mode === 'detail') {
    const lines: string[] = []
    if (st.outline) lines.push(`大纲：${st.outline.routeName || st.outline.title}`)
    if (st.startPlan) lines.push(`出发：${st.startPlan.fromAddress} → ${st.startPlan.firstStopCity}`)
    if (st.meetingPlan) lines.push(`集合：${st.meetingPlan.meetingCity}`)
    const days = [...(st.dailyPlans || [])].sort((a, b) => a.day - b.day)
    for (const d of days.slice(-4)) {
      lines.push(`第${d.day}天 ${d.startCity}→${d.endCity}${d.overnightCity ? ` · 住${d.overnightCity}` : ''}`)
    }
    if (days.length > 4) lines.splice(lines.length - 4, 0, `…已生成 ${days.length} 天…`)
    if (st.budget) lines.push(`预算：${st.budget.totalEstimate || '已整理'}`)
    if (!lines.length) return null
    return { title: '已生成内容（实时）', lines }
  }
  return null
})

function startTimers() {
  stopTimers()
  elapsedSec.value = 0
  timer = window.setInterval(() => {
    elapsedSec.value += 1
  }, 1000)
}

function stopTimers() {
  if (timer != null) {
    window.clearInterval(timer)
    timer = null
  }
}

watch(
  () => props.visible,
  (v) => {
    if (v) startTimers()
    else stopTimers()
  },
  { immediate: true },
)

onMounted(() => {
  if (props.visible) startTimers()
})

onBeforeUnmount(stopTimers)

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
</script>

<template>
  <div v-if="visible" class="planning-wait no-print">
    <div class="wait-card">
      <div class="wait-head">
        <div class="spinner" />
        <div>
          <h3>{{ titleText }}</h3>
          <p class="current-step">{{ loadingStep || '准备中…' }}</p>
          <p class="eta">已等待 {{ formatTime(elapsedSec) }} · {{ etaText }}</p>
        </div>
      </div>

      <ul class="step-list">
        <li
          v-for="(step, i) in steps"
          :key="step.key"
          :class="{
            done: isStepDone(step, i),
            active: i === activeStepIndex && !isStepDone(step, i),
          }"
        >
          <span class="dot">{{ isStepDone(step, i) ? '✓' : i + 1 }}</span>
          <span class="label">{{ step.label }}</span>
          <span v-if="stepExtra(step)" class="extra">{{ stepExtra(step) }}</span>
        </li>
      </ul>

      <div v-if="livePreview" class="live-box">
        <div class="live-bar">
          <strong>{{ livePreview.title }}</strong>
          <span>生成中实时预览</span>
        </div>
        <ul class="live-lines">
          <li v-for="(line, i) in livePreview.lines" :key="i">{{ line }}</li>
        </ul>
      </div>
      <p v-else class="wait-hint">
        {{ mode === 'outline' ? '正在向模型请求按天大纲，完成后可先改路线再写细行程。' : '内容会按步骤陆续生成，下方会同步显示已完成部分。' }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.planning-wait {
  margin: 0 0 16px;
}

.wait-card {
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, #eff6ff, #f8fafc);
  border: 1px solid #bfdbfe;
  box-shadow: 0 10px 28px rgba(37, 99, 235, 0.08);
}

.wait-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.wait-head h3 {
  margin: 0 0 4px;
  font-size: 16px;
  color: #1e3a8a;
}

.current-step {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #1d4ed8;
}

.eta {
  margin: 4px 0 0;
  font-size: 12px;
  color: #64748b;
}

.spinner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid #bfdbfe;
  border-top-color: #2563eb;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
  margin-top: 2px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.step-list {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
  display: grid;
  gap: 6px;
}

.step-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #94a3b8;
}

.step-list li.done {
  color: #059669;
}

.step-list li.active {
  color: #1d4ed8;
  font-weight: 800;
}

.label { flex: 1; }

.extra {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  background: #e2e8f0;
  border-radius: 999px;
  padding: 1px 8px;
}

.step-list li.done .extra {
  background: #d1fae5;
  color: #047857;
}

.dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  background: #e2e8f0;
  color: #64748b;
}

.step-list li.done .dot {
  background: #d1fae5;
  color: #059669;
}

.step-list li.active .dot {
  background: #dbeafe;
  color: #1d4ed8;
}

.live-box {
  margin-top: 14px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #bfdbfe;
  overflow: hidden;
}

.live-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 12px;
  color: #1e3a8a;
  background: #eff6ff;
}

.live-lines {
  margin: 0;
  padding: 10px 14px 12px 28px;
  font-size: 13px;
  color: #334155;
  line-height: 1.55;
}

.live-lines li + li {
  margin-top: 4px;
}

.wait-hint {
  margin: 12px 0 0;
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}
</style>
