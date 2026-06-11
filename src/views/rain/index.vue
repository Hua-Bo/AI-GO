<script setup>
import { ref, onMounted, nextTick } from 'vue';
import * as echarts from 'echarts';

const chartRef = ref(null);
let myChart = null;

const initChart = async () => {
  if (!chartRef.value) return;

  myChart = echarts.init(chartRef.value);

  const option = {
    tooltip: { trigger: 'item', triggerOn: 'mousemove' },
    series: [
      {
        type: 'sankey',
        layout: 'none',
        emphasis: { focus: 'adjacency' },
        data: [
          { name: '降雨入补给' },
          { name: '其他补给量' },
          { name: '人工回灌' },
          { name: '台西诺河流域平原区地下水资源区' },
          { name: '台西诺河流域山地区地下水资源区' },
          { name: '兰阳平原地下水资源区' },
          { name: '中央山脉东部山区地下水资源区' },
          { name: '蒸发量' },
          { name: '地下水开采' }
        ],
        links: [
          { source: '降雨入补给', target: '台西诺河流域平原区地下水资源区', value: 10 },
          { source: '其他补给量', target: '台西诺河流域平原区地下水资源区', value: 15 },
          { source: '人工回灌', target: '兰阳平原地下水资源区', value: 8 },
          { source: '台西诺河流域平原区地下水资源区', target: '地下水开采', value: 20 },
          { source: '兰阳平原地下水资源区', target: '蒸发量', value: 5 }
        ],
        lineStyle: { color: 'source', opacity: 0.6 },
        label: { position: 'right', fontSize: 12 }
      }
    ],
    graphic: [] // 先不添加粒子，稍后动态添加
  };

  myChart.setOption(option);

  // 确保 ECharts 完全渲染后再添加粒子
  await nextTick();
  setTimeout(() => addParticles(), 1000);
};

// **粒子动画**
const addParticles = () => {
  if (!myChart) return;

  const option = myChart.getOption();
  const sankeySeries = option.series[0];
  const sankeyModel = myChart.getModel().getSeriesByIndex(0);
  const nodeData = sankeyModel.getData();

  const particles = [];

  sankeySeries.links.forEach((link) => {
    const sourceIdx = sankeySeries.data.findIndex((d) => d.name === link.source);
    const targetIdx = sankeySeries.data.findIndex((d) => d.name === link.target);

    if (sourceIdx === -1 || targetIdx === -1) return;

    const sourceRect = nodeData.getItemLayout(sourceIdx);
    const targetRect = nodeData.getItemLayout(targetIdx);

    if (!sourceRect || !targetRect) return;

    const startX = sourceRect.x + sourceRect.dx; // 节点右侧
    const startY = sourceRect.y + sourceRect.dy / 2;
    const endX = targetRect.x; // 目标节点左侧
    const endY = targetRect.y + targetRect.dy / 2;

    for (let i = 0; i < 10; i++) {
      const delay = Math.random() * 3000;
      particles.push({
        type: 'circle',
        shape: { cx: startX, cy: startY, r: 4 },
        style: { fill: 'white' },
        keyframeAnimation: {
          duration: 3000,
          delay,
          loop: true,
          keyframes: [
            { percent: 0, x: startX, y: startY },
            { percent: 1, x: endX, y: endY }
          ]
        }
      });
    }
  });

  // **确保 `graphic` 组件更新**
  myChart.setOption({ graphic: particles });

  // **让粒子动画循环播放**
  requestAnimationFrame(() => updateParticles());
};

// **粒子动态更新**
const updateParticles = () => {
  if (!myChart) return;
  requestAnimationFrame(updateParticles); // 持续更新
};

onMounted(() => {
  initChart();
});
</script>

<template>
  <div ref="chartRef" style="width: 100%; height: 500px;"></div>
</template>