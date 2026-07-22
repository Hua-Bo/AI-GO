<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SegmentedControl from './SegmentedControl.vue'

const accommodationMode = defineModel<'auto' | 'homeEveryDay' | 'hotelNeeded' | 'campingOrCar' | 'noHotelPreferred'>('accommodationMode', { required: false, default: 'auto' })
const homeBaseAddress = defineModel<string>('homeBaseAddress', { required: false, default: '' })
const maxReturnDistanceKm = defineModel<number>('maxReturnDistanceKm', { required: false, default: 80 })
const maxReturnDuration = defineModel<string>('maxReturnDuration', { required: false, default: '1.5小时' })
const accommodationNote = defineModel<string>('accommodationNote', { required: false, default: '' })
const hotelDays = defineModel<number[]>('hotelDays', { required: false, default: () => [] })
const hotelDayReason = defineModel<string>('hotelDayReason', { required: false, default: '洗衣洗烘，补充补给' })

const props = defineProps<{
  localTripDetected?: boolean
  travelDays?: number
}>()

const accommodationOptions = [
  { label: '智能判断', value: 'auto' as const },
  { label: '不住酒店，当天返回', value: 'homeEveryDay' as const },
  { label: '想住一晚，推荐酒店', value: 'hotelNeeded' as const },
  { label: '尽量不住酒店', value: 'noHotelPreferred' as const },
  { label: '露营/车宿', value: 'campingOrCar' as const },
]

const distancePresets = [50, 80, 120] as const
const presetSet = new Set<number>(distancePresets)
const useCustomDistance = ref(!presetSet.has(maxReturnDistanceKm.value))

const durationOptions = [
  { label: '1小时', value: '1小时以内' },
  { label: '1.5小时', value: '1.5小时' },
  { label: '2小时', value: '2小时' },
]

const showHomeStayHint = computed(() =>
  accommodationMode.value === 'homeEveryDay' || accommodationMode.value === 'noHotelPreferred',
)
const showHotelHint = computed(() => accommodationMode.value === 'hotelNeeded')
const showCampingHotelPicker = computed(() =>
  accommodationMode.value === 'campingOrCar' || accommodationMode.value === 'noHotelPreferred',
)

const dayOptions = computed(() => {
  const total = Math.max(props.travelDays || 1, 1)
  return Array.from({ length: total }, (_, i) => i + 1)
})

watch(
  () => props.travelDays,
  (days) => {
    const max = Math.max(days || 1, 1)
    hotelDays.value = (hotelDays.value || []).filter((d) => d >= 1 && d <= max)
  },
)

function toggleHotelDay(day: number) {
  const set = new Set(hotelDays.value || [])
  if (set.has(day)) set.delete(day)
  else set.add(day)
  hotelDays.value = [...set].sort((a, b) => a - b)
}

function selectDistance(km: number) {
  useCustomDistance.value = false
  maxReturnDistanceKm.value = km
}

function enableCustomDistance() {
  useCustomDistance.value = true
}
</script>

<template>
  <div class="form-card accommodation-card">
    <div class="form-card-header">
      <span class="form-card-icon">🏠</span>
      <div>
        <div class="form-card-title">住宿方式</div>
        <div class="form-card-desc">车宿/露营可指定某天住酒店洗衣洗烘</div>
      </div>
    </div>

    <div v-if="localTripDetected && accommodationMode !== 'hotelNeeded' && accommodationMode !== 'campingOrCar'" class="smart-tip-card">
      <span>✅</span>
      <div>
        <strong>已识别本地/周边短途</strong>
        <p>AI 将优先安排回家过夜，不默认推荐酒店。</p>
      </div>
    </div>

    <div class="form-field">
      <label class="form-label">住宿策略</label>
      <SegmentedControl
        v-model="accommodationMode"
        :options="accommodationOptions"
        :cols="2"
        class-name="accommodation-options"
      />
      <div v-if="showHomeStayHint" class="info-tip-card success">
        已启用本地短途不住酒店策略，AI 将优先安排回家过夜。
      </div>
      <div v-if="showHotelHint" class="info-tip-card info">
        AI 会根据路线推荐住宿城市和区域。
      </div>
      <div v-if="accommodationMode === 'campingOrCar'" class="info-tip-card info">
        默认睡车/露营；可在下方勾选需要住酒店的天数（如洗烘衣服）。
      </div>
    </div>

    <div v-if="showCampingHotelPicker" class="form-field">
      <label class="form-label">指定住酒店的天数（可选）</label>
      <div class="day-chips">
        <button
          v-for="day in dayOptions"
          :key="day"
          type="button"
          class="day-chip"
          :class="{ active: (hotelDays || []).includes(day) }"
          @click="toggleHotelDay(day)"
        >
          第{{ day }}天
        </button>
      </div>
      <el-input
        v-if="(hotelDays || []).length"
        v-model="hotelDayReason"
        class="hotel-reason"
        placeholder="住酒店原因，例如：洗衣洗烘、洗澡补给"
      />
      <p class="form-help">
        例如 3-5 天车宿时，可勾选第 3 天住酒店，用酒店洗衣洗烘。
      </p>
    </div>

    <div class="form-field">
      <label class="form-label">常住地 / 回家地址</label>
      <el-input v-model="homeBaseAddress" placeholder="例如：无锡滨湖区" />
    </div>

    <div class="form-field">
      <label class="form-label">可接受单程回家距离</label>
      <div class="segmented-control cols-4 distance-options">
        <button
          v-for="km in distancePresets"
          :key="km"
          type="button"
          class="segmented-item"
          :class="{ active: !useCustomDistance && maxReturnDistanceKm === km }"
          @click="selectDistance(km)"
        >
          {{ km }}km
        </button>
        <button
          type="button"
          class="segmented-item"
          :class="{ active: useCustomDistance }"
          @click="enableCustomDistance"
        >
          自定义
        </button>
      </div>
      <el-input-number
        v-if="useCustomDistance"
        v-model="maxReturnDistanceKm"
        :min="20"
        :max="300"
        class="custom-distance-input"
      />
    </div>

    <div class="form-field">
      <label class="form-label">可接受单程回家时长</label>
      <SegmentedControl v-model="maxReturnDuration" :options="durationOptions" :cols="3" />
    </div>

    <div class="form-field">
      <label class="form-label">住宿补充</label>
      <el-input
        v-model="accommodationNote"
        type="textarea"
        :rows="2"
        placeholder="例如：电车睡车里，第3天住酒店洗衣；或住滨湖区晚上回家睡"
      />
    </div>
  </div>
</template>

<style scoped>
@import './travel-form.css';

.accommodation-options :deep(.segmented-control) {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.distance-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
}

.distance-options .segmented-item {
  min-width: 0;
  height: 36px;
  padding: 0 10px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: all .16s ease;
}

.distance-options .segmented-item:hover {
  border-color: #93c5fd;
  color: #2563eb;
}

.distance-options .segmented-item.active {
  border-color: #2563eb;
  background: linear-gradient(135deg, #2563eb, #06b6d4);
  color: #fff;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.22);
}

.custom-distance-input {
  margin-top: 8px;
  width: 100%;
}

.day-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.day-chip {
  min-height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.day-chip.active {
  border-color: #2563eb;
  background: #eff6ff;
  color: #1d4ed8;
}

.hotel-reason {
  margin-top: 8px;
}

.info-tip-card {
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 14px;
  font-size: 12px;
  line-height: 1.5;
}

.info-tip-card.success {
  background: #ecfdf5;
  border: 1px solid #bbf7d0;
  color: #047857;
}

.info-tip-card.info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
}

@media (max-width: 900px) {
  .distance-options {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .distance-options .segmented-item {
    height: auto !important;
    min-height: 46px !important;
    padding: 12px 16px !important;
    font-size: 16px !important;
    white-space: normal;
  }
  .info-tip-card {
    font-size: 16px;
    line-height: 1.65;
  }
}
</style>
