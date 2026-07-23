<script setup lang="ts">
import type { DailyRoutePlan } from '@/types/travelTypes'
import ScenicImage from './ScenicImage.vue'

defineProps<{
  day: DailyRoutePlan
}>()

const typeLabel: Record<string, string> = {
  meeting: '集合', transport: '交通', scenic: '景区', food: '美食',
  hotel: '住宿', rest: '休息', free: '自由活动',
}
</script>

<template>
  <div class="day-card">
    <div class="day-head">
      <span class="day-num">第 {{ day.day }} 天</span>
      <h4>{{ day.title }}</h4>
    </div>
    <p class="route-line">{{ day.startCity }} → {{ day.endCity }} · 住宿：{{ day.overnightCity }}</p>
    <p class="summary">{{ day.routeSummary }}</p>
    <div v-if="day.totalDistance || day.totalTransportTime" class="stats">
      <span v-if="day.totalDistance">📏 {{ day.totalDistance }}</span>
      <span v-if="day.totalTransportTime">⏱ {{ day.totalTransportTime }}</span>
      <span v-if="day.budgetEstimate">💰 {{ day.budgetEstimate }}</span>
    </div>

    <div v-if="(day.timeline || []).length" class="timeline">
      <div v-for="(item, i) in day.timeline" :key="i" class="tl-item">
        <span class="time">{{ item.time }}</span>
        <el-tag size="small" effect="plain">{{ typeLabel[item.type] || item.type }}</el-tag>
        <div class="tl-body">
          <strong>{{ item.title }}</strong>
          <p>{{ item.description }}</p>
        </div>
      </div>
    </div>

    <div v-if="(day.scenicSpots || []).length" class="spots">
      <span class="spots-label">当日景区</span>
      <div class="spot-chips">
        <div v-for="(s, i) in day.scenicSpots" :key="i" class="spot-chip">
          <div v-if="s.image" class="spot-thumb">
            <ScenicImage :src="s.image" :alt="s.name" :name="s.name" />
          </div>
          <span>{{ s.name }}</span>
        </div>
      </div>
    </div>

    <p v-if="(day.mealSuggestions || []).length" class="extra">
      🍽 用餐：{{ day.mealSuggestions.join('、') }}
    </p>
    <p v-if="day.hotelAreaSuggestion" class="extra">🏨 住宿区域：{{ day.hotelAreaSuggestion }}</p>
    <ul v-if="(day.drivingOrTransportTips || []).length" class="tips">
      <li v-for="(t, i) in day.drivingOrTransportTips" :key="i">{{ t }}</li>
    </ul>
  </div>
</template>

<style scoped>
.day-card {
  padding: 18px;
  background: var(--travel-card);
  border: 1px solid var(--travel-border);
  border-radius: 12px;
  margin-bottom: 14px;
}
.day-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.day-num {
  background: var(--travel-primary);
  color: #fff;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 999px;
  font-weight: 600;
  flex-shrink: 0;
}
.day-head h4 { margin: 0; font-size: 16px; }
.route-line { margin: 0 0 6px; font-size: 13px; font-weight: 500; }
.summary { margin: 0 0 10px; font-size: 13px; line-height: 1.6; color: var(--travel-text-secondary); }
.stats { display: flex; gap: 14px; font-size: 12px; color: var(--travel-text-secondary); margin-bottom: 12px; }
.timeline { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
.tl-item { display: grid; grid-template-columns: 52px 64px 1fr; gap: 8px; align-items: start; font-size: 13px; }
.time { color: var(--travel-primary); font-weight: 600; }
.tl-body p { margin: 4px 0 0; color: var(--travel-text-secondary); line-height: 1.5; }
.spots { margin-bottom: 10px; }
.spots-label { font-size: 12px; color: var(--travel-text-secondary); display: block; margin-bottom: 6px; }
.spot-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.spot-chip { display: flex; align-items: center; gap: 6px; font-size: 12px; padding: 4px 8px 4px 4px; background: #f8fafc; border-radius: 8px; }
.spot-thumb { width: 40px; height: 28px; border-radius: 4px; overflow: hidden; flex-shrink: 0; }
.extra { margin: 4px 0; font-size: 13px; }
.tips { margin: 8px 0 0; padding-left: 18px; font-size: 12px; color: var(--travel-text-secondary); line-height: 1.55; }
@media (max-width: 600px) { .tl-item { grid-template-columns: 1fr; } }
</style>
