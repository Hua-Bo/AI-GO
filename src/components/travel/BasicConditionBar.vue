<script setup lang="ts">
import { BUDGET_OPTIONS, DAY_OPTIONS, OUTDOOR_PREF_OPTIONS, PACE_OPTIONS, THEME_OPTIONS } from '@/types/travelTypes'
import { computed, ref } from 'vue'

const travelDays = defineModel<number>('travelDays', { required: true })
const customDays = defineModel<number>('customDays', { required: true })
const useCustomDays = defineModel<boolean>('useCustomDays', { required: true })
const travelThemes = defineModel<string[]>('travelThemes', { required: true })
const budgetLevel = defineModel<'low' | 'medium' | 'high'>('budgetLevel', { required: true })
const pace = defineModel<'relaxed' | 'normal' | 'compact'>('pace', { required: true })
const withChildren = defineModel<boolean>('withChildren', { required: true })
const withElderly = defineModel<boolean>('withElderly', { required: true })
const avoidCrowded = defineModel<boolean>('avoidCrowded', { required: true })
const preferNaturalScenery = defineModel<boolean>('preferNaturalScenery', { required: true })
const preferFood = defineModel<boolean>('preferFood', { required: true })
const preferPhotoSpot = defineModel<boolean>('preferPhotoSpot', { required: true })
const preferFreeSpots = defineModel<boolean>('preferFreeSpots', { required: true })
const preferParks = defineModel<boolean>('preferParks', { required: true })
const preferCamping = defineModel<boolean>('preferCamping', { required: true })
const preferLakeside = defineModel<boolean>('preferLakeside', { required: true })
const preferForest = defineModel<boolean>('preferForest', { required: true })
const preferCityWalk = defineModel<boolean>('preferCityWalk', { required: true })
const preferLowCost = defineModel<boolean>('preferLowCost', { required: true })
const avoidTicketsExpensive = defineModel<boolean>('avoidTicketsExpensive', { required: true })
const preferDriveToSpot = defineModel<boolean>('preferDriveToSpot', { required: true })
const preferRiverside = defineModel<boolean>('preferRiverside', { required: true })
const preferWaterPlay = defineModel<boolean>('preferWaterPlay', { required: true })
const preferWildSpot = defineModel<boolean>('preferWildSpot', { required: true })
const preferEasyParking = defineModel<boolean>('preferEasyParking', { required: true })
const maxWalkDistance = defineModel<string>('maxWalkDistance', { required: true })

const outdoorMap = computed(() => ({
  preferFreeSpots: preferFreeSpots.value,
  preferParks: preferParks.value,
  preferCamping: preferCamping.value,
  preferLakeside: preferLakeside.value,
  preferForest: preferForest.value,
  preferCityWalk: preferCityWalk.value,
  preferLowCost: preferLowCost.value,
  avoidTicketsExpensive: avoidTicketsExpensive.value,
  preferDriveToSpot: preferDriveToSpot.value,
  preferRiverside: preferRiverside.value,
  preferWaterPlay: preferWaterPlay.value,
  preferWildSpot: preferWildSpot.value,
  preferEasyParking: preferEasyParking.value,
}))

function toggleOutdoor(key: keyof typeof outdoorMap.value) {
  const handlers: Record<string, () => void> = {
    preferFreeSpots: () => { preferFreeSpots.value = !preferFreeSpots.value },
    preferParks: () => { preferParks.value = !preferParks.value },
    preferCamping: () => { preferCamping.value = !preferCamping.value },
    preferLakeside: () => { preferLakeside.value = !preferLakeside.value },
    preferForest: () => { preferForest.value = !preferForest.value },
    preferCityWalk: () => { preferCityWalk.value = !preferCityWalk.value },
    preferLowCost: () => { preferLowCost.value = !preferLowCost.value },
    avoidTicketsExpensive: () => { avoidTicketsExpensive.value = !avoidTicketsExpensive.value },
    preferDriveToSpot: () => { preferDriveToSpot.value = !preferDriveToSpot.value },
    preferRiverside: () => { preferRiverside.value = !preferRiverside.value },
    preferWaterPlay: () => { preferWaterPlay.value = !preferWaterPlay.value },
    preferWildSpot: () => { preferWildSpot.value = !preferWildSpot.value },
    preferEasyParking: () => { preferEasyParking.value = !preferEasyParking.value },
  }
  handlers[key]?.()
}

const companionPrefs = computed(() => ([
  { key: 'withChildren', label: '👶 带孩子', value: withChildren.value },
  { key: 'withElderly', label: '🧓 带老人', value: withElderly.value },
  { key: 'avoidCrowded', label: '🙅 避开拥挤', value: avoidCrowded.value },
  { key: 'preferNaturalScenery', label: '🏞️ 自然风光', value: preferNaturalScenery.value },
  { key: 'preferFood', label: '🍜 美食优先', value: preferFood.value },
  { key: 'preferPhotoSpot', label: '📷 摄影出片', value: preferPhotoSpot.value },
]))

function toggleCompanion(key: string) {
  if (key === 'withChildren') withChildren.value = !withChildren.value
  if (key === 'withElderly') withElderly.value = !withElderly.value
  if (key === 'avoidCrowded') avoidCrowded.value = !avoidCrowded.value
  if (key === 'preferNaturalScenery') preferNaturalScenery.value = !preferNaturalScenery.value
  if (key === 'preferFood') preferFood.value = !preferFood.value
  if (key === 'preferPhotoSpot') preferPhotoSpot.value = !preferPhotoSpot.value
}

function toggleTheme(theme: string) {
  const idx = travelThemes.value.indexOf(theme)
  if (idx >= 0) travelThemes.value.splice(idx, 1)
  else travelThemes.value.push(theme)
}

const showMorePrefs = ref(false)
const coreOutdoorKeys = new Set(['preferFreeSpots', 'preferParks', 'preferWaterPlay', 'preferEasyParking'])
const coreOutdoorOptions = computed(() => OUTDOOR_PREF_OPTIONS.filter((opt) => coreOutdoorKeys.has(opt.key)))
const moreOutdoorOptions = computed(() => OUTDOOR_PREF_OPTIONS.filter((opt) => !coreOutdoorKeys.has(opt.key)))
</script>

<template>
  <div class="basic-bar">
    <div class="bar-section">
      <span class="bar-label">游玩天数</span>
      <div class="bar-content">
        <div class="day-pill-group">
          <button
            v-for="d in DAY_OPTIONS"
            :key="d"
            class="trip-chip"
            :class="{ active: !useCustomDays && travelDays === d }"
            @click="travelDays = d; useCustomDays = false"
          >
            {{ d }}天
          </button>
        </div>
        <button class="trip-chip custom" :class="{ active: useCustomDays }" @click="useCustomDays = !useCustomDays">自定义</button>
        <el-input-number v-if="useCustomDays" v-model="customDays" :min="1" :max="30" size="small" style="width: 120px" />
      </div>
    </div>

    <div class="bar-section">
      <span class="bar-label">旅游主题</span>
      <div class="bar-content trip-chip-group">
        <button
          v-for="t in THEME_OPTIONS.slice(0, 8)"
          :key="t"
          type="button"
          class="trip-chip"
          :class="{ active: travelThemes.includes(t) }"
          @click="toggleTheme(t)"
        >
          {{ t }}
        </button>
      </div>
    </div>

    <div class="bar-section">
      <span class="bar-label">免费 / 户外偏好</span>
      <div class="bar-content trip-chip-group">
        <button
          v-for="opt in coreOutdoorOptions"
          :key="opt.key"
          type="button"
          class="trip-chip"
          :class="{ active: outdoorMap[opt.key] }"
          @click="toggleOutdoor(opt.key)"
        >
          {{ opt.label }}
        </button>
        <button class="trip-chip more-toggle" :class="{ active: showMorePrefs }" @click="showMorePrefs = !showMorePrefs">
          {{ showMorePrefs ? '收起偏好' : '更多偏好' }}
        </button>
      </div>
      <div v-if="showMorePrefs" class="bar-content trip-chip-group more-pref-wrap">
        <button
          v-for="opt in moreOutdoorOptions"
          :key="opt.key"
          type="button"
          class="trip-chip"
          :class="{ active: outdoorMap[opt.key] }"
          @click="toggleOutdoor(opt.key)"
        >
          {{ opt.label }}
        </button>
      </div>
      <div class="bar-content walk-distance">
        <span class="walk-label">🚶 少走路范围</span>
        <el-select v-model="maxWalkDistance" size="small" style="width: 150px">
          <el-option label="0-200米" value="0-200米" />
          <el-option label="0-500米" value="0-500米" />
          <el-option label="500-1000米" value="500-1000米" />
          <el-option label="1公里以内均可" value="1公里以内均可" />
        </el-select>
      </div>
    </div>

    <div class="bar-section bar-row-2">
      <div class="bar-half">
        <span class="bar-label">预算</span>
        <el-radio-group v-model="budgetLevel" size="small" class="pill-radio">
          <el-radio-button v-for="o in BUDGET_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</el-radio-button>
        </el-radio-group>
      </div>
      <div class="bar-half">
        <span class="bar-label">节奏</span>
        <el-radio-group v-model="pace" size="small" class="pill-radio">
          <el-radio-button v-for="o in PACE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div class="bar-section">
      <span class="bar-label">偏好与同行</span>
      <div class="bar-content trip-chip-group">
        <button
          v-for="item in companionPrefs"
          :key="item.key"
          class="trip-chip"
          :class="{ active: item.value }"
          @click="toggleCompanion(item.key)"
        >
          {{ item.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.basic-bar {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.bar-section { display: flex; flex-direction: column; gap: 8px; }
.bar-row-2 { flex-direction: row; gap: 32px; flex-wrap: wrap; }
.bar-half { display: flex; flex-direction: column; gap: 8px; }
.bar-label { font-size: 13px; font-weight: 700; color: var(--travel-text-secondary); }
.bar-content { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.day-pill-group { display: flex; flex-wrap: wrap; gap: 10px; }
.trip-chip {
  min-width: 54px;
  height: 32px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 999px;
  border: 1px solid #dbeafe;
  background: rgba(255,255,255,0.92);
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all .18s ease;
}
.trip-chip:hover {
  transform: translateY(-1px);
  border-color: #93c5fd;
  box-shadow: 0 8px 18px rgba(37,99,235,0.12);
}
.trip-chip.active {
  color: #075985;
  border-color: #38bdf8;
  background: linear-gradient(135deg, #e0f2fe, #eff6ff);
  box-shadow: 0 10px 20px rgba(14,165,233,0.12);
}
.pill-radio :deep(.el-radio-button__inner) {
  border-radius: 999px !important;
}
.trip-chip-group { display: flex; flex-wrap: wrap; gap: 8px; }
.walk-distance {
  margin-top: 6px;
}
.walk-label {
  font-size: 12px;
  color: var(--travel-text-secondary);
}
.trip-chip.custom {
  border-style: dashed;
}
.trip-chip.custom.active {
  border-style: solid;
  font-weight: 600;
}
.more-pref-wrap { padding-top: 4px; }
.more-toggle { border-style: dashed; }
@media (max-width: 768px) { .bar-row-2 { flex-direction: column; gap: 16px; } }
</style>
