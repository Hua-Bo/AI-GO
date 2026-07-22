<script setup lang="ts">
import type { CustomDailyEvent } from '@/types/travelTypes'

const specialPlaceHint = defineModel<string>('specialPlaceHint', { required: false, default: '' })
const customDailyEvents = defineModel<CustomDailyEvent[]>('customDailyEvents', {
  required: false,
  default: () => [],
})

const frequencyOptions: Array<{ label: string; value: CustomDailyEvent['frequency'] }> = [
  { label: '每天', value: 'daily' },
  { label: '最多隔1天', value: 'everyOtherDay' },
  { label: '住酒店那天', value: 'hotelLaundryDays' },
  { label: '至少一次', value: 'once' },
]

const presets: Array<Omit<CustomDailyEvent, 'id'>> = [
  {
    title: '洗澡吹头发',
    description: '最多间隔1天不洗澡；到城市后搜索24小时健身房带淋浴，团购单次卡，洗澡吹头发顺便健身',
    frequency: 'everyOtherDay',
    searchHint: '24小时健身房 带淋浴 团购单次卡',
    enabled: true,
  },
  {
    title: '酒店洗衣洗烘',
    description: '住酒店那天用酒店洗衣洗烘，补充干净衣服',
    frequency: 'hotelLaundryDays',
    searchHint: '酒店洗衣 洗烘一体',
    enabled: true,
  },
]

function uid() {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function addPreset(preset: Omit<CustomDailyEvent, 'id'>) {
  const exists = (customDailyEvents.value || []).some((e) => e.title === preset.title)
  if (exists) return
  customDailyEvents.value = [...(customDailyEvents.value || []), { ...preset, id: uid() }]
}

function addBlank() {
  customDailyEvents.value = [
    ...(customDailyEvents.value || []),
    {
      id: uid(),
      title: '',
      description: '',
      frequency: 'daily',
      searchHint: '',
      enabled: true,
    },
  ]
}

function removeEvent(id: string) {
  customDailyEvents.value = (customDailyEvents.value || []).filter((e) => e.id !== id)
}
</script>

<template>
  <div class="form-card">
    <div class="form-card-header">
      <span class="form-card-icon">✨</span>
      <div>
        <div class="form-card-title">偏好补充</div>
        <div class="form-card-desc">特殊点位 + 自定义每日事件</div>
      </div>
    </div>

    <div class="form-field">
      <label class="form-label">特殊点位 / 线索</label>
      <el-input
        v-model="specialPlaceHint"
        type="textarea"
        :rows="2"
        placeholder="例如：宜兴上厂村附近濉溪玩水点，车能开到河边、小众溪流、能露营"
      />
      <p class="form-help">AI 会优先参考你提供的具体地点线索。</p>
    </div>

    <div class="form-field">
      <label class="form-label">自定义每日事件</label>
      <div class="preset-row">
        <button
          v-for="p in presets"
          :key="p.title"
          type="button"
          class="preset-btn"
          @click="addPreset(p)"
        >
          + {{ p.title }}
        </button>
        <button type="button" class="preset-btn ghost" @click="addBlank">+ 自定义</button>
      </div>

      <div v-if="!(customDailyEvents || []).length" class="empty-hint">
        例如：每天要洗澡，最多隔1天；到城市找24小时健身房带淋浴，团购单次卡洗澡顺便健身。
      </div>

      <div
        v-for="(evt, index) in customDailyEvents"
        :key="evt.id"
        class="event-card"
      >
        <div class="event-head">
          <el-switch v-model="customDailyEvents[index].enabled" />
          <el-input v-model="customDailyEvents[index].title" placeholder="事件名称，如：洗澡" />
          <el-button text type="danger" @click="removeEvent(evt.id)">删除</el-button>
        </div>
        <el-select v-model="customDailyEvents[index].frequency" style="width: 100%">
          <el-option
            v-for="opt in frequencyOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-input
          v-model="customDailyEvents[index].description"
          type="textarea"
          :rows="2"
          placeholder="具体要求，例如：最多间隔1天不洗澡"
        />
        <el-input
          v-model="customDailyEvents[index].searchHint"
          placeholder="搜索线索：24小时健身房带淋浴 团购单次卡"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './travel-form.css';

.preset-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.preset-btn {
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.preset-btn.ghost {
  background: #fff;
  border-color: #e2e8f0;
  color: #475569;
}

.empty-hint {
  padding: 10px 12px;
  border-radius: 12px;
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
  line-height: 1.55;
}

.event-card {
  display: grid;
  gap: 8px;
  margin-top: 10px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
}

.event-head {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 8px;
  align-items: center;
}
</style>
