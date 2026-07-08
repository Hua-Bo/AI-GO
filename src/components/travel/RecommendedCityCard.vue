<script setup lang="ts">
import { ref } from 'vue'
import type { RecommendedCity } from '@/types/travelTypes'
import ScenicImage from './ScenicImage.vue'

defineProps<{
  city: RecommendedCity
  selected: boolean
  isDirectionMode?: boolean
}>()

const emit = defineEmits<{
  select: []
  viewSpots: []
  generate: []
}>()

const reasonExpanded = ref(false)
</script>

<template>
  <div class="city-card" :class="{ selected }">
    <div class="cover-wrap">
      <ScenicImage :src="city.coverImage" :alt="city.cityName" />
      <div class="cover-overlay">
        <div class="badges">
          <el-tag v-if="isDirectionMode && city.cityRole === 'destination'" size="small" type="warning">终点城市</el-tag>
          <el-tag v-else-if="isDirectionMode && city.cityRole === 'stopover'" size="small">沿途城市</el-tag>
        </div>
        <h3>{{ city.cityName }}</h3>
        <span>{{ city.province }}</span>
      </div>
    </div>
    <div class="body">
      <div class="tags">
        <el-tag v-for="t in (city.tags || [])" :key="t" size="small" effect="plain">{{ t }}</el-tag>
      </div>
      <p class="reason" :class="{ expanded: reasonExpanded }">{{ city.reason }}</p>
      <el-button v-if="city.reason.length > 120" link size="small" @click="reasonExpanded = !reasonExpanded">
        {{ reasonExpanded ? '收起' : '展开推荐理由' }}
      </el-button>
      <div class="meta-grid">
        <div><span>适合天数</span><strong>{{ city.suitableDays }}</strong></div>
        <div><span>交通</span><strong>{{ city.bestTransportSummary }}</strong></div>
        <div><span>距离</span><strong>{{ city.distanceSummary }}</strong></div>
        <div><span>预算</span><strong>{{ city.estimatedCost }}</strong></div>
      </div>
      <p class="spot-count">推荐 {{ city.scenicSpots.length }} 个景区</p>
      <div class="actions">
        <el-button type="primary" @click="emit('select')">选择该城市</el-button>
        <el-button @click="emit('viewSpots')">查看景区</el-button>
        <el-button type="success" plain @click="emit('generate')">生成攻略</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.city-card {
  display: flex;
  flex-direction: column;
  border-radius: var(--travel-radius);
  overflow: hidden;
  border: 2px solid var(--travel-border);
  background: var(--travel-card);
  transition: border-color 0.2s, box-shadow 0.2s;
  height: 100%;
}
.city-card.selected {
  border-color: var(--travel-primary);
  box-shadow: 0 8px 28px rgba(37, 99, 235, 0.15);
}
.cover-wrap { position: relative; aspect-ratio: 16/9; flex-shrink: 0; }
.cover-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.65), transparent 55%);
  display: flex; flex-direction: column; justify-content: flex-end;
  padding: 16px; color: #fff; pointer-events: none;
}
.badges { margin-bottom: 6px; }
.cover-overlay h3 { margin: 0; font-size: 22px; }
.body { padding: 16px 18px 18px; display: flex; flex-direction: column; flex: 1; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.reason {
  font-size: 13px; line-height: 1.65; color: var(--travel-text-secondary); margin: 0 0 8px;
  display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;
}
.reason.expanded { -webkit-line-clamp: unset; display: block; }
.meta-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; font-size: 12px;
}
.meta-grid span { display: block; color: var(--travel-text-secondary); margin-bottom: 2px; }
.spot-count { font-size: 13px; color: var(--travel-primary); margin: 0 0 12px; font-weight: 500; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: auto; }
</style>
