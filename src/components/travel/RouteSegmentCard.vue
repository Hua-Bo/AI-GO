<script setup lang="ts">
import type { RouteSegment } from '@/types/travelTypes'

defineProps<{ segment: RouteSegment }>()

const sceneryLabel = { normal: '一般', good: '较好', excellent: '风景极佳' } as const
</script>

<template>
  <div class="segment-card">
    <div class="segment-head">
      <span v-if="segment.day" class="day-badge">第 {{ segment.day }} 天</span>
      <span class="route-line">{{ segment.from }} → {{ segment.to }}</span>
      <el-tag size="small" :type="segment.sceneryLevel === 'excellent' ? 'success' : 'info'">
        {{ sceneryLabel[segment.sceneryLevel] }}
      </el-tag>
    </div>
    <div class="meta">
      <span>📏 {{ segment.distanceText }}</span>
      <span>⏱ {{ segment.durationText }}</span>
    </div>
    <p class="transport">{{ segment.transportSuggestion }}</p>
    <ul v-if="segment.scenicPoints?.length" class="points">
      <li v-for="(p, i) in segment.scenicPoints" :key="i">沿途可玩：{{ p }}</li>
    </ul>
    <ul v-if="segment.tips.length" class="tips">
      <li v-for="(t, i) in segment.tips" :key="i">{{ t }}</li>
    </ul>
  </div>
</template>

<style scoped>
.segment-card {
  padding: 16px 18px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid var(--travel-border);
}
.segment-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
.day-badge {
  background: var(--travel-primary);
  color: #fff;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 999px;
  font-weight: 600;
}
.route-line { font-weight: 600; font-size: 15px; }
.meta { display: flex; gap: 16px; font-size: 13px; color: var(--travel-text-secondary); margin-bottom: 8px; }
.transport { font-size: 13px; margin: 0 0 8px; line-height: 1.5; }
.points, .tips { margin: 0; padding-left: 18px; font-size: 12px; color: var(--travel-text-secondary); line-height: 1.6; }
</style>
