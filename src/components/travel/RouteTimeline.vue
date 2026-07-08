<script setup lang="ts">
import type { RouteSegment } from '@/types/travelTypes'
import RouteSegmentCard from './RouteSegmentCard.vue'

defineProps<{
  segments: RouteSegment[]
  targetDestination: string
  departureSummary?: string
}>()
</script>

<template>
  <div class="route-timeline">
    <h2>沿途路线 · {{ targetDestination }}</h2>
    <p v-if="departureSummary" class="sub">{{ departureSummary }}</p>
    <div class="timeline">
      <RouteSegmentCard v-for="(seg, i) in segments" :key="i" :segment="seg" />
    </div>
  </div>
</template>

<style scoped>
.route-timeline {
  background: var(--travel-card);
  border-radius: var(--travel-radius);
  border: 1px solid var(--travel-border);
  padding: 20px;
  margin-top: 20px;
}
.route-timeline h2 { margin: 0; font-size: 18px; }
.sub { margin: 6px 0 16px; font-size: 13px; color: var(--travel-text-secondary); }
.timeline { display: flex; flex-direction: column; gap: 12px; }
</style>
