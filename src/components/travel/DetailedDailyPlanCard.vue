<script setup lang="ts">
import type { DetailedDailyPlan } from '@/types/travelTypes'
import DetailedScenicSpotCard from './DetailedScenicSpotCard.vue'

defineProps<{ day: DetailedDailyPlan }>()

const typeLabel: Record<string, string> = {
  meeting: '集合', transport: '交通', scenic: '景区', food: '美食',
  hotel: '住宿', rest: '休息', free: '自由活动',
}
const mealLabel: Record<string, string> = {
  breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '小吃',
}
</script>

<template>
  <div class="day-card trip-day-card">
    <div class="day-head trip-day-header">
      <span class="day-num">第 {{ day.day }} 天</span>
      <h4>{{ day.title }}</h4>
    </div>
    <p class="route-line">{{ day.startCity }} → {{ day.endCity }} · 住宿：{{ day.hotelSuggestion?.needed === false || day.hotelSuggestion?.type === 'home' ? '回家过夜' : day.overnightCity }}</p>
    <p class="summary">{{ day.daySummary }}</p>

    <div v-if="day.transportSummary?.routeDescription" class="transport-box">
      <span>{{ day.transportSummary.transportMode }}</span>
      <span v-if="day.transportSummary.totalDistance">{{ day.transportSummary.totalDistance }}</span>
      <span v-if="day.transportSummary.totalTransportTime">{{ day.transportSummary.totalTransportTime }}</span>
      <p>{{ day.transportSummary.routeDescription }}</p>
    </div>

    <div v-if="(day.timeline || []).length" class="timeline">
      <h5>时间安排</h5>
      <div v-for="(item, i) in day.timeline" :key="i" class="tl-item trip-timeline-item">
        <span class="time trip-timeline-time">{{ item.time }}</span>
        <div class="tl-body trip-timeline-content">
          <el-tag size="small" effect="plain">{{ typeLabel[item.type] || item.type }}</el-tag>
          <strong>{{ item.title }}</strong>
          <span v-if="item.location" class="loc">{{ item.location }}</span>
          <p>{{ item.description }}</p>
          <p v-if="item.cost" class="cost">💰 {{ item.cost }}</p>
          <p v-if="item.transportDetail" class="sub">{{ item.transportDetail }}</p>
          <ul v-if="(item.tips || []).length"><li v-for="(t, j) in item.tips" :key="j">{{ t }}</li></ul>
        </div>
      </div>
    </div>

    <div v-if="(day.scenicSpots || []).length" class="spots-section">
      <h5>当日景区</h5>
      <DetailedScenicSpotCard v-for="(s, i) in day.scenicSpots" :key="i" :spot="s" />
    </div>

    <div v-if="(day.meals || []).length" class="meals">
      <h5>餐饮建议</h5>
      <div v-for="(m, i) in day.meals" :key="i" class="meal-row">
        <span class="meal-type">{{ mealLabel[m.mealType] || m.mealType }}</span>
        <div>
          <strong>{{ m.recommendation }}</strong>
          <span v-if="m.nearbyArea" class="area">（{{ m.nearbyArea }}）</span>
          <p>{{ m.reason }} · 人均 {{ m.estimatedCost }}</p>
        </div>
      </div>
    </div>

    <div v-if="day.hotelSuggestion?.area" class="hotel">
      <h5>{{ day.hotelSuggestion?.needed === false || day.hotelSuggestion?.type === 'home' ? '🏠 回家过夜' : '住宿建议' }}</h5>
      <p><strong>{{ day.hotelSuggestion.city }} · {{ day.hotelSuggestion.area }}</strong></p>
      <p>{{ day.hotelSuggestion.reason }} · {{ day.hotelSuggestion.priceRange }}</p>
      <p v-if="day.hotelSuggestion.parkingConvenience">停车：{{ day.hotelSuggestion.parkingConvenience }}</p>
    </div>

    <div v-if="day.dayBudget?.dayTotal" class="day-budget">
      <strong>当天预算：{{ day.dayBudget.dayTotal }}</strong>
      <span>交通 {{ day.dayBudget.transport }} · 门票 {{ day.dayBudget.tickets }} · 餐饮 {{ day.dayBudget.food }} · 住宿 {{ day.dayBudget.hotel }}</span>
    </div>

    <ul v-if="(day.tips || []).length" class="tips"><li v-for="(t, i) in day.tips" :key="i">{{ t }}</li></ul>
  </div>
</template>

<style scoped>
.day-card { border-radius: 24px; background: #fff; border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 16px; padding: 0; }
.trip-day-card { margin-top: 18px; border-radius: 30px; background: rgba(255,255,255,0.94); border: 1px solid rgba(226,232,240,0.95); box-shadow: 0 18px 50px rgba(15,23,42,0.065); transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
.trip-day-card:hover { transform: translateY(-2px); }
.day-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.trip-day-header { padding: 22px 24px; margin-bottom: 0; background: linear-gradient(135deg, #eff6ff, #ecfeff); border-bottom: 1px solid #e2e8f0; }
.day-num { display:inline-flex; padding: 6px 10px; border-radius: 999px; color: #fff; background: linear-gradient(135deg, #3b82f6, #06b6d4); font-weight: 800; }
.day-head h4 { margin: 0; font-size: 17px; }
.route-line { margin: 12px 20px 6px; font-size: 14px; font-weight: 500; }
.summary { margin: 0 20px 12px; font-size: 14px; line-height: 1.65; color: var(--travel-text-secondary); }
.transport-box { margin: 0 20px 14px; padding: 12px; background: #f8fafc; border-radius: 8px; font-size: 13px; }
.transport-box span { margin-right: 12px; color: var(--travel-text-secondary); }
.day-card h5 { margin: 14px 0 10px; font-size: 14px; color: var(--travel-primary); }
.timeline { margin: 0 20px 14px; }
.tl-item { position: relative; display: grid; grid-template-columns: 76px 1fr; gap: 14px; padding: 14px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px; }
.time { font-weight: 950; color: #2563eb; }
.trip-timeline-content { padding: 14px 16px; border-radius: 18px; background: #f8fafc; border: 1px solid #e5e7eb; }
.tl-body p { margin: 4px 0 0; line-height: 1.5; color: var(--travel-text-secondary); }
.tl-body strong { display: block; margin-top: 6px; }
.cost { color: #059669 !important; font-weight: 500; }
.sub { font-size: 12px; }
.loc { font-size: 12px; color: var(--travel-text-secondary); margin-left: 6px; }
.meal-row { display: flex; gap: 12px; margin: 0 20px 10px; font-size: 13px; }
.meal-type { flex-shrink: 0; width: 40px; font-weight: 600; color: var(--travel-primary); }
.area { font-size: 12px; color: var(--travel-text-secondary); }
.hotel { margin: 0 20px; }
.hotel p { margin: 4px 0; font-size: 13px; }
.day-budget { margin: 12px 20px 0; padding: 12px; background: var(--travel-primary-light); border-radius: 8px; font-size: 13px; }
.day-budget span { display: block; margin-top: 4px; font-size: 12px; color: var(--travel-text-secondary); }
.tips { margin: 10px 20px 16px; padding-left: 18px; font-size: 12px; line-height: 1.55; }
@media (max-width: 600px) { .tl-item { grid-template-columns: 1fr; } }
</style>
