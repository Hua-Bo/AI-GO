<script setup lang="ts">
import type { DailyScenicSpot } from '@/types/travelTypes'
import ScenicImage from './ScenicImage.vue'

defineProps<{
  spots: DailyScenicSpot[]
}>()
</script>

<template>
  <section v-if="spots.length" class="scenic-summary">
    <h3>景区汇总</h3>
    <div class="grid">
      <div v-for="(s, i) in spots" :key="i" class="spot-card">
        <div v-if="s.image" class="img-wrap"><ScenicImage :src="s.image" :alt="s.name" /></div>
        <div class="body">
          <strong>{{ s.name }}</strong>
          <span class="city">{{ s.city }}</span>
          <p class="reason">{{ s.reason }}</p>
          <div class="meta">
            <span>⏱ {{ s.suggestedDuration }}</span>
            <span v-if="s.ticketPrice">🎫 {{ s.ticketPrice }}</span>
          </div>
          <div v-if="(s.tags || []).length" class="tags">
            <el-tag v-for="t in s.tags" :key="t" size="small" effect="plain">{{ t }}</el-tag>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.scenic-summary { margin-bottom: 24px; }
.scenic-summary h3 { margin: 0 0 14px; font-size: 16px; font-weight: 600; padding-left: 10px; border-left: 3px solid var(--travel-primary); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
.spot-card { border: 1px solid var(--travel-border); border-radius: 12px; overflow: hidden; background: var(--travel-card); }
.img-wrap { aspect-ratio: 16/9; }
.body { padding: 12px 14px; }
.body strong { display: block; font-size: 15px; }
.city { font-size: 12px; color: var(--travel-text-secondary); }
.reason { font-size: 12px; color: var(--travel-text-secondary); margin: 6px 0; line-height: 1.5; }
.meta { font-size: 12px; color: var(--travel-text-secondary); display: flex; gap: 12px; margin-bottom: 6px; }
.tags { display: flex; flex-wrap: wrap; gap: 4px; }
</style>
