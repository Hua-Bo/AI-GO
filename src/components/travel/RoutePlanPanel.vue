<script setup lang="ts">
import type { RoutePlan } from '@/types/travelTypes'
import { CAR_TYPE_OPTIONS, TRANSPORT_OPTIONS } from '@/types/travelTypes'

defineProps<{
  plans: RoutePlan[]
  destination: string
}>()

const transportLabel = Object.fromEntries(TRANSPORT_OPTIONS.map((o) => [o.value, o.label]))
const carLabel = Object.fromEntries(CAR_TYPE_OPTIONS.map((o) => [o.value, o.label]))
</script>

<template>
  <div v-if="plans.length" class="route-panel">
    <h2>交通路线方案 · {{ destination }}</h2>
    <div class="route-list">
      <div v-for="(r, i) in plans" :key="i" class="route-card">
        <div class="route-head">
          <span>{{ r.fromAddress }}</span>
          <span class="arrow">→</span>
          <span>{{ r.toCity }}</span>
          <el-tag size="small">{{ transportLabel[r.transportType] }}</el-tag>
          <el-tag v-if="r.carType" size="small" type="info">{{ carLabel[r.carType] }}</el-tag>
        </div>
        <div class="route-meta">
          <span>{{ r.distance }}</span>
          <span>{{ r.duration }}</span>
          <span>{{ r.costRange }}</span>
        </div>
        <ul class="tips">
          <li v-for="(t, j) in r.routeTips" :key="j">{{ t }}</li>
        </ul>
      </div>
    </div>
    <el-alert type="info" :closable="false" show-icon title="多出发地汇合" description="推荐在目的地市区首日 14:00 前汇合；高铁/飞机伙伴可先到，自驾错开高峰。" />
  </div>
</template>

<style scoped>
.route-panel {
  background: var(--travel-card);
  border-radius: var(--travel-radius);
  border: 1px solid var(--travel-border);
  padding: 20px;
  margin-top: 20px;
}
.route-panel h2 { margin: 0 0 16px; font-size: 18px; }
.route-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
.route-card { padding: 14px 16px; border-radius: 12px; background: #f8fafc; border: 1px solid var(--travel-border); }
.route-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-weight: 600; }
.arrow { color: var(--travel-primary); }
.route-meta { display: flex; gap: 16px; margin: 8px 0; font-size: 13px; color: var(--travel-text-secondary); }
.tips { margin: 0; padding-left: 18px; font-size: 12px; color: var(--travel-text-secondary); line-height: 1.6; }
</style>
