<script setup lang="ts">
import { onMounted } from 'vue'
const { map, initMap, changeBaseMap, BaseMapType } = useMapbox()

// 通用添加函数：传入 layer 配置和可选的 beforeId（将此图层插入到 beforeId 之前）
function addTileLayer(layerConfig: mapboxgl.AnyLayer, beforeId?: string) {
  if (!map.value) return
  if (beforeId) {
    map.value.addLayer(layerConfig, beforeId)
  } else {
    map.value.addLayer(layerConfig)
  }
}

onMounted(() => {
  initMap({
    container: 'map',
    center: [91.46, 31.30],
    zoom: 8.8,
  })

  map.value?.on('load', () => {
    // 切换到底图
    changeBaseMap(BaseMapType.TDT_IMAGE)

    // 底层
    addTileLayer({
      id: 'hcTypeTest',
      type: 'fill',
      source: {
        type: 'vector',
        scheme: 'tms',
        tiles: [
          'http://localhost:8080/geoserver/gwc/service/tms/1.0.0/test%3AhcTypeTest@EPSG%3A900913@pbf/{z}/{x}/{y}.pbf'
        ],
      },
      'source-layer': 'hcTypeTest',
      paint: {
        'fill-color': '#02c4ff',
      }
    })

    // 顶层 —— 不传 beforeId，自然置于最上面
    addTileLayer({
      id: 'hcType_g',
      type: 'fill',
      source: {
        type: 'vector',
        scheme: 'tms',
        tiles: [
          'http://localhost:8080/geoserver/gwc/service/tms/1.0.0/test%3AhcType_g@EPSG%3A900913@pbf/{z}/{x}/{y}.pbf'
        ],
      },
      'source-layer': 'hcType_g',
      paint: {
        'fill-color': '#032670',
      }
    })

    // （可选）确保 hcType_g 在最顶层
    map.value?.moveLayer('hcType_g')

    // 点击事件
    map.value?.on('click', 'hcType_g', (e) => {
      console.log('顶层属性:', e.features?.[0]?.properties)
    })
  })
})
</script>

<template>
  <div id="map" class="w-full h-full" />
</template>

<style>
.mapboxgl-ctrl-logo {
  display: none !important;
}
</style>