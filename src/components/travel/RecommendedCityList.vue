<script setup lang="ts">
import type { RecommendedCity } from '@/types/travelTypes'
import RecommendedCityCard from './RecommendedCityCard.vue'

defineProps<{
  cities: RecommendedCity[]
  selectedCityId: string | null
  isDirectionMode?: boolean
}>()

const emit = defineEmits<{
  selectCity: [id: string]
  viewSpots: [id: string]
  generate: []
}>()
</script>

<template>
  <div class="city-list-panel">
    <h2>{{ isDirectionMode ? '方向推荐城市' : 'AI 推荐目的地' }}</h2>
    <p class="sub">{{ isDirectionMode ? '围绕您填写的方向/终点推荐' : '根据出发地、交通方式、天数与偏好智能推荐' }}</p>
    <div class="city-grid">
      <RecommendedCityCard
        v-for="city in cities"
        :key="city.id"
        :city="city"
        :selected="selectedCityId === city.id"
        :is-direction-mode="isDirectionMode"
        @select="emit('selectCity', city.id)"
        @view-spots="emit('viewSpots', city.id)"
        @generate="emit('generate')"
      />
    </div>
  </div>
</template>

<style scoped>
.city-list-panel {
  background: var(--travel-card);
  border-radius: var(--travel-radius);
  border: 1px solid var(--travel-border);
  padding: 20px;
  margin-top: 20px;
}
.city-list-panel h2 { margin: 0; font-size: 18px; }
.sub { margin: 6px 0 16px; font-size: 13px; color: var(--travel-text-secondary); }
.city-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  align-items: stretch;
}
</style>
