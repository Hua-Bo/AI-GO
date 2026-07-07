<script setup lang="ts">
import * as echarts from 'echarts'
import type { AiReportChartItem } from '@/types/aiTypes'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  data: AiReportChartItem[]
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

function render() {
  if (!chartRef.value) return
  if (!chart) chart = echarts.init(chartRef.value)
  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 16, top: 24, bottom: 32 },
    xAxis: {
      type: 'category',
      data: props.data.map((d) => d.name),
      axisLabel: { color: '#94a3b8' },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#334155' } },
    },
    series: [{
      type: 'bar',
      data: props.data.map((d) => d.value),
      itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
    }],
  })
}

onMounted(() => {
  render()
  window.addEventListener('resize', render)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', render)
  chart?.dispose()
})

watch(() => props.data, render, { deep: true })
</script>

<template>
  <div ref="chartRef" class="report-chart" />
</template>

<style scoped>
.report-chart {
  width: 100%;
  height: 220px;
}
</style>
