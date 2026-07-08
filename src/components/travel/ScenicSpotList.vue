<script setup lang="ts">
import type { ScenicSpot } from '@/types/travelTypes'
import ScenicSpotCard from './ScenicSpotCard.vue'

defineProps<{
  spots: ScenicSpot[]
  selectedIds: string[]
  expandedId: string | null
  cityName: string
}>()

const emit = defineEmits<{
  toggleSpot: [id: string]
  toggleExpand: [id: string]
  selectTop: []
  clearSelected: []
}>()
</script>

<template>
  <div class="spot-list-panel">
    <div class="panel-head">
      <div>
        <h2>{{ cityName }} · 推荐景区</h2>
        <p class="sub">勾选景区加入攻略，图片来源于网络搜索接口</p>
      </div>
      <div class="toolbar">
        <span>已选 <strong>{{ selectedIds.length }}</strong> 个</span>
        <el-button size="small" @click="emit('selectTop')">一键选前 3 个</el-button>
        <el-button v-if="selectedIds.length" size="small" link @click="emit('clearSelected')">清空</el-button>
      </div>
    </div>
    <div class="spot-grid">
      <ScenicSpotCard
        v-for="spot in spots"
        :key="spot.id"
        :spot="spot"
        :selected="selectedIds.includes(spot.id)"
        :expanded="expandedId === spot.id"
        @toggle="emit('toggleSpot', spot.id)"
        @toggle-expand="emit('toggleExpand', spot.id)"
      />
    </div>
  </div>
</template>

<style scoped>
.spot-list-panel {
  background: var(--travel-card);
  border-radius: var(--travel-radius);
  border: 1px solid var(--travel-border);
  padding: 20px;
  margin-top: 20px;
}
.panel-head { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
.panel-head h2 { margin: 0; font-size: 18px; }
.sub { margin: 4px 0 0; font-size: 13px; color: var(--travel-text-secondary); }
.toolbar { display: flex; align-items: center; gap: 10px; font-size: 13px; }
.spot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
</style>
