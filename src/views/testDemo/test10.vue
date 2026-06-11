<script setup lang="ts">
import DragColorBar from '@/components/DragColorBar.vue'

const { map, initMap, client, setColorConfig, setColorMapTileLayerOption } = useMapbox()
const mapInstance = ref(null)
const colorStops = ref([
  { value: -30, color: 'rgb(2, 12, 100)' },  // 对应 temperatureGrayColors[0]
  { value: -28, color: 'rgb(7, 30, 120)' },
  { value: -26, color: 'rgb(17, 49, 139)' },
  { value: -24, color: 'rgb(27, 68, 159)' },
  { value: -22, color: 'rgb(38, 87, 179)' },
  { value: -20, color: 'rgb(48, 106, 199)' },
  { value: -18, color: 'rgb(59, 126, 219)' },
  { value: -16, color: 'rgb(78, 138, 221)' },
  { value: -14, color: 'rgb(97, 150, 224)' },
  { value: -12, color: 'rgb(116, 163, 226)' },
  { value: -10, color: 'rgb(135, 175, 229)' },
  { value: -8, color: 'rgb(155, 188, 232)' },
  { value: -6, color: 'rgb(154, 196, 220)' },
  { value: -4, color: 'rgb(153, 205, 208)' },
  { value: -2, color: 'rgb(152, 214, 196)' },
  { value: 0, color: 'rgb(151, 232, 173)' },
  { value: 2, color: 'rgb(215, 222, 126)' },
  { value: 4, color: 'rgb(234, 219, 112)' },
  { value: 6, color: 'rgb(244, 217, 99)' },
  { value: 8, color: 'rgb(250, 204, 79)' },
  { value: 10, color: 'rgb(247, 180, 45)' },
  { value: 12, color: 'rgb(242, 155, 0)' },
  { value: 14, color: 'rgb(241, 147, 3)' },
  { value: 16, color: 'rgb(240, 121, 10)' },
  { value: 18, color: 'rgb(239, 117, 17)' },
  { value: 20, color: 'rgb(238, 102, 24)' },
  { value: 22, color: 'rgb(238, 88, 31)' },
  { value: 24, color: 'rgb(231, 75, 26)' },
  { value: 26, color: 'rgb(224, 63, 22)' },
  { value: 28, color: 'rgb(217, 51, 18)' },
  { value: 30, color: 'rgb(208, 36, 14)' },
  { value: 32, color: 'rgb(194, 0, 3)' },  // 对应 temperatureGrayColors[32]
  { value: 34, color: 'rgb(181, 1, 9)' },  // 可滑动
  { value: 35, color: 'rgb(169, 2, 16)' }, // colorStops[-1]  (不可滑入)
])
const temperatureGrayColors = [
  [0, 'rgb(2, 12, 100)'], // -30
  [82 / 255, 'rgb(7, 30, 120)'], // -28
  [86 / 255, 'rgb(17, 49, 139)'], // -26
  [90 / 255, 'rgb(27, 68, 159)'], // -24
  [94 / 255, 'rgb(38, 87, 179)'], // -22
  [98 / 255, 'rgb(48, 106, 199)'], // -20
  [102 / 255, 'rgb(59, 126, 219)'], // -18
  [106 / 255, 'rgb(78, 138, 221)'], // -16
  [110 / 255, 'rgb(97, 150, 224)'], // -14
  [114 / 255, 'rgb(116, 163, 226)'], // -12
  [118 / 255, 'rgb(135, 175, 229)'], // -10
  [122 / 255, 'rgb(155, 188, 232)'], // -8
  [126 / 255, 'rgb(154, 196, 220)'], // -6
  [130 / 255, 'rgb(153, 205, 208)'], // -4
  [134 / 255, 'rgb(152, 214, 196)'], // -2
  [138 / 255, 'rgb(151, 232, 173)'], // 0
  [142 / 255, 'rgb(215, 222, 126)'], // 2
  [146 / 255, 'rgb(234, 219, 112)'], // 4
  [150 / 255, 'rgb(244, 217, 99)'], // 6
  [154 / 255, 'rgb(250, 204, 79)'], // 8
  [158 / 255, 'rgb(247, 180, 45)'], // 10
  [162 / 255, 'rgb(242, 155, 0)'], // 12
  [166 / 255, 'rgb(241, 147, 3)'], // 14
  [170 / 255, 'rgb(240, 121, 10)'], // 16
  [174 / 255, 'rgb(239, 117, 17)'], // 18
  [178 / 255, 'rgb(238, 102, 24)'], // 20
  [184 / 255, 'rgb(238, 88, 31)'], // 22
  [188 / 255, 'rgb(231, 75, 26)'], // 24
  [192 / 255, 'rgb(224, 63, 22)'], // 26
  [196 / 255, 'rgb(217, 51, 18)'], // 28
  [200 / 255, 'rgb(208, 36, 14)'], // 30
  [204 / 255, 'rgb(194, 0, 3)'], // 32
  [208 / 255, 'rgb(181, 1, 9)'], // 34
  [210 / 255, 'rgb(169, 2, 16)'], // 35
  [214 / 255, 'rgb(138, 5, 25)'], // 37
  [220 / 255, 'rgb(111, 0, 21)'], // 40
  [226 / 255, 'rgb(80, 0, 15)'],
  [251 / 255, 'transparent'],
]

const handleUpdateRange = ({ min, max }) => {
  console.log("最新选择范围:", min, max);

  // 创建一个副本，避免修改原始 temperatureGrayColors
  const updatedColors = [...temperatureGrayColors];

  // 只处理中间的颜色值（不包含首尾）
  colorStops.value.slice(1, -1).forEach((stop, index) => {
    const globalIndex = index + 1; // colorStops[1] 对应 updatedColors[1]
    if (stop.value < min || stop.value > max) {
      updatedColors[globalIndex] = [updatedColors[globalIndex][0], 'rgba(0, 0, 0, 0)'];
    } else {
      updatedColors[globalIndex] = [updatedColors[globalIndex][0], stop.color];
    }
  });

  console.log("更新后的颜色映射:", updatedColors);

  setColorConfig(
    {
      factor: 't2m',
      colors: updatedColors,
    }
  );

  client.renderColorMapTileFunction(map.value, mapInstance.value);
};

onMounted(() => {
  initMap({
    container: 'map',
    center: [108.84, 21.58],
    zoom: 8.8,
  })

  map.value?.on('load', () => {
    client.initColorMapTileLayer(map.value!, mapInstance.value!, {
      beforeId: 'tdtCiaLayer',
      layerId: 'ColorMapLayer',
    })
    setColorConfig(
      {
        factor: 't2m',
        colors: temperatureGrayColors,
      },
      {
        min: -70,
        step: 0.5,
      },
    )
    setColorMapTileLayerOption('/public/t2m_2021.png', 't2m')
    client.renderColorMapTileFunction(map.value, mapInstance.value)
  })
})
</script>

<template>
  <div id="map" ref="mapInstance" class="w-full h-full" />
  <DragColorBar :colorStops="colorStops" @update-range="handleUpdateRange"/>
</template>

<style scoped>
/* 保持原有地图样式 */
.mapboxgl-ctrl-logo {
  display: none !important;
}
</style>
