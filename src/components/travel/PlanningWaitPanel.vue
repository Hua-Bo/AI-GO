<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  loadingStep?: string
  visible: boolean
}>()

const elapsedSec = ref(0)
const score = ref(0)
const balloonX = ref(40)
const balloonY = ref(30)
const showGame = ref(true)
let timer: number | null = null
let moveTimer: number | null = null

const steps = [
  { key: '天气', match: /天气/ },
  { key: '路线大纲', match: /大纲|总览|路线框架/ },
  { key: '出发/集合', match: /出发|集合|meeting/i },
  { key: '每日行程', match: /第\s*\d+\s*天|每日|行程/ },
  { key: '预算', match: /预算|费用/ },
  { key: '注意事项', match: /注意|贴士|tips/i },
  { key: '景区图片', match: /图片|景区图/ },
]

const activeStepIndex = computed(() => {
  const text = props.loadingStep || ''
  let idx = steps.findIndex((s) => s.match.test(text))
  if (idx < 0) {
    // 根据已完成关键词粗估
    if (/整理|合成|compose/i.test(text)) idx = 5
    else idx = Math.min(Math.floor(elapsedSec.value / 18), steps.length - 1)
  }
  return idx
})

const etaText = computed(() => {
  const sec = elapsedSec.value
  if (sec < 20) return '通常需要 1–3 分钟，请稍候'
  if (sec < 60) return '正在认真规划中，还请再等一会儿'
  if (sec < 120) return '内容较多时会久一点，可以先玩下面的小游戏'
  return '仍在生成，网络或模型较慢时可能超过 3 分钟'
})

function resetBalloon() {
  balloonX.value = 10 + Math.random() * 70
  balloonY.value = 8 + Math.random() * 55
}

function tapBalloon() {
  score.value += 1
  resetBalloon()
}

function startTimers() {
  stopTimers()
  elapsedSec.value = 0
  score.value = 0
  resetBalloon()
  timer = window.setInterval(() => {
    elapsedSec.value += 1
  }, 1000)
  moveTimer = window.setInterval(() => {
    resetBalloon()
  }, 2200)
}

function stopTimers() {
  if (timer != null) {
    window.clearInterval(timer)
    timer = null
  }
  if (moveTimer != null) {
    window.clearInterval(moveTimer)
    moveTimer = null
  }
}

watch(
  () => props.visible,
  (v) => {
    if (v) startTimers()
    else stopTimers()
  },
  { immediate: true },
)

onMounted(() => {
  if (props.visible) startTimers()
})

onBeforeUnmount(stopTimers)

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
</script>

<template>
  <div v-if="visible" class="planning-wait no-print">
    <div class="wait-card">
      <div class="wait-head">
        <div class="spinner" />
        <div>
          <h3>正在生成攻略</h3>
          <p class="current-step">{{ loadingStep || '准备中…' }}</p>
          <p class="eta">已等待 {{ formatTime(elapsedSec) }} · {{ etaText }}</p>
        </div>
      </div>

      <ul class="step-list">
        <li
          v-for="(step, i) in steps"
          :key="step.key"
          :class="{
            done: i < activeStepIndex,
            active: i === activeStepIndex,
          }"
        >
          <span class="dot">{{ i < activeStepIndex ? '✓' : i + 1 }}</span>
          <span>{{ step.key }}</span>
        </li>
      </ul>

      <div class="game-box">
        <div class="game-bar">
          <strong>等得无聊？点气球消遣一下</strong>
          <span>得分 {{ score }}</span>
          <button type="button" class="toggle-btn" @click="showGame = !showGame">
            {{ showGame ? '收起' : '展开小游戏' }}
          </button>
        </div>
        <div v-if="showGame" class="game-field" @click.self="resetBalloon">
          <button
            type="button"
            class="balloon"
            :style="{ left: `${balloonX}%`, top: `${balloonY}%` }"
            @click.stop="tapBalloon"
          >
            🎈
          </button>
          <p class="game-hint">点中气球 +1 分，反正闲着也是闲着</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.planning-wait {
  margin: 0 0 16px;
}

.wait-card {
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, #eff6ff, #f8fafc);
  border: 1px solid #bfdbfe;
  box-shadow: 0 10px 28px rgba(37, 99, 235, 0.08);
}

.wait-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.wait-head h3 {
  margin: 0 0 4px;
  font-size: 16px;
  color: #1e3a8a;
}

.current-step {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #1d4ed8;
}

.eta {
  margin: 4px 0 0;
  font-size: 12px;
  color: #64748b;
}

.spinner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid #bfdbfe;
  border-top-color: #2563eb;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
  margin-top: 2px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.step-list {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
  display: grid;
  gap: 6px;
}

.step-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #94a3b8;
}

.step-list li.done {
  color: #059669;
}

.step-list li.active {
  color: #1d4ed8;
  font-weight: 800;
}

.dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  background: #e2e8f0;
  color: #64748b;
}

.step-list li.done .dot {
  background: #d1fae5;
  color: #059669;
}

.step-list li.active .dot {
  background: #dbeafe;
  color: #1d4ed8;
}

.game-box {
  margin-top: 14px;
  border-radius: 14px;
  background: #fff;
  border: 1px dashed #93c5fd;
  overflow: hidden;
}

.game-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 12px;
  color: #334155;
  background: #f8fafc;
}

.toggle-btn {
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.game-field {
  position: relative;
  height: 140px;
  background: linear-gradient(180deg, #e0f2fe, #f0f9ff 60%, #ecfdf5);
}

.balloon {
  position: absolute;
  transform: translate(-50%, -50%);
  border: none;
  background: transparent;
  font-size: 34px;
  cursor: pointer;
  filter: drop-shadow(0 6px 10px rgba(37, 99, 235, 0.25));
  transition: transform 0.12s ease;
}

.balloon:active {
  transform: translate(-50%, -50%) scale(0.86);
}

.game-hint {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 8px;
  margin: 0;
  text-align: center;
  font-size: 11px;
  color: #64748b;
}
</style>
