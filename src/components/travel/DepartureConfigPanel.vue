<script setup lang="ts">
import type { DeparturePoint } from '@/types/travelTypes'
import DeparturePointForm from './DeparturePointForm.vue'

const departurePoints = defineModel<DeparturePoint[]>('departurePoints', { required: true })
const emit = defineEmits<{ addDeparture: []; removeDeparture: [id: string] }>()
</script>

<template>
  <div class="form-card departure-panel">
    <div class="form-card-header panel-head">
      <div class="head-left">
        <span class="form-card-icon">📍</span>
        <div>
          <div class="form-card-title">出发地</div>
          <div class="form-card-desc">支持多个出发地，AI 将推荐集合点</div>
        </div>
      </div>
      <el-button size="small" plain @click="emit('addDeparture')">+ 新增</el-button>
    </div>

    <DeparturePointForm
      v-for="(dep, idx) in departurePoints"
      :key="dep.id"
      v-model="departurePoints[idx]"
      :index="idx"
      :can-remove="departurePoints.length > 1"
      @remove="emit('removeDeparture', dep.id)"
    />
  </div>
</template>

<style scoped>
@import './travel-form.css';

.panel-head {
  justify-content: space-between;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
