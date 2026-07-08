<script setup lang="ts">
import type { DetailedMeetingPlan } from '@/types/travelTypes'
import { TRANSPORT_OPTIONS } from '@/types/travelTypes'

defineProps<{ meeting: DetailedMeetingPlan }>()

function transportIcon(type: string) {
  return TRANSPORT_OPTIONS.find((t) => t.value === type)?.icon || '🚗'
}
</script>

<template>
  <section class="meeting-panel">
    <h3>推荐集合点</h3>

    <div class="meeting-highlight">
      <div class="city">{{ meeting.meetingCity }}</div>
      <div class="place">{{ meeting.meetingPlaceName || '—' }}</div>
      <div v-if="meeting.meetingPlaceAddress" class="addr">📍 {{ meeting.meetingPlaceAddress }}</div>
      <div class="time">🕐 建议集合时间：<strong>{{ meeting.suggestedMeetingTime || '—' }}</strong></div>
    </div>

    <div class="reason-block">
      <h4>为什么在这里集合</h4>
      <p>{{ meeting.reason || '—' }}</p>
    </div>

    <div v-if="(meeting.whyNotOtherCities || []).length" class="sub-block">
      <h4>为什么不选其他城市</h4>
      <ul><li v-for="(w, i) in meeting.whyNotOtherCities" :key="i">{{ w }}</li></ul>
    </div>

    <div v-if="(meeting.nearbyFacilities || []).length" class="sub-block">
      <h4>周边设施</h4>
      <el-tag v-for="(f, i) in meeting.nearbyFacilities" :key="i" size="small" class="fac-tag">{{ f }}</el-tag>
    </div>

    <p v-if="meeting.parkingInfo" class="info-line">🅿️ 停车：{{ meeting.parkingInfo }}</p>
    <p v-if="meeting.publicTransportInfo" class="info-line">🚇 公共交通：{{ meeting.publicTransportInfo }}</p>

    <h4 class="routes-title">各出发地 → 集合点</h4>
    <div class="route-cards">
      <div v-for="(r, i) in (meeting.departureRoutes || [])" :key="i" class="route-card">
        <div class="route-head">
          <span class="icon">{{ transportIcon(r.transportType) }}</span>
          <strong>{{ r.fromAddress }} → {{ r.toMeetingPlace || r.toMeetingCity }}</strong>
        </div>
        <div class="time-row">
          <span>出发 {{ r.suggestedStartTime || '—' }}</span>
          <span>到达 {{ r.estimatedArrivalTime || '—' }}</span>
          <span>{{ r.duration }}</span>
          <span v-if="r.distance">{{ r.distance }}</span>
        </div>
        <p class="desc">{{ r.routeDescription }}</p>

        <table v-if="r.costDetail" class="cost-table">
          <tr v-if="r.costDetail.fuelCost"><td>油费</td><td>{{ r.costDetail.fuelCost }}</td></tr>
          <tr v-if="r.costDetail.chargingCost"><td>充电费</td><td>{{ r.costDetail.chargingCost }}</td></tr>
          <tr v-if="r.costDetail.highwayCost"><td>高速费</td><td>{{ r.costDetail.highwayCost }}</td></tr>
          <tr v-if="r.costDetail.trainTicket"><td>高铁票</td><td>{{ r.costDetail.trainTicket }}</td></tr>
          <tr v-if="r.costDetail.flightTicket"><td>机票</td><td>{{ r.costDetail.flightTicket }}</td></tr>
          <tr v-if="r.costDetail.taxiCost"><td>打车</td><td>{{ r.costDetail.taxiCost }}</td></tr>
          <tr class="total-row"><td><strong>合计</strong></td><td><strong>{{ r.costDetail.total }}</strong></td></tr>
        </table>

        <ol v-if="(r.routeSteps || []).length" class="steps">
          <li v-for="(step, j) in r.routeSteps" :key="j">{{ step }}</li>
        </ol>

        <div v-if="r.chargingPlan?.needCharge" class="charge-box">
          <strong>充电建议</strong>
          <p v-if="(r.chargingPlan.suggestedChargingCities || []).length">
            建议补能：{{ r.chargingPlan.suggestedChargingCities.join('、') }}
          </p>
          <ul v-if="(r.chargingPlan.chargingTips || []).length">
            <li v-for="(t, j) in r.chargingPlan.chargingTips" :key="j">{{ t }}</li>
          </ul>
        </div>

        <p v-if="r.transferSuggestion" class="sub">换乘：{{ r.transferSuggestion }}</p>
        <ul v-if="(r.drivingTips || []).length" class="tips">
          <li v-for="(t, j) in r.drivingTips" :key="j">{{ t }}</li>
        </ul>
      </div>
    </div>

    <ul v-if="(meeting.meetingTips || []).length" class="meeting-tips">
      <li v-for="(t, i) in meeting.meetingTips" :key="i">{{ t }}</li>
    </ul>
  </section>
</template>

<style scoped>
.meeting-panel { margin-bottom: 24px; }
.meeting-panel h3 { margin: 0 0 14px; font-size: 16px; font-weight: 600; padding-left: 10px; border-left: 3px solid var(--travel-primary); }
.meeting-highlight { padding: 16px; background: linear-gradient(135deg,#eff6ff,#f0f9ff); border-radius: 12px; margin-bottom: 16px; }
.city { font-size: 24px; font-weight: 700; color: var(--travel-primary); }
.place { font-size: 16px; margin: 4px 0; font-weight: 500; }
.addr, .time { font-size: 13px; color: var(--travel-text-secondary); margin-top: 6px; }
.reason-block, .sub-block { margin-bottom: 14px; }
.reason-block h4, .sub-block h4, .routes-title { margin: 0 0 8px; font-size: 14px; }
.reason-block p { margin: 0; line-height: 1.65; font-size: 14px; color: var(--travel-text-secondary); }
.sub-block ul { margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6; }
.fac-tag { margin: 0 6px 6px 0; }
.info-line { font-size: 13px; margin: 6px 0; }
.routes-title { margin-top: 16px; }
.route-cards { display: flex; flex-direction: column; gap: 12px; }
.route-card { padding: 16px; background: #f8fafc; border-radius: 12px; border: 1px solid var(--travel-border); font-size: 13px; }
.route-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.icon { font-size: 20px; }
.time-row { display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; color: var(--travel-text-secondary); margin-bottom: 8px; }
.desc { margin: 0 0 10px; line-height: 1.55; }
.cost-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 10px; }
.cost-table td { padding: 6px 10px; border-bottom: 1px solid var(--travel-border); }
.total-row td { border-top: 2px solid var(--travel-border); }
.steps { margin: 8px 0; padding-left: 20px; font-size: 12px; line-height: 1.55; }
.charge-box { padding: 10px; background: #ecfdf5; border-radius: 8px; margin: 8px 0; font-size: 12px; }
.sub { font-size: 12px; color: var(--travel-text-secondary); }
.tips, .meeting-tips { margin: 8px 0 0; padding-left: 18px; font-size: 12px; line-height: 1.55; color: var(--travel-text-secondary); }
</style>
