<script setup lang="ts">
import type { MeetingPlan } from '@/types/travelTypes'
import { TRANSPORT_OPTIONS } from '@/types/travelTypes'

defineProps<{
  meeting: MeetingPlan
}>()

function transportIcon(type: string) {
  return TRANSPORT_OPTIONS.find((t) => t.value === type)?.icon || '🚗'
}
</script>

<template>
  <section class="meeting-panel">
    <h3>推荐集合点</h3>
    <div class="meeting-head">
      <div class="city-badge">{{ meeting.meetingCity }}</div>
      <span v-if="meeting.province" class="province">{{ meeting.province }}</span>
    </div>
    <p class="reason">{{ meeting.reason }}</p>
    <div class="meta-row">
      <span>🕐 建议集合时间：{{ meeting.suggestedMeetingTime || '—' }}</span>
      <span>📍 集合地点：{{ meeting.meetingLocationSuggestion || '—' }}</span>
    </div>

    <h4>各出发地 → 集合点</h4>
    <div class="route-cards">
      <div v-for="(r, i) in (meeting.departureRoutes || [])" :key="i" class="route-card">
        <div class="route-head">
          <span class="icon">{{ transportIcon(r.transportType) }}</span>
          <strong>{{ r.fromAddress || r.fromCity }} → {{ r.toMeetingCity }}</strong>
        </div>
        <p class="desc">{{ r.routeDescription }}</p>
        <div class="stats">
          <span v-if="r.distance">📏 {{ r.distance }}</span>
          <span>⏱ {{ r.duration }}</span>
          <span>💰 {{ r.costEstimate }}</span>
        </div>
        <p v-if="r.transferSuggestion" class="sub">换乘：{{ r.transferSuggestion }}</p>
        <p v-if="r.chargingSuggestion" class="sub charge">充电：{{ r.chargingSuggestion }}</p>
        <ul v-if="(r.drivingTips || []).length">
          <li v-for="(t, j) in r.drivingTips" :key="j">{{ t }}</li>
        </ul>
      </div>
    </div>

    <ul v-if="(meeting.tips || []).length" class="tips">
      <li v-for="(t, i) in meeting.tips" :key="i">{{ t }}</li>
    </ul>
  </section>
</template>

<style scoped>
.meeting-panel { margin-bottom: 24px; }
.meeting-panel h3 { margin: 0 0 14px; font-size: 16px; font-weight: 600; padding-left: 10px; border-left: 3px solid var(--travel-primary); }
.meeting-panel h4 { margin: 16px 0 10px; font-size: 14px; }
.meeting-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.city-badge { font-size: 22px; font-weight: 700; color: var(--travel-primary); }
.province { font-size: 13px; color: var(--travel-text-secondary); }
.reason { margin: 0 0 10px; line-height: 1.65; font-size: 14px; color: var(--travel-text-secondary); }
.meta-row { display: flex; flex-wrap: wrap; gap: 16px; font-size: 13px; margin-bottom: 8px; }
.route-cards { display: flex; flex-direction: column; gap: 10px; }
.route-card { padding: 14px; background: #f8fafc; border-radius: 10px; border: 1px solid var(--travel-border); font-size: 13px; }
.route-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.icon { font-size: 18px; }
.desc { margin: 0 0 8px; line-height: 1.55; }
.stats { display: flex; flex-wrap: wrap; gap: 12px; color: var(--travel-text-secondary); margin-bottom: 4px; }
.sub { margin: 4px 0; font-size: 12px; color: var(--travel-text-secondary); }
.charge { color: #059669; }
.route-card ul { margin: 6px 0 0; padding-left: 18px; font-size: 12px; color: var(--travel-text-secondary); }
.tips { margin: 12px 0 0; padding-left: 20px; font-size: 13px; line-height: 1.6; }
</style>
