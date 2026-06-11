<script setup lang="ts">
import type { GeoJSONSource, MapMouseEvent } from 'mapbox-gl'
import mapboxGL from 'mapbox-gl'

const { map, initMap, changeBaseMap, BaseMapType } = useMapbox()

const SOURCE_ID = 'argo-source'
const LAYER_ID = 'argo-points'
const loading = ref(true)
const pointCount = ref(0)
const popupRef = ref<mapboxGL.Popup | null>(null)

async function loadGeoJSON() {
  const res = await fetch('/argo_profiles.geojson')
  if (!res.ok) throw new Error('加载 GeoJSON 失败')
  return res.json()
}

function fitToData(geojson: GeoJSON.FeatureCollection) {
  const bounds = new mapboxGL.LngLatBounds()
  geojson.features.forEach((f) => {
    const coords = (f.geometry as GeoJSON.Point).coordinates
    bounds.extend(coords as [number, number])
  })
  map.value?.fitBounds(bounds, { padding: 60, maxZoom: 6, duration: 800 })
}

function addArgoLayer(geojson: GeoJSON.FeatureCollection) {
  if (!map.value) return

  pointCount.value = geojson.features.length

  if (map.value.getSource(SOURCE_ID)) {
    ;(map.value.getSource(SOURCE_ID) as GeoJSONSource).setData(geojson)
    return
  }

  map.value.addSource(SOURCE_ID, {
    type: 'geojson',
    data: geojson,
  })

  map.value.addLayer({
    id: LAYER_ID,
    type: 'circle',
    source: SOURCE_ID,
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        2, 3,
        6, 6,
        10, 10,
      ],
      'circle-color': [
        'interpolate', ['linear'], ['get', 'depth_max'],
        0, '#ffffb2',
        500, '#fecc5c',
        1000, '#fd8d3c',
        1500, '#f03b20',
        2000, '#bd0026',
      ],
      'circle-opacity': 0.85,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff',
    },
  })

  map.value.on('mouseenter', LAYER_ID, () => {
    map.value!.getCanvas().style.cursor = 'pointer'
  })
  map.value.on('mouseleave', LAYER_ID, () => {
    map.value!.getCanvas().style.cursor = ''
  })
  map.value.on('click', LAYER_ID, onPointClick)
}

function onPointClick(e: MapMouseEvent) {
  const feature = e.features?.[0]
  if (!feature?.properties || !map.value) return

  const p = feature.properties
  const html = `
    <div class="popup">
      <div><b>平台</b> ${p.platform}</div>
      <div><b>周期</b> ${p.cycle}</div>
      <div><b>日期</b> ${p.date}</div>
      <div><b>方向</b> ${p.direction}</div>
      <div><b>深度</b> ${p.depth_min} ~ ${p.depth_max} m</div>
      <div><b>层数</b> ${p.n_levels}</div>
      <div><b>文件</b> ${p.file}</div>
    </div>
  `

  popupRef.value?.remove()
  popupRef.value = new mapboxGL.Popup({ closeButton: true, maxWidth: '280px' })
    .setLngLat(e.lngLat)
    .setHTML(html)
    .addTo(map.value)
}

onMounted(() => {
  initMap({
    container: 'argo-map',
    center: [120, 20],
    zoom: 2,
  })

  map.value?.on('load', async () => {
    changeBaseMap(BaseMapType.TDT_IMAGE)
    try {
      const geojson = await loadGeoJSON()
      addArgoLayer(geojson)
      fitToData(geojson)
    } catch (err) {
      console.error(err)
    } finally {
      loading.value = false
    }
  })
})

onUnmounted(() => {
  popupRef.value?.remove()
})
</script>

<template>
  <div class="page">
    <div id="argo-map" v-loading="loading" class="map" />
    <div class="info-panel">
      <div class="title">Argo 浮标剖面</div>
      <div class="stat">共 {{ pointCount }} 个剖面点</div>
      <div class="hint">点击圆点查看详情，颜色表示最大深度</div>
      <div class="legend">
        <span>0m</span>
        <div class="bar" />
        <span>2000m</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  width: 100%;
  height: 100vh;
  position: relative;
}
.map {
  width: 100%;
  height: 100%;
}
.info-panel {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 2;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.94);
  border-radius: 6px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
  font-size: 13px;
  color: #333;
}
.title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 6px;
}
.stat {
  color: #409eff;
  margin-bottom: 4px;
}
.hint {
  color: #888;
  font-size: 12px;
  margin-bottom: 10px;
}
.legend {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #666;
}
.bar {
  width: 100px;
  height: 10px;
  border-radius: 5px;
  background: linear-gradient(to right, #ffffb2, #fecc5c, #fd8d3c, #f03b20, #bd0026);
}
:deep(.mapboxgl-ctrl-logo) {
  display: none !important;
}
:deep(.popup) {
  font-size: 13px;
  line-height: 1.6;
}
</style>
