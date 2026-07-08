<script setup lang="ts">
import { computed } from 'vue'
import type { RouteIntent } from '@/types/travelTypes'
import { parseCommaSeparatedPlaces } from '@/types/travelTypes'

const routeIntent = defineModel<RouteIntent>('routeIntent', { required: true })

const isDirectionMode = computed(() => routeIntent.value.mode === 'directionOrDestination')

const mustPassText = computed({
  get: () => routeIntent.value.mustPassPlaces.join('、'),
  set: (v: string) => {
    routeIntent.value = { ...routeIntent.value, mustPassPlaces: parseCommaSeparatedPlaces(v) }
  },
})

const avoidText = computed({
  get: () => routeIntent.value.avoidPlaces.join('、'),
  set: (v: string) => {
    routeIntent.value = { ...routeIntent.value, avoidPlaces: parseCommaSeparatedPlaces(v) }
  },
})
</script>

<template>
  <div class="route-intent-panel">
    <h2 class="panel-title">路线意向</h2>

    <div class="field">
      <label class="field-label">规划方式</label>
      <el-radio-group v-model="routeIntent.mode" size="default">
        <el-radio-button value="aiRecommend">AI 自动推荐</el-radio-button>
        <el-radio-button value="directionOrDestination">我有大致方向 / 终点</el-radio-button>
      </el-radio-group>
    </div>

    <p v-if="!isDirectionMode" class="hint">
      AI 会根据出发地、交通方式、天数和偏好自动推荐合适城市。
    </p>

    <template v-else>
      <div class="field">
        <label class="field-label">大致方向 / 终点</label>
        <el-input
          v-model="routeIntent.directionText"
          placeholder="例如：青岛、厦门、西藏方向、川西方向、江浙沪附近"
        />
      </div>

      <div class="field-row">
        <div class="field">
          <label class="field-label">想顺路经过的地方（可选）</label>
          <el-input
            v-model="mustPassText"
            placeholder="例如：南京、连云港、淮安，用逗号分隔"
          />
        </div>
        <div class="field">
          <label class="field-label">不想去的地方（可选）</label>
          <el-input
            v-model="avoidText"
            placeholder="例如：商业古镇、爬山、排队严重"
          />
        </div>
      </div>

      <div class="field">
        <label class="field-label">补充说明（可选）</label>
        <el-input
          v-model="routeIntent.extraNote"
          type="textarea"
          :rows="2"
          placeholder="例如：想边走边玩，不想一天开太久，优先海边和美食"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.route-intent-panel {
  background: var(--travel-card);
  border-radius: var(--travel-radius);
  border: 1px solid var(--travel-border);
  padding: 16px 20px;
  margin-bottom: 16px;
}
.panel-title { margin: 0 0 12px; font-size: 16px; font-weight: 600; }
.field { margin-bottom: 12px; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field-label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; }
.hint {
  margin: 0;
  font-size: 13px;
  color: var(--travel-text-secondary);
  line-height: 1.6;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
}
@media (max-width: 768px) {
  .field-row { grid-template-columns: 1fr; }
}
</style>
