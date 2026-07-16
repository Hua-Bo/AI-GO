<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAgriStore } from '@/stores/agri'
import ErrorState from '@/components/agri/ErrorState.vue'

const router = useRouter()
const store = useAgriStore()

const tips = ['正在看照片', '正在听你说的问题', '正在整理今天该做什么']
const tipIndex = ref(0)
const slow = ref(false)
const cancelled = ref(false)
let tipTimer: number | undefined
let slowTimer: number | undefined

async function startAnalyze() {
  cancelled.value = false
  slow.value = false
  store.analyzeError = ''
  if (slowTimer) clearTimeout(slowTimer)
  slowTimer = window.setTimeout(() => {
    slow.value = true
  }, 30000)
  try {
    await store.runAnalyze()
    if (cancelled.value) return
    router.replace('/agri-assistant/result')
  } catch {
    // stay and show error
  }
}

function cancel() {
  cancelled.value = true
  router.replace('/agri-assistant')
}

function retry() {
  startAnalyze()
}

onMounted(() => {
  tipTimer = window.setInterval(() => {
    tipIndex.value = (tipIndex.value + 1) % tips.length
  }, 1600)
  startAnalyze()
})

onBeforeUnmount(() => {
  cancelled.value = true
  if (tipTimer) clearInterval(tipTimer)
  if (slowTimer) clearTimeout(slowTimer)
})
</script>

<template>
  <main class="agri-page no-nav analyze-page">
    <ErrorState
      v-if="store.analyzeError"
      title="暂时没有分析出来"
      :desc="store.analyzeError"
      action-text="重新试试"
      @action="retry"
    />

    <template v-else>
      <div class="loader" />
      <h1 class="agri-title">正在帮你看看</h1>
      <p class="tip">{{ tips[tipIndex] }}</p>
      <p v-if="slow" class="slow">分析时间有点长，请稍等或重新提交。</p>
      <button type="button" class="agri-secondary-btn" @click="cancel">取消</button>
    </template>
  </main>
</template>

<style scoped>
.analyze-page {
  min-height: 80dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
}
.loader {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 6px solid #D7E8D8;
  border-top-color: #2F7D32;
  animation: spin 1s linear infinite;
  margin-bottom: 8px;
}
.tip {
  margin: 0;
  font-size: 18px;
  color: #687268;
}
.slow {
  margin: 4px 0 0;
  color: #B7791F;
  font-size: 16px;
  font-weight: 700;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
