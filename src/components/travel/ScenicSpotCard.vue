<script setup lang="ts">
import type { ScenicSpot } from '@/types/travelTypes'
import ScenicImage from './ScenicImage.vue'

defineProps<{
  spot: ScenicSpot
  selected: boolean
  expanded: boolean
}>()

const emit = defineEmits<{ toggle: []; toggleExpand: [] }>()
</script>

<template>
  <div class="spot-card" :class="{ selected, expanded, 'no-image': !spot.image }">
    <div v-if="spot.image" class="spot-img-wrap" @click="emit('toggleExpand')">
      <ScenicImage
        :src="spot.image"
        :alt="spot.name"
        :name="spot.name"
        :city="spot.city"
        :image-keyword="spot.imageKeyword"
        class="spot-img-inner"
      />
      <el-checkbox class="spot-check" :model-value="selected" @click.stop @change="emit('toggle')" />
      <div class="spot-rating" v-if="spot.rating">★ {{ spot.rating }}</div>
    </div>
    <div class="spot-body">
      <div class="spot-head">
        <div class="spot-title-row">
          <el-checkbox
            v-if="!spot.image"
            class="spot-check-inline"
            :model-value="selected"
            @change="emit('toggle')"
          />
          <h3>{{ spot.name }}</h3>
        </div>
        <span class="city">{{ spot.cityName }}</span>
      </div>
      <div class="spot-tags">
        <el-tag v-for="t in (spot.tags || [])" :key="t" size="small" effect="plain">{{ t }}</el-tag>
      </div>
      <p class="reason">💡 {{ spot.reason }}</p>
      <p class="desc">{{ spot.description }}</p>
      <div class="meta">
        <span>⏱ {{ spot.recommendedDuration }}</span>
        <span>🎫 {{ spot.ticketPrice }}</span>
      </div>
      <div v-if="expanded" class="detail">
        <p><strong>最佳时间：</strong>{{ spot.bestTime }}</p>
        <p><strong>亮点：</strong>{{ (spot.highlights || []).join(' · ') }}</p>
        <p><strong>适合：</strong>{{ (spot.suitableFor || []).join('、') }}</p>
        <p v-if="spot.imageSource"><strong>图片来源：</strong>{{ spot.imageSource }}</p>
      </div>
      <el-button type="primary" link size="small" @click="emit('toggleExpand')">
        {{ expanded ? '收起' : '详情' }}
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.spot-card {
  border-radius: var(--travel-radius);
  overflow: hidden;
  border: 2px solid var(--travel-border);
  background: var(--travel-card);
  transition: border-color 0.2s;
}
.spot-card.selected { border-color: var(--travel-primary); }
.spot-img-wrap { position: relative; aspect-ratio: 16/9; cursor: pointer; }
.spot-img-inner { width: 100%; height: 100%; }
.spot-check { position: absolute; top: 10px; left: 10px; background: rgba(255,255,255,0.92); padding: 4px 8px; border-radius: 8px; }
.spot-rating { position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.55); color: #fff; padding: 4px 10px; border-radius: 999px; font-size: 13px; }
.spot-body { padding: 14px 16px; }
.spot-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.spot-title-row { display: flex; align-items: center; gap: 8px; min-width: 0; }
.spot-title-row h3 { margin: 0; font-size: 16px; }
.spot-check-inline { margin-right: 0; }
.spot-head h3 { margin: 0; font-size: 16px; }
.city { font-size: 12px; color: var(--travel-text-secondary); }
.spot-tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0; }
.reason { font-size: 12px; color: var(--travel-primary); margin: 0 0 8px; line-height: 1.5; }
.desc { font-size: 13px; color: var(--travel-text-secondary); margin: 0 0 8px; line-height: 1.5; }
.meta { font-size: 12px; color: var(--travel-text-secondary); display: flex; gap: 14px; margin-bottom: 8px; }
.detail { padding: 10px; background: #f8fafc; border-radius: 8px; font-size: 13px; margin-bottom: 8px; }
.detail p { margin: 0 0 4px; }
</style>
