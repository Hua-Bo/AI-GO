<script setup lang="ts">
import type { DailyPlan, DailyPlanItem } from '@/types/travelTypes'

const plans = defineModel<DailyPlan[]>('plans', { required: true })

const itemTypes = [
  { label: '交通', value: 'transport' },
  { label: '景区', value: 'scenic' },
  { label: '美食', value: 'food' },
  { label: '酒店', value: 'hotel' },
  { label: '自由活动', value: 'free' },
] as const

function addItem(dayIdx: number) {
  plans.value[dayIdx].items.push({
    time: '10:00',
    title: '新行程',
    type: 'free',
    description: '',
  })
}

function removeItem(dayIdx: number, itemIdx: number) {
  plans.value[dayIdx].items.splice(itemIdx, 1)
}
</script>

<template>
  <div class="daily-editor">
    <div v-for="(day, di) in plans" :key="day.day" class="day-block">
      <div class="day-head">
        <span class="day-num">第 {{ day.day }} 天</span>
        <el-input v-model="day.title" placeholder="当天标题" class="day-title-input" />
      </div>
      <div v-for="(item, ii) in day.items" :key="ii" class="item-row">
        <el-time-select v-model="item.time" start="06:00" step="00:30" end="23:00" placeholder="时间" style="width:100px" />
        <el-input v-model="item.title" placeholder="标题" style="flex:1" />
        <el-select v-model="item.type" style="width:110px">
          <el-option v-for="t in itemTypes" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
        <el-input v-model="item.description" placeholder="描述" style="flex:2" />
        <el-button type="danger" link @click="removeItem(di, ii)">删除</el-button>
      </div>
      <el-button size="small" @click="addItem(di)">+ 新增行程项</el-button>
    </div>
  </div>
</template>

<style scoped>
.daily-editor { display: flex; flex-direction: column; gap: 20px; }
.day-block { padding: 16px; background: #f8fafc; border-radius: 12px; border: 1px solid var(--travel-border); }
.day-head { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.day-num { font-weight: 600; white-space: nowrap; }
.day-title-input { flex: 1; }
.item-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; flex-wrap: wrap; }
</style>
