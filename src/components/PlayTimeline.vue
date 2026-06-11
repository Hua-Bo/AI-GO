<template>
    <div class="timeline-wrapper">
      <!-- 播放按钮 -->
      <button class="play-button" @click="togglePlay">
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            :d="isPlaying ? 'M6 4h4v16H6zm8 0h4v16h-4z' : 'M8 5v14l11-7z'"
          />
        </svg>
      </button>
  
      <div class="timeline-container">
        <!-- 底线与进度 -->
        <div class="base-line"></div>
        <div class="progress-line" :style="{ width: progress + '%' }"></div>
  
        <!-- 滑块 -->
        <input
          v-model.number="currentIndex"
          type="range"
          class="slider"
          :min="0"
          :max="timeList.length - 1"
          @input="onSliderChange"
        />
  
        <!-- 当前时间 Tooltip 与三角标 -->
        <div
          class="cursor"
          :style="{ left: (currentIndex / (timeList.length - 1)) * 100 + '%' }"
        >
          <div class="tooltip">{{ formatTickLabel(timeList[currentIndex]) }}</div>
          <div class="triangle"></div>
        </div>
  
        <!-- 刻度（可点击跳转） -->
        <template v-if="timeList.length">
          <div
            v-for="(item, index) in timeList"
            v-show="shouldShowTick(index)"
            :key="item + index"
            class="tick"
            :style="{ left: (index / (timeList.length - 1)) * 100 + '%' }"
            @click="onTickClick(index)"
          >
            <div class="tick-label" :title="formatTickLabel(item)">{{ formatTickLabel(item) }}</div>
            <div class="tick-line"></div>
          </div>
        </template>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onUnmounted } from 'vue'
  import dayjs from 'dayjs'
  
  const props = defineProps({
    start: { type: String, required: true },
    end: { type: String, required: true },
    resolution: { type: String, default: 'day' },
  })
  
  const emit = defineEmits(['update:current'])
  
  const currentIndex = ref(0)
  const isPlaying = ref(false)
  const timer = ref(null)
  const maxTicks = 8
  
  const timeList = computed(() => {
    const result = []
    let current = dayjs(props.start)
    const end = dayjs(props.end)
  
    while (current.isBefore(end) || current.isSame(end)) {
      result.push(current.format('YYYY-MM-DD'))
      switch (props.resolution) {
        case 'day': current = current.add(1, 'day'); break
        case 'month': current = current.add(1, 'month'); break
        case 'season': current = current.add(3, 'month'); break
        case 'year': current = current.add(1, 'year'); break
      }
    }
    return result
  })
  
  const tickInterval = computed(() => {
    const len = timeList.value.length
    return len <= maxTicks ? 1 : Math.max(1, Math.floor(len / maxTicks))
  })
  
  const shouldShowTick = (index) => {
    return tickInterval.value === 1 || index % tickInterval.value === 0 || index === timeList.value.length - 1
  }
  
  const progress = computed(() => (currentIndex.value / (timeList.value.length - 1)) * 100)
  
  const togglePlay = () => {
    isPlaying.value = !isPlaying.value
    if (isPlaying.value) {
      timer.value = setInterval(() => {
        if (currentIndex.value >= timeList.value.length - 1) {
          clearInterval(timer.value)
          isPlaying.value = false
          return
        }
        currentIndex.value++
        emit('update:current', timeList.value[currentIndex.value])
      }, 600)
    } else {
      clearInterval(timer.value)
    }
  }
  
  const onSliderChange = () => {
    emit('update:current', timeList.value[currentIndex.value])
  }
  
  const onTickClick = (index) => {
    currentIndex.value = index
    emit('update:current', timeList.value[index])
  }
  
  onUnmounted(() => {
    clearInterval(timer.value)
  })
  
  const formatTickLabel = (val) => {
    const d = dayjs(val)
    if (props.resolution === 'day') return d.format('YYYY-MM-DD')
    if (props.resolution === 'month') return d.format('YYYY-MM')
    if (props.resolution === 'season') {
      const m = parseInt(d.format('MM'))
      return d.format('YYYY') + ' Q' + (Math.floor((m - 1) / 3) + 1)
    }
    if (props.resolution === 'year') return d.format('YYYY')
    return val
  }
  
  </script>
  
  
  <style scoped>
  .timeline-wrapper {
    display: flex;
    align-items: center;
    padding: 6px 10px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(4px);
    position: relative;
  }
  
  .play-button {
    border: none;
    background: none;
    margin-right: 8px;
    cursor: pointer;
    color: #333;
    z-index: 5;
  }
  
  .timeline-container {
    position: relative;
    flex: 1;
    height: 60px;
  }
  
  .base-line,
  .progress-line {
    position: absolute;
    top: 32px;
    height: 4px;
    border-radius: 2px;
  }
  
  .base-line {
    width: 100%;
    background: #ccc;
  }
  
  .progress-line {
    background: #007bff;
    transition: width 0.3s;
  }
  
  .slider {
    position: absolute;
    top: 24px;
    width: 100%;
    appearance: none;
    background: transparent;
    z-index: 3;
    height: 20px;
  }
  
  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    cursor: pointer;
    background: transparent;
  }
  
  .tick {
    position: absolute;
    transform: translateX(-50%);
    text-align: center;
    top: 7px;
    cursor: pointer;
    z-index: 1;
  }
  
  .tick-line {
    width: 2px;
    height: 8px;
    background: #333;
    margin: 0 auto;
    margin-top: 2px;
  }
  
  .tick-label {
    font-size: 10px;
    white-space: nowrap;
    color: #000;
    background: transparent;
    transition: all 0.2s ease;
  }
  
  .tick:hover .tick-label {
    color: #007bff;
    font-weight: bold;
  }
  
  .cursor {
    position: absolute;
    transform: translateX(-50%);
    pointer-events: none;
    z-index: 4;
    display: flex;
    flex-direction: column;
    align-items: center;
    bottom: 28px;
  }
  
  .triangle {
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 8px solid #007bff;
  }
  
  .tooltip {
    background: #007bff;
    color: #fff;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    text-align: center;
    white-space: nowrap;
    margin-bottom: 2px;
  }
  </style>
  