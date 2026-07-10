<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { DetailedTravelGuide } from '@/types/travelTypes'
import { REMIND_BEFORE_OPTIONS } from '@/types/travelTypes'
import { addAllToCalendar, copyAllReminderText } from '@/utils/travelReminders'
import { getCalendarTip } from '@/utils/calendarReminder'
import DepartureOverviewPanel from './DepartureOverviewPanel.vue'
import DetailedMeetingPlanPanel from './DetailedMeetingPlanPanel.vue'
import StartPlanCard from './StartPlanCard.vue'
import DetailedDailyPlanCard from './DetailedDailyPlanCard.vue'
import DetailedScenicSpotCard from './DetailedScenicSpotCard.vue'
import DetailedBudgetPanel from './DetailedBudgetPanel.vue'

const props = defineProps<{
  guide: DetailedTravelGuide | null
  remindBeforeMinutes: number
}>()

const emit = defineEmits<{
  (e: 'regenerate-budget'): void
  (e: 'update:remindBeforeMinutes', value: number): void
}>()

const remindOptions = REMIND_BEFORE_OPTIONS
const calendarTip = computed(() => getCalendarTip())
const addingAll = ref(false)
const copyingAll = ref(false)

const routeTypeLabel: Record<string, string> = {
  direct: '直达', loop: '环线', oneWay: '单程', multiCity: '多城串联',
}

const hasOnlyHomeStay = computed(() =>
  (props.guide?.dailyPlans || []).length > 0
  && (props.guide?.dailyPlans || []).every((d) => d.hotelSuggestion?.needed === false || d.hotelSuggestion?.type === 'home'),
)

async function handleAddAllToCalendar() {
  if (!props.guide || addingAll.value) return
  addingAll.value = true
  try {
    const result = await addAllToCalendar(props.guide, props.remindBeforeMinutes)
    if (result.ok && result.mode === 'shared') {
      ElMessage.success('已通过系统分享添加日历，请在弹窗中选择「日历」')
    } else if (!result.ok) {
      if (result.reason === 'empty') ElMessage.warning('暂无可添加的提醒')
      else if (result.reason !== 'cancelled') {
        ElMessage.warning(result.message || '添加日历失败，请复制提醒文本后手动添加')
      }
    }
  } catch {
    ElMessage.error('添加日历失败，请复制提醒文本后手动添加')
  } finally {
    addingAll.value = false
  }
}

async function handleCopyAllReminders() {
  if (!props.guide || copyingAll.value) return
  copyingAll.value = true
  try {
    await copyAllReminderText(props.guide, props.remindBeforeMinutes)
  } finally {
    copyingAll.value = false
  }
}
</script>

<template>
  <div v-if="guide" id="travel-route-report" class="plan-result guide-preview">
    <div class="result-head guide-cover">
      <div>
        <h2 class="guide-cover-title">{{ guide.title }}</h2>
        <p v-if="guide.subtitle" class="subtitle">{{ guide.subtitle }}</p>
        <p class="summary guide-cover-summary">{{ guide.summary }}</p>
        <div class="cover-meta cover-tags">
          <span class="cover-tag">{{ guide.basicInfo.travelDays }}天</span>
          <span class="cover-tag">{{ guide.basicInfo.totalPeople }}人</span>
          <span class="cover-tag">{{ guide.basicInfo.pace }}</span>
          <span class="cover-tag">{{ guide.basicInfo.budgetLevel }}</span>
          <span v-if="guide.basicInfo.planMode" class="cover-tag">{{ guide.basicInfo.planMode }}</span>
        </div>
      </div>
    </div>

    <section class="calendar-section guide-section no-print">
      <h3 class="section-title">手机日历提醒</h3>
      <p class="calendar-desc">将每天的出发、景点、用餐时间添加到系统日历，系统会按设置时间提前提醒你。</p>
      <p class="calendar-hint">网页无法直接设置手机闹钟，将通过系统日历文件添加提醒。iPhone 用户建议使用 Safari 打开本页面；微信内置浏览器可能无法直接添加。</p>
      <p class="calendar-limit">纯前端生成日历文件在部分 iPhone / 微信内置浏览器中可能无法直接打开。如无法添加，请复制提醒文本，或用 Safari 打开页面后重试。</p>
      <el-alert :title="calendarTip" type="info" show-icon :closable="false" class="calendar-alert" />
      <div class="calendar-tools">
        <span class="calendar-label">提醒时间</span>
        <el-select
          :model-value="remindBeforeMinutes"
          size="small"
          style="width: 160px"
          @update:model-value="emit('update:remindBeforeMinutes', $event)"
        >
          <el-option v-for="opt in remindOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </div>
      <div class="calendar-actions">
        <el-button type="primary" size="small" :loading="addingAll" @click="handleAddAllToCalendar">添加全部行程到日历</el-button>
        <el-button size="small" :loading="copyingAll" @click="handleCopyAllReminders">复制全部提醒文本</el-button>
      </div>
    </section>

    <section class="overview guide-section">
      <h3 class="section-title">出行概览</h3>
      <div class="overview-grid">
        <div class="overview-item"><span class="overview-label">目的地</span><strong class="overview-value">{{ guide.basicInfo.destination }}</strong></div>
        <div class="overview-item"><span class="overview-label">游玩天数</span><strong class="overview-value">{{ guide.basicInfo.travelDays }} 天</strong></div>
        <div class="overview-item"><span class="overview-label">总人数</span><strong class="overview-value">{{ guide.basicInfo.totalPeople }} 人</strong></div>
        <div class="overview-item"><span class="overview-label">预算</span><strong class="overview-value">{{ guide.basicInfo.budgetLevel }}</strong></div>
        <div class="overview-item"><span class="overview-label">节奏</span><strong class="overview-value">{{ guide.basicInfo.pace }}</strong></div>
        <div class="overview-item"><span class="overview-label">主题</span><strong class="overview-value">{{ (guide.basicInfo.themes || []).join('、') }}</strong></div>
        <div v-if="guide.basicInfo.travelDates" class="overview-item"><span class="overview-label">旅行日期</span><strong class="overview-value">{{ guide.basicInfo.travelDates }}</strong></div>
        <div v-if="guide.basicInfo.planMode" class="overview-item"><span class="overview-label">生成模式</span><strong class="overview-value">{{ guide.basicInfo.planMode }}</strong></div>
      </div>
      <el-alert
        v-if="guide.localTripHint"
        type="success"
        :closable="false"
        class="play-hint"
      >
        {{ guide.localTripHint }}
      </el-alert>
      <el-alert
        v-if="(guide.scenicSpotSummary || []).some((spot) => !!spot.carAccess)"
        type="info"
        :closable="false"
        class="play-hint"
      >
        AI 会优先推荐可自驾接近、停车方便、步行距离短的河边/湖边/公园点位；非正规景点会标注安全和停车风险。
      </el-alert>
    </section>

    <DepartureOverviewPanel :departures="guide.departureOverview || []" />

    <section class="route-section guide-section">
      <h3 class="section-title">总路线说明</h3>
      <p><strong>{{ guide.routeOverview.routeName }}</strong>（{{ routeTypeLabel[guide.routeOverview.routeType] || guide.routeOverview.routeType }}）</p>
      <p class="text">{{ guide.routeOverview.routeSummary }}</p>
      <div v-if="(guide.routeOverview.coreCities || []).length" class="cities">
        核心城市：
        <el-tag v-for="c in guide.routeOverview.coreCities" :key="c" size="small">{{ c }}</el-tag>
      </div>
      <ul v-if="(guide.routeOverview.routeHighlights || []).length">
        <li v-for="(h, i) in guide.routeOverview.routeHighlights" :key="i">{{ h }}</li>
      </ul>
    </section>

    <StartPlanCard v-if="guide.startPlan" :plan="guide.startPlan" />
    <DetailedMeetingPlanPanel v-else-if="guide.meetingPlan" :meeting="guide.meetingPlan" />

    <section class="daily-section guide-section">
      <h3 class="section-title">每日详细行程</h3>
      <DetailedDailyPlanCard
        v-for="day in (guide.dailyPlans || [])"
        :key="day.day"
        :day="day"
        :plan-mode="guide.planMode"
        :remind-before-minutes="remindBeforeMinutes"
        :destination="guide.basicInfo.destination"
      />
    </section>

    <section v-if="(guide.scenicSpotSummary || []).length" class="spots-section guide-section">
      <h3 class="section-title">景区汇总</h3>
      <DetailedScenicSpotCard v-for="(s, i) in guide.scenicSpotSummary" :key="s.id || i" :spot="s" />
    </section>

    <section v-if="(guide.foodRecommendations || []).length" class="food-section guide-section">
      <h3 class="section-title">美食推荐</h3>
      <el-table :data="guide.foodRecommendations" size="small" stripe>
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="city" label="城市" width="90" />
        <el-table-column prop="description" label="介绍" />
        <el-table-column prop="avgCost" label="人均" width="110" />
        <el-table-column prop="avoidTip" label="避坑" />
      </el-table>
    </section>

    <section v-if="(guide.hotelSuggestions || []).length" class="hotel-section guide-section">
      <h3 class="section-title">{{ hasOnlyHomeStay ? '回家过夜安排' : '住宿建议' }}</h3>
      <div class="hotel-grid">
        <div v-for="(h, i) in guide.hotelSuggestions" :key="i" class="hotel-card">
          <strong>{{ h.city }} · {{ h.area }}</strong>
          <p>{{ h.reason }}</p>
          <span>{{ h.priceRange }} · 适合 {{ h.suitableFor }}</span>
        </div>
      </div>
    </section>

    <section class="budget-section guide-section">
      <h3 class="section-title">预算明细</h3>
      <div class="budget-tools">
        <el-button size="small" plain @click="$emit('regenerate-budget')">重新估算费用</el-button>
      </div>
      <DetailedBudgetPanel :budget="guide.budgetDetail" />
      <div v-if="guide.budgetReference" class="budget-reference">
        <p>AI 预算估算：{{ guide.budgetReference.aiEstimate }}</p>
        <p>前端参考估算：{{ guide.budgetReference.referenceEstimate }}</p>
        <p class="tip">{{ guide.budgetReference.reason }}</p>
      </div>
    </section>

    <section v-if="(guide.transportTips || []).length" class="tips-section guide-section">
      <h3 class="section-title">交通注意事项</h3>
      <ul><li v-for="(t, i) in guide.transportTips" :key="i">{{ t }}</li></ul>
    </section>

    <section v-if="(guide.packingList || []).length" class="list-section guide-section">
      <h3 class="section-title">出行清单</h3>
      <ul><li v-for="(item, i) in guide.packingList" :key="i">{{ item }}</li></ul>
    </section>

    <section v-if="(guide.riskTips || []).length" class="risk-section guide-section">
      <h3 class="section-title">避坑提醒</h3>
      <el-alert v-for="(tip, i) in guide.riskTips" :key="i" :title="tip" type="warning" :closable="false" show-icon class="risk-alert" />
    </section>

    <section v-if="(guide.finalSuggestions || []).length" class="suggest-section guide-section">
      <h3 class="section-title">可微调建议</h3>
      <ul><li v-for="(s, i) in guide.finalSuggestions" :key="i">{{ s }}</li></ul>
    </section>
  </div>

  <div v-else class="plan-empty">
    <div class="empty-icon">🗺️</div>
    <p>填写出发地和终点后，点击「AI 规划路线」生成详细图文攻略</p>
  </div>
</template>

<style scoped>
.plan-result { background: transparent; border-radius: 24px; border: none; padding: 0; margin-top: 0; box-shadow: none; }
.result-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
.guide-cover {
  position: relative;
  overflow: hidden;
  min-height: 240px;
  border-radius: 32px;
  padding: 32px;
  color: #fff;
  background: radial-gradient(circle at 80% 20%, rgba(255,255,255,0.22), transparent 26%), linear-gradient(135deg, #0f172a 0%, #1d4ed8 45%, #06b6d4 100%);
}
.guide-cover-title { max-width: 760px; margin: 0; font-size: 30px; line-height: 1.18; font-weight: 950; letter-spacing: -0.04em; }
.subtitle { margin: 6px 0; color: rgba(255,255,255,.92); font-size: 15px; }
.guide-cover-summary { max-width: 760px; margin-top: 12px; line-height: 1.8; color: rgba(255,255,255,0.9); }
.cover-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
.cover-tag { height: 28px; display: inline-flex; align-items: center; padding: 0 10px; border-radius: 999px; background: rgba(255,255,255,0.18); color: #fff; font-size: 12px; font-weight: 700; }
.guide-section { margin-bottom: 18px; padding: 22px; border-radius: 28px; background: rgba(255,255,255,0.92); border: 1px solid rgba(226,232,240,0.9); box-shadow: 0 16px 42px rgba(15,23,42,0.06); }
.overview, .route-section, .daily-section, .spots-section, .food-section, .hotel-section, .budget-section, .tips-section, .list-section, .risk-section, .suggest-section { margin-bottom: 24px; }
.section-title { display: flex; align-items: center; gap: 8px; margin: 0 0 14px; font-size: 18px; font-weight: 900; color: #172033; }
.section-title::before { content: ""; width: 4px; height: 18px; border-radius: 999px; background: linear-gradient(180deg, #2563eb, #06b6d4); }
.overview-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; }
.overview-item { padding: 16px; border-radius: 18px; background: #f8fafc; border: 1px solid #e5e7eb; }
.overview-label { font-size: 12px; color: #64748b; display: block; }
.overview-value { margin-top: 8px; font-size: 16px; font-weight: 900; color: #172033; display: block; white-space: normal; line-height: 1.5; overflow-wrap: anywhere; word-break: break-word; }
.plan-result,
.guide-preview {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
.text { font-size: 14px; line-height: 1.65; color: var(--travel-text-secondary); }
.cities { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 13px; margin-top: 8px; }
.hotel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.hotel-card { padding: 14px; background: #f8fafc; border-radius: 10px; font-size: 13px; }
.hotel-card p { margin: 6px 0; }
.hotel-card span { font-size: 12px; color: var(--travel-text-secondary); }
.tips-section ul, .list-section ul, .suggest-section ul { margin: 0; padding-left: 20px; line-height: 1.7; font-size: 14px; }
.play-hint { margin-top: 12px; }
.budget-tools { margin-bottom: 10px; }
.budget-reference { margin-top: 12px; font-size: 13px; color: var(--travel-text-secondary); }
.budget-reference p { margin: 4px 0; }
.budget-reference .tip { color: #0369a1; }
.risk-alert { margin-bottom: 8px; }
.calendar-section { margin-bottom: 24px; }
.calendar-desc { margin: 0 0 8px; font-size: 14px; color: #475569; line-height: 1.6; }
.calendar-hint { margin: 0 0 8px; font-size: 12px; color: #94a3b8; line-height: 1.55; }
.calendar-limit { margin: 0 0 14px; font-size: 11px; color: #b45309; line-height: 1.5; }
.calendar-alert { margin-bottom: 14px; }
.calendar-tools { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 12px; }
.calendar-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.calendar-label { font-size: 13px; color: #64748b; font-weight: 700; }
.plan-empty { text-align: center; padding: 60px 24px; background: var(--travel-card); border-radius: var(--travel-radius); border: 1px dashed var(--travel-border); margin-top: 20px; color: var(--travel-text-secondary); }
.empty-icon { font-size: 48px; margin-bottom: 12px; }
@media (max-width: 1200px) {
  .overview-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 768px) {
  .guide-cover {
    min-height: auto;
    padding: 20px 16px;
    border-radius: 14px;
  }
  .guide-cover-title {
    font-size: 22px;
    line-height: 1.3;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .subtitle,
  .guide-cover-summary { font-size: 15px; line-height: 1.7; }
  .cover-tag { height: 32px; font-size: 14px; padding: 0 12px; }
  .guide-section {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    padding: 16px;
    border-radius: 14px;
    margin-bottom: 14px;
    box-sizing: border-box;
  }
  .section-title { font-size: 18px; }
  .overview-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .overview-item {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    padding: 14px;
    border-radius: 12px;
    box-sizing: border-box;
  }
  .overview-label { font-size: 14px; }
  .overview-value {
    font-size: 16px;
    white-space: normal;
    line-height: 1.5;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .text,
  .tips-section ul,
  .list-section ul,
  .suggest-section ul,
  .calendar-desc,
  .budget-reference,
  .hotel-card,
  .hotel-card span,
  .calendar-hint {
    font-size: 16px !important;
    line-height: 1.75;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .hotel-grid,
  .cities {
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }
  .hotel-grid { grid-template-columns: 1fr; }
  .calendar-tools,
  .calendar-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .calendar-actions .el-button { width: 100%; min-height: 44px; font-size: 15px; }
  .calendar-label { font-size: 15px; }
  .calendar-limit { font-size: 14px; }
  .plan-result,
  .guide-preview {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: hidden;
  }
  .plan-result img,
  .guide-preview img {
    max-width: 100%;
    height: auto;
  }
  .plan-result table,
  .guide-preview table {
    display: block;
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
  }
  .plan-result pre,
  .plan-result code {
    white-space: pre-wrap;
    word-break: break-word;
    overflow-wrap: anywhere;
  }
}
</style>
