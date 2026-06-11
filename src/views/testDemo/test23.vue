<template>
    <div class="pulse-wrap">
      <canvas ref="cvRef" />
    </div>
  </template>
  
  <script setup lang="ts">
  import { onMounted, onBeforeUnmount, ref } from 'vue'
  import { createPulseDot } from '@/utils/pulseDot'
  
  const cvRef = ref<HTMLCanvasElement | null>(null)
  
  let pulse: ReturnType<typeof createPulseDot> | null = null
  let ro: ResizeObserver | null = null
  
  onMounted(() => {
    const canvas = cvRef.value!
    const wrap = canvas.parentElement!
  
    const w = wrap.clientWidth
    const h = wrap.clientHeight
  
    pulse = createPulseDot(canvas, {
        width: w,
        height: h,
        x: w / 2,
        y: h / 2,

        dotRadius: 18,
        dotColor: '#18D6C8',

        ringCount: 2,
        minRingRadius: 22,
        maxRingRadius: 44,
        periodMs: 1400,
        fadePow: 1.8,

        // 新增：软边
        softEdge: 0.5,

        composite: 'source-over', // 想更亮再试 'lighter'
        ringColor: '#9FF1E8',
        })
  
    pulse.start()
  
    // 容器变更时自适应
    ro = new ResizeObserver(() => {
      const nw = wrap.clientWidth
      const nh = wrap.clientHeight
      pulse?.resize(nw, nh)
      pulse?.setCenter(nw / 2, nh / 2)
    })
    ro.observe(wrap)
  
    // 点击移动中心点（演示）
    wrap.addEventListener('click', (e) => {
      const rect = wrap.getBoundingClientRect()
      pulse?.setCenter(e.clientX - rect.left, e.clientY - rect.top)
    })
  })
  
  onBeforeUnmount(() => {
    ro?.disconnect()
    ro = null
    pulse?.stop()
    pulse = null
  })
  </script>
  
  <style scoped>
  .pulse-wrap {
    width: 240px;
    height: 240px;
    position: relative;
  }
  canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
  </style>