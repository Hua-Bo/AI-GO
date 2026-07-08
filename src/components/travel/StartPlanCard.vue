<script setup lang="ts">
import type { StartPlan } from '@/types/travelTypes'

defineProps<{ plan: StartPlan }>()
</script>

<template>
  <section class="start-plan-panel">
    <h3>出发方案</h3>

    <div class="highlight">
      <div class="from">从 <strong>{{ plan.fromAddress }}</strong> 出发</div>
      <div class="first-stop">第一站建议：<strong>{{ plan.firstStopCity || '—' }}</strong></div>
      <div class="time">建议出发时间：<strong>{{ plan.suggestedStartTime || '—' }}</strong></div>
      <div v-if="plan.duration || plan.distance" class="meta">
        <span v-if="plan.duration">耗时 {{ plan.duration }}</span>
        <span v-if="plan.distance">距离 {{ plan.distance }}</span>
      </div>
      <div class="cost">费用预估：{{ plan.costEstimate }}</div>
    </div>

    <p class="route-desc">{{ plan.routeDescription }}</p>

    <div v-if="(plan.transportTips || []).length" class="sub-block">
      <h4>交通建议</h4>
      <ul><li v-for="(t, i) in plan.transportTips" :key="i">{{ t }}</li></ul>
    </div>

    <div v-if="(plan.chargingTips || []).length" class="sub-block">
      <h4>电车补能建议</h4>
      <ul><li v-for="(t, i) in plan.chargingTips" :key="i">{{ t }}</li></ul>
    </div>

    <div v-if="(plan.fuelHighwayTips || []).length" class="sub-block">
      <h4>油费与高速费</h4>
      <ul><li v-for="(t, i) in plan.fuelHighwayTips" :key="i">{{ t }}</li></ul>
    </div>

    <div v-if="(plan.stationTransferTips || []).length" class="sub-block">
      <h4>车站 / 机场衔接</h4>
      <ul><li v-for="(t, i) in plan.stationTransferTips" :key="i">{{ t }}</li></ul>
    </div>
  </section>
</template>

<style scoped>
.start-plan-panel { margin-bottom: 24px; }
.start-plan-panel h3 {
  margin: 0 0 14px; font-size: 16px; font-weight: 600;
  padding-left: 10px; border-left: 3px solid var(--travel-primary);
}
.highlight {
  padding: 16px; background: #f0f9ff; border-radius: 12px;
  border: 1px solid #bae6fd; margin-bottom: 12px;
}
.from, .first-stop, .time { margin-bottom: 6px; font-size: 14px; }
.meta { display: flex; gap: 16px; font-size: 13px; color: var(--travel-text-secondary); margin: 8px 0; }
.cost { font-size: 13px; color: var(--travel-primary); font-weight: 600; }
.route-desc { font-size: 14px; line-height: 1.65; color: var(--travel-text-secondary); margin: 0 0 12px; }
.sub-block { margin-bottom: 12px; }
.sub-block h4 { margin: 0 0 6px; font-size: 13px; color: var(--travel-text-secondary); }
.sub-block ul { margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6; }
</style>
