<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAgriStore } from '@/stores/agri'

const router = useRouter()
const store = useAgriStore()
const { crop } = storeToRefs(store)

const step = ref(0)
const draft = ref({
  name: crop.value.name || '',
  plantDate: crop.value.plantDate || '',
  growType: crop.value.growType || '' as '' | 'greenhouse' | 'open',
  area: crop.value.area || '',
  region: crop.value.region || '',
})

const steps = [
  { key: 'name', title: '种的是什么？', options: ['甜瓜', '西瓜', '番茄', '黄瓜', '辣椒', '其他'] },
  { key: 'growType', title: '怎么种的？', options: ['大棚', '露天'] },
  { key: 'area', title: '大概多大？', options: ['不到半亩', '半亩到一亩', '一亩以上'] },
  { key: 'region', title: '大概在哪里？', options: ['本村', '本县', '本市', '其他地区'] },
] as const

const current = computed(() => steps[step.value])
const nearlyDone = computed(() => step.value >= steps.length - 1)

function pick(option: string) {
  const key = current.value.key
  if (key === 'name') draft.value.name = option === '其他' ? '农作物' : option
  if (key === 'growType') draft.value.growType = option === '大棚' ? 'greenhouse' : 'open'
  if (key === 'area') draft.value.area = option
  if (key === 'region') draft.value.region = option

  if (nearlyDone.value) {
    save()
    return
  }
  step.value += 1
}

async function save() {
  if (!draft.value.plantDate) {
    draft.value.plantDate = new Date().toISOString().slice(0, 10)
  }
  await store.updateCrop({
    name: draft.value.name || '农作物',
    plantDate: draft.value.plantDate,
    growType: draft.value.growType || 'open',
    area: draft.value.area || '未填写',
    region: draft.value.region || '未填写',
  })
  router.replace('/agri-assistant')
}

function skip() {
  if (nearlyDone.value) {
    save()
    return
  }
  step.value += 1
}
</script>

<template>
  <main class="agri-page no-nav">
    <button type="button" class="agri-ghost-btn back" @click="router.back()">返回</button>
    <h1 class="agri-title">作物档案</h1>
    <p class="agri-subtitle">每次只问一件事，可以跳过</p>

    <div class="agri-card panel">
      <h2>{{ current.title }}</h2>
      <div class="opts">
        <button
          v-for="opt in current.options"
          :key="opt"
          type="button"
          class="opt"
          @click="pick(opt)"
        >
          {{ opt }}
        </button>
      </div>
      <button type="button" class="agri-secondary-btn" @click="skip">
        {{ nearlyDone ? '完成' : '跳过' }}
      </button>
    </div>

    <p class="progress">第 {{ step + 1 }} / {{ steps.length }} 步</p>
  </main>
</template>

<style scoped>
.back { padding-left: 0; margin-bottom: 8px; }
.panel h2 {
  margin: 0 0 16px;
  font-size: 22px;
}
.opts {
  display: grid;
  gap: 10px;
  margin-bottom: 16px;
}
.opt {
  min-height: 56px;
  border-radius: 14px;
  border: 2px solid #D7E5D8;
  background: #fff;
  color: #1F2A1F;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
}
.progress {
  margin-top: 14px;
  text-align: center;
  color: #687268;
  font-size: 15px;
}
</style>
