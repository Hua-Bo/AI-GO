<script setup lang="ts">
import ColorBar from '@/components/ColorBar.vue'
import { initGrayLayerImage, updateGrayLayerImage } from '@/utils/add-gray-layer2.ts'

const { map, initMap } = useMapbox()
const mapInstance = ref(null)

// colorbar展示颜色
const colorStops = [
  [0, 'rgb(255,255,255)'],
  [1, 'rgb(249,224,186)'],
  [3, 'rgb(243,192,142)'],
  [5, 'rgb(231,133,93)'],
  [7, 'rgb(202,71,51)'],
  [9, 'rgb(151,29,19)'],
  [11, 'rgb(116,20,12)'],
  [13, 'rgb(116,20,12)'],
]

onMounted(() => {
  // 初始化地图
  initMap({
    container: 'map',
    // renderWorldCopies: false,
    center: [108.84, 21.58],
    zoom: 4,
  })
  // 监听地图加载完成事件
  map.value?.on('load',async () => {
    initGrayLayerImage({map:map.value, id:'imageUrl',colorRamp:[
      [0, 'rgb(0, 0, 0)'], // 0
      [1.5 / 255, 'rgb(0, 0, 0)'],
      [1.5 / 255, 'rgba(98, 100, 102, 0)'],
      [10.5 / 255, 'rgba(98, 100, 102, 0)'],
      [10.5 / 255, 'rgb(218, 194, 215)'],
      [11.5 / 255, 'rgb(218, 194, 215)'], // 夜晚
      [11.5 / 255, 'rgba(98, 100, 102, 0)'],
      [22.5 / 255, 'rgba(98, 100, 102, 0)'],
      [22.5 / 255, 'rgba(0, 0, 0, 0)'],
      [25.5 / 255, 'rgba(0, 0, 0, 0)'],
      [25.5 / 255, 'rgba(98, 100, 102, 0)'],
      [36.5 / 255, 'rgba(98, 100, 102, 0)'],
      [36.5 / 255, 'rgba(0, 0, 0, 0)'],
      // [37.5 / 255, 'rgba(0, 0, 0, 0)'],
      // [37.5 / 255, 'rgba(98, 100, 102, 0)'],
      // [38.5 / 255, 'rgba(98, 100, 102, 0)'],
      // [24.5 / 255, 'rgba(0, 0, 0, 0)'],
      [42.5 / 255, 'rgba(0, 0, 0, 0)'],
      [42.5 / 255, 'rgba(98, 100, 102, 0)'],
      [49.5 / 255, 'rgba(98, 100, 102, 0)'],
      [49.5 / 255, 'rgba(200, 200, 200, 1)'],
      [50.5 / 255, 'rgb(200, 200, 200)'], // 云
      [50.5 / 255, 'rgba(98, 100, 102, 0)'],
      [199.5 / 255, 'rgba(98, 100, 102, 0)'],
      [199.5 / 255, 'rgba(86, 190, 203, 1)'],
      [200.5 / 255, 'rgb(86, 190, 203)'], // 积雪
      [200.5 / 255, 'rgba(98, 100, 102, 0)'], // 积雪
      [250 / 255, 'rgba(98, 100, 102, 0)'],
      [250 / 255, 'rgba(0, 0, 0, 0)'],
      [254.5 / 255, 'rgba(0, 0, 0, 0)'],
      [254.5 / 255, 'rgb(98, 100, 102)'],
    ]})
  })
})

const updateGrayLayer = () => {
  updateGrayLayerImage(map.value!, 'imageUrl', '/20240102_orig.png')
}
</script>

<template>
  <div class="relative w-full h-full">
    <div id="map" ref="mapInstance" class=" h-full" />
    <ColorBar class="absolute right-2 bottom-2" :colors="colorStops" unit="℃" />
    <button @click="updateGrayLayer">切换灰度图</button>
  </div>
</template>

<style scoped>
/* 保持原有地图样式 */
.mapboxgl-ctrl-logo {
  display: none !important;
}
</style>
