<script setup lang="ts">
import type { DepartureOverview } from '@/types/travelTypes'
import { TRANSPORT_OPTIONS } from '@/types/travelTypes'

defineProps<{ departures: DepartureOverview[] }>()

function transportLabel(type: string, car?: string) {
  const t = TRANSPORT_OPTIONS.find((o) => o.value === type)
  let label = t?.label || type
  if (type === 'selfDriving') label += car === 'electric' ? '（电车）' : car === 'fuel' ? '（油车）' : ''
  return label
}
</script>

<template>
  <section v-if="departures.length" class="dep-panel">
    <h3>多出发地概览</h3>
    <div class="dep-grid">
      <div v-for="d in departures" :key="d.id" class="dep-card">
        <strong>{{ d.fromAddress }}</strong>
        <div class="meta">
          <span>{{ d.peopleCount }} 人</span>
          <span>{{ transportLabel(d.transportType, d.carType) }}</span>
          <span v-if="d.suggestedStartTime">建议 {{ d.suggestedStartTime }} 出发</span>
        </div>
        <p v-if="d.roleInTrip" class="role">{{ d.roleInTrip }}</p>
        <ul v-if="(d.notes || []).length"><li v-for="(n, i) in d.notes" :key="i">{{ n }}</li></ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dep-panel { margin-bottom: 24px; }
.dep-panel h3 { margin: 0 0 14px; font-size: 16px; font-weight: 600; padding-left: 10px; border-left: 3px solid var(--travel-primary); }
.dep-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
.dep-card { padding: 14px; background: #f8fafc; border-radius: 10px; border: 1px solid var(--travel-border); font-size: 13px; }
.dep-card strong { display: block; margin-bottom: 6px; }
.meta { display: flex; flex-wrap: wrap; gap: 10px; color: var(--travel-text-secondary); font-size: 12px; }
.role { margin: 8px 0 4px; color: var(--travel-primary); font-size: 13px; }
.dep-card ul { margin: 6px 0 0; padding-left: 18px; font-size: 12px; color: var(--travel-text-secondary); }
</style>
