<template>
    <div ref="chartRef" class="chart-container"></div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import * as echarts from 'echarts';
  
  const chartRef = ref(null);
  
  onMounted(() => {
    if (!chartRef.value) return;
    const chart = echarts.init(chartRef.value);
  
    const xAxisData = [];
    const yAxisData = [];
    const data = [];
  
    // 生成X轴数据 (2000-2020)
    for (let i = 2000; i <= 2020; i++) {
      xAxisData.push(i);
    }
  
    // 生成Y轴数据 (800 - 8000, 间隔800)
    for (let j = 800; j <= 8000; j += 800) {
      yAxisData.push(j);
    }
  
    // 生成正确格式的数据 [xIndex, yIndex, value]
    for (let i = 0; i < xAxisData.length; i++) {
      for (let j = 0; j < yAxisData.length; j++) {
        data.push([i, j, Math.random() * 100]); // 这里 i, j 是索引
      }
    }
  
    const option = {
      tooltip: { position: 'top' },
      grid: {
        left: '5%',
        right: '5%',
        top: '5%',
        bottom: '25%'
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        splitArea: { show: true }
      },
      yAxis: {
        type: 'category',
        data: yAxisData,
        splitArea: { show: true }
      },
      visualMap: {
        min: 0,
        max: 100,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        inRange: {
          color: ['#f7fcf0', '#00441b'] // 控制颜色梯度
        }
      },
      series: [{
        name: '数据值',
        type: 'heatmap',
        data: data,
        label: { show: false },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  
    chart.setOption(option);
  
    setTimeout(() => {
      chart.resize();
    }, 300);
  
    window.addEventListener('resize', () => chart.resize());
  });
  </script>
  
  <style scoped>
  .chart-container {
    width: 100%;
    height: 400px;
  }
  </style>