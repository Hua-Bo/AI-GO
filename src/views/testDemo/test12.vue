<script setup lang="ts">
import ColorBar from '@/components/ColorBar.vue'

const { map, initMap, client, setColorConfig, setColorMapTileLayerOption } = useMapbox()
const mapInstance = ref(null)

// // colorbar展示颜色
// const colorStops = [
//   [0, 'rgb(255,255,255)'],
//   [1, 'rgb(249,224,186)'],
//   [3, 'rgb(243,192,142)'],
//   [5, 'rgb(231,133,93)'],
//   [7, 'rgb(202,71,51)'],
//   [9, 'rgb(151,29,19)'],
//   [11, 'rgb(116,20,12)'],
//   [13, 'rgb(116,20,12)'],
// ]

const colorStops = [
  [0.1, 'rgb(255, 255, 255)'],
  [1, 'rgb(224,241,251)'],
  [5, 'rgb(148,197,229)'],
  [10, 'rgb(99,184,204)'],
  [15, 'rgb(49,172,179)'],
  [20, 'rgb(92,198,176)'],
  [25, 'rgb(210,226,119)'],
  [50, 'rgb(166,201,83)'],
  [100, 'rgb(123,190,85)'],
  [150, 'rgb(79,180,88)'],
  [200, 'rgb(5,139,86)'],
  [250, 'rgb(11,85,72)'],
]

// // 灰度图映射颜色
// const temperatureGrayColors = [
//   [0, 'rgba(255,255,255,0.1)'], // 0
//   [0.078431, 'rgb(249,224,186)'], // 1
//   [0.231373, 'rgb(243,192,142)'], // 3
//   [0.384314, 'rgb(231,133,93)'], // 5
//   [0.537255, 'rgb(202,71,51)'], // 7
//   [0.690196, 'rgb(151,29,19)'], // 9
//   [0.847059, 'rgb(116,20,12)'], // 11
//   [1, 'rgb(116,20,12)'], // 13
// ]

const temperatureGrayColors = [
  [0, 'rgb(255, 255, 255)'], // 0.1
  [0.003922, 'rgb(224,241,251)'], // 1
  [0.019608, 'rgb(148,197,229)'], // 5
  [0.039216, 'rgb(99,184,204)'], // 10
  [0.058824, 'rgb(49,172,179)'], // 15
  [0.078431, 'rgb(92,198,176)'], // 20
  [0.101961, 'rgb(210,226,119)'], // 25
  [0.2, 'rgb(166,201,83)'], // 50
  [0.4, 'rgb(123,190,85)'], // 100
  [0.6, 'rgb(79,180,88)'], // 150
  [0.8, 'rgb(5,139,86)'], // 200
  [1, 'rgb(11,85,72)'], // 250
]

onMounted(() => {
  // 初始化地图
  initMap({
    container: 'map',
    center: [108.84, 21.58],
    zoom: 4,
  })

  // 监听地图加载完成事件
  map.value?.on('load', () => {
    // 初始化灰度图图层
    client.initColorMapTileLayer(map.value!, mapInstance.value!, {
      beforeId: 'darkSourceLayer',
      layerId: 'ColorMapLayer',
    })
    // 设置颜色配置
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
    // 设置颜色图
    setColorMapTileLayerOption('/public/snow_water_anom_1991_20210101.png', 't2m')
    // 渲染颜色图
    client.renderColorMapTileFunction(map.value, mapInstance.value)
  })
})
</script>

<template>
  <div class="relative w-full h-full">
    <div id="map" ref="mapInstance" class=" h-full" />
    <ColorBar class="absolute right-2 bottom-2" :colors="colorStops" unit="℃" />
  </div>
</template>

<style scoped>
/* 保持原有地图样式 */
.mapboxgl-ctrl-logo {
  display: none !important;
}
</style>
