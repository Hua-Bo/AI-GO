<script setup lang="ts">
import type { DestinationIntent } from '@/types/travelTypes'
import SegmentedControl from './SegmentedControl.vue'

const destination = defineModel<DestinationIntent>('destination', { required: true })

const destTypeOptions = [
  { label: '城市', value: 'city' as const },
  { label: '区域方向', value: 'region' as const },
  { label: '景区', value: 'scenic' as const },
  { label: '大致方向', value: 'direction' as const },
]

const mustArriveOptions = [
  { label: '必须到达', value: true },
  { label: '只是参考', value: false },
]

const returnTripOptions = [
  { label: '需要返程', value: true },
  { label: '不需要', value: false },
]
</script>

<template>
  <div class="form-card destination-card">
    <div class="form-card-header">
      <span class="form-card-icon">🎯</span>
      <div>
        <div class="form-card-title">目标终点</div>
        <div class="form-card-desc">设置终点方向与返程偏好</div>
      </div>
    </div>

    <div class="form-field">
      <label class="form-label">终点 / 方向</label>
      <el-input
        v-model="destination.destinationText"
        placeholder="例如：青岛、厦门、西藏方向、川西、无锡周边"
      />
    </div>

    <div class="form-field">
      <label class="form-label">终点类型</label>
      <SegmentedControl
        v-model="destination.destinationType"
        :options="destTypeOptions"
        :cols="2"
        class-name="destination-type-options"
      />
    </div>

    <div class="form-field">
      <label class="form-label">到达要求</label>
      <SegmentedControl
        v-model="destination.mustArrive"
        :options="mustArriveOptions"
        :cols="2"
      />
    </div>

    <div class="form-field">
      <label class="form-label">返程规划</label>
      <SegmentedControl
        v-model="destination.returnTripNeeded"
        :options="returnTripOptions"
        :cols="2"
      />
    </div>

    <div v-if="destination.returnTripNeeded" class="form-field">
      <label class="form-label">返程回到哪里</label>
      <el-input v-model="destination.returnTo" placeholder="例如：无锡、南京、各回各家" />
    </div>

    <div class="form-field">
      <label class="form-label">补充说明</label>
      <el-input
        v-model="destination.extraNote"
        type="textarea"
        :rows="2"
        placeholder="例如：想沿途边走边玩；返程不要一天开完；不在广西境内过夜（可途经、勿停百色）"
      />
    </div>
  </div>
</template>

<style scoped>
@import './travel-form.css';

.destination-type-options :deep(.segmented-control) {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
</style>
