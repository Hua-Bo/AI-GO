<script setup lang="ts">
import type { DeparturePoint } from '@/types/travelTypes'
import { CAR_TYPE_OPTIONS, TRANSPORT_OPTIONS } from '@/types/travelTypes'

const model = defineModel<DeparturePoint>({ required: true })

defineProps<{ index: number; canRemove: boolean }>()
const emit = defineEmits<{ remove: [] }>()

function selectTransport(value: DeparturePoint['transportType']) {
  model.value.transportType = value
  if (value === 'selfDriving' && !model.value.carType) {
    model.value.carType = 'fuel'
  }
  if (value !== 'selfDriving') {
    model.value.carType = undefined
  }
}

function selectCarType(value: DeparturePoint['carType']) {
  model.value.carType = value
}

function changePeople(delta: number) {
  const next = model.value.peopleCount + delta
  model.value.peopleCount = Math.min(20, Math.max(1, next))
}

const carHint = {
  electric: '电车出行会优先考虑充电补能、服务区充电桩、续航安全。',
  fuel: '油车出行会估算油费、高速费和长途驾驶时长。',
} as const
</script>

<template>
  <div class="departure-card">
    <div class="departure-head">
      <span class="card-title">出发地 {{ index + 1 }}</span>
      <el-button v-if="canRemove" type="danger" link @click="emit('remove')">删除</el-button>
    </div>

    <div class="field">
      <label class="field-label">地址 / 城市</label>
      <el-input
        v-model="model.address"
        placeholder="请输入出发城市或详细地址，例如：无锡、南京南站、江苏省无锡市滨湖区"
        size="large"
      />
    </div>

    <div class="field">
      <label class="field-label">人数</label>
      <div class="people-stepper">
        <el-button :disabled="model.peopleCount <= 1" @click="changePeople(-1)">−</el-button>
        <span class="people-num">{{ model.peopleCount }}</span>
        <el-button :disabled="model.peopleCount >= 20" @click="changePeople(1)">+</el-button>
      </div>
    </div>

    <div class="field">
      <label class="field-label">交通方式</label>
      <div class="seg-row">
        <button
          v-for="o in TRANSPORT_OPTIONS"
          :key="o.value"
          type="button"
          class="seg-btn"
          :class="{ active: model.transportType === o.value }"
          @click="selectTransport(o.value)"
        >
          <span class="seg-icon">{{ o.icon }}</span>
          <span>{{ o.label }}</span>
        </button>
      </div>
    </div>

    <template v-if="model.transportType === 'selfDriving'">
      <div class="field">
        <label class="field-label">车辆类型</label>
        <div class="seg-row seg-row-sm">
          <button
            v-for="o in CAR_TYPE_OPTIONS"
            :key="o.value"
            type="button"
            class="seg-btn seg-btn-sm"
            :class="{ active: model.carType === o.value }"
            @click="selectCarType(o.value)"
          >
            {{ o.label }}
          </button>
        </div>
        <p v-if="model.carType" class="field-hint">{{ carHint[model.carType] }}</p>
      </div>
    </template>

    <template v-if="model.transportType === 'train'">
      <div class="field">
        <label class="field-label">建议填写出发站</label>
        <el-input v-model="model.departureStation" placeholder="例如：南京南站，可不填" />
      </div>
    </template>

    <template v-if="model.transportType === 'flight'">
      <div class="field">
        <label class="field-label">建议填写出发机场</label>
        <el-input v-model="model.departureAirport" placeholder="例如：上海虹桥机场，可不填" />
      </div>
    </template>

    <div class="field">
      <label class="field-label">出发时间</label>
      <el-date-picker
        v-model="model.startTime"
        type="datetime"
        placeholder="请选择出发时间"
        format="YYYY年MM月DD日 HH:mm"
        value-format="YYYY-MM-DD HH:mm"
        :clearable="true"
        style="width: 100%"
      />
    </div>

    <div class="field">
      <label class="field-label">备注</label>
      <el-input
        v-model="model.remark"
        type="textarea"
        :rows="2"
        placeholder="例如：希望上午出发、不要太赶、有老人同行"
      />
    </div>
  </div>
</template>

<style scoped>
.departure-card {
  padding: 14px;
  border-radius: 18px;
  background: linear-gradient(135deg, #f8fafc, #eff6ff);
  border: 1px solid #dbeafe;
  margin-bottom: 12px;
}
.departure-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}
.card-title { font-weight: 600; font-size: 16px; color: var(--travel-text); }
.field { margin-bottom: 18px; }
.field:last-child { margin-bottom: 0; }
.field-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--travel-text);
  margin-bottom: 8px;
}
.field-hint {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--travel-text-secondary);
  line-height: 1.5;
}
.seg-row { display: flex; flex-wrap: wrap; gap: 10px; }
.seg-row-sm { max-width: 280px; }
.seg-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 76px;
  padding: 14px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  color: var(--travel-text);
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}
.seg-btn-sm {
  flex-direction: row;
  min-width: 100px;
  padding: 10px 20px;
}
.seg-btn:hover { border-color: #93c5fd; }
.seg-btn.active {
  border-color: #60a5fa;
  background: linear-gradient(135deg, #eff6ff, #ecfeff);
  box-shadow: 0 10px 22px rgba(59, 130, 246, 0.16);
  font-weight: 600;
}
.seg-icon { font-size: 20px; line-height: 1; }
.people-stepper {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 1px solid var(--travel-border);
  border-radius: 10px;
  padding: 6px 12px;
}
.people-num {
  min-width: 32px;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
}

@media (max-width: 900px) {
  .card-title { font-size: 18px; }
  .field-label { font-size: 17px; margin-bottom: 10px; }
  .field-hint { font-size: 15px; line-height: 1.6; }
  .seg-btn {
    min-width: 88px;
    min-height: 72px;
    padding: 14px 12px;
    font-size: 15px;
  }
  .seg-btn-sm {
    min-height: 46px;
    min-width: 110px;
    font-size: 16px;
  }
  .seg-icon { font-size: 24px; }
  .people-stepper {
    min-height: 48px;
    padding: 8px 14px;
  }
  .people-num { font-size: 20px; }
}
</style>
