<!--
  Lobelia 极地海洋底图 + ncWMS 数据叠加（参考 Copernicus MyOcean Viewer）
  极地模式：底图瓦片 + ncWMS 瓦片，同 CRS 平铺
  访问：/#/test29 或 /#/lobelia-polar
-->
<script setup lang="ts">
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  applyMercatorZoomToMap,
  applyPolarZoomToMap,
  clampMercatorView,
  clampPolarView,
  clampPolarZoom,
  createLobeliaBasemapLayer,
  DEFAULT_MERCATOR_ZOOM,
  DEFAULT_POLAR_ZOOM,
  getLobeliaDefaultCenter,
  getLobeliaMapCrs,
  getMercatorMapOptions,
  getPolarMapOptions,
  LOBELIA_ATTRIBUTION,
  type LobeliaBasemapStyle,
  type PolarZoomConfig,
} from '@/utils/lobeliaBasemap'
import {
  createTdtAdminLayer,
  createTdtLabelLayer,
  setTdtLayerZoomLimits,
} from '@/utils/tiandituLayers'
import type { MapCrsKey } from '@/utils/leafletProjCrs'

const NCWMS_BASE = '/ncwms2/wms'

interface LayerOption {
  value: string
  label: string
  timeDim?: string
}

interface LayerMeta {
  scaleRange: [number, number]
  units: string
  defaultPalette?: string
  nearestTimeIso?: string
}

const projectionOptions = [
  { label: '南极极地（EPSG:32761）', value: 'EPSG:32761' },
  { label: '北极极地（EPSG:32661）', value: 'EPSG:32661' },
  { label: '全球（Web Mercator）', value: 'EPSG:4326' },
]

const basemapOptions = [
  { label: '浅色 light', value: 'light' },
  { label: '深色 dark', value: 'dark' },
]

const paletteOptions = [
  { label: 'div-RdBu', value: 'div-RdBu' },
  { label: 'div-BrBG', value: 'div-BrBG' },
  { label: 'default', value: 'default' },
  { label: 'seq-Blues', value: 'seq-Blues' },
]

let map: L.Map | null = null
let basemapLayer: L.TileLayer | null = null
let adminLayer: L.TileLayer | null = null
let labelLayer: L.TileLayer | null = null
let dataLayer: L.TileLayer.WMS | null = null

const loading = ref(false)
const panelCollapsed = ref(false)
const selectedProjection = ref<MapCrsKey>('EPSG:32761')
const selectedBasemap = ref<LobeliaBasemapStyle>('light')
const showDataLayer = ref(true)
const showAdminLayer = ref(true)
const showLabelLayer = ref(true)
const layerOptions = ref<LayerOption[]>([])
const selectedLayer = ref('')
const selectedTime = ref('')
const timeOptions = ref<{ label: string; value: string }[]>([])
const showTime = ref(false)
const selectedPalette = ref('div-RdBu')
const colorMin = ref(0)
const colorMax = ref(1)
const currentUnit = ref('m/s')
const layerVersion = ref(0)
const wmsLoadError = ref('')
const dataOpacity = ref(0.45)
const polarMinZoom = ref(DEFAULT_POLAR_ZOOM.min)
const polarMaxZoom = ref(DEFAULT_POLAR_ZOOM.max)
const polarDefaultZoom = ref(DEFAULT_POLAR_ZOOM.default)
const polarEffectiveMinZoom = ref(DEFAULT_POLAR_ZOOM.min)
const mercatorEffectiveMinZoom = ref(0)
const currentMapZoom = ref(DEFAULT_POLAR_ZOOM.default)

const isPolar = computed(() => selectedProjection.value !== 'EPSG:4326')
const polarZoomConfig = computed((): PolarZoomConfig => clampPolarZoom({
  min: polarMinZoom.value,
  max: polarMaxZoom.value,
  default: polarDefaultZoom.value,
}))
const colorscalerange = computed(() => `${colorMin.value},${colorMax.value}`)
const legendUrl = computed(() => {
  if (!selectedLayer.value || !showDataLayer.value) return ''
  return `${NCWMS_BASE}?service=WMS&version=1.3.0&request=GetLegendGraphic&layers=${selectedLayer.value}&styles=raster/${selectedPalette.value}&colorscalerange=${colorscalerange.value}&NUMCOLORBANDS=20&width=24&height=160&format=image/png&_v=${layerVersion.value}`
})

function parseTimeDimension(dim: string) {
  const text = dim.trim()
  if (!text) return []
  const parts = text.split('/')
  if (parts.length < 2) return [{ label: text, value: text }]
  const start = new Date(parts[0])
  const end = new Date(parts[1])
  const period = parts[2] || 'PT3H'
  const match = period.match(/PT(\d+)H/)
  const stepHours = match ? Number(match[1]) : 3
  const stepMs = stepHours * 3600 * 1000
  const options: { label: string; value: string }[] = []
  for (let t = start.getTime(); t <= end.getTime(); t += stepMs) {
    const iso = new Date(t).toISOString().replace('.000Z', 'Z')
    options.push({ label: iso.replace('T', ' ').replace('Z', ' UTC'), value: iso })
  }
  return options
}

async function fetchCapabilities() {
  const url = `${NCWMS_BASE}?service=WMS&version=1.3.0&request=GetCapabilities`
  const text = await (await fetch(url)).text()
  const doc = new DOMParser().parseFromString(text, 'text/xml')
  const layers: LayerOption[] = []
  doc.querySelectorAll('Layer[queryable="1"]').forEach((el) => {
    const name = el.querySelector(':scope > Name')?.textContent?.trim()
    const title = el.querySelector(':scope > Title')?.textContent?.trim()
    if (!name || !name.includes('/')) return
    layers.push({
      value: name,
      label: title ? `${title}（${name.split('/')[1]}）` : name,
      timeDim: el.querySelector(':scope > Dimension[name="time"]')?.textContent?.trim(),
    })
  })
  return layers
}

async function fetchLayerMeta(layerName: string): Promise<LayerMeta | null> {
  const url = `${NCWMS_BASE}?service=WMS&version=1.3.0&request=GetMetadata&item=layerDetails&layerName=${encodeURIComponent(layerName)}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function destroyMap() {
  if (dataLayer && map) {
    map.removeLayer(dataLayer)
    dataLayer = null
  }
  if (labelLayer && map) {
    map.removeLayer(labelLayer)
    labelLayer = null
  }
  if (adminLayer && map) {
    map.removeLayer(adminLayer)
    adminLayer = null
  }
  if (basemapLayer && map) {
    map.removeLayer(basemapLayer)
    basemapLayer = null
  }
  if (map) {
    map.remove()
    map = null
  }
}

function syncTdtLayers() {
  if (!map) return

  if (adminLayer) {
    map.removeLayer(adminLayer)
    adminLayer = null
  }
  if (labelLayer) {
    map.removeLayer(labelLayer)
    labelLayer = null
  }

  if (!isPolar.value && showAdminLayer.value) {
    adminLayer = createTdtAdminLayer()
    adminLayer.addTo(map)
  }

  if (dataLayer) dataLayer.bringToFront()

  if (!isPolar.value && showLabelLayer.value) {
    labelLayer = createTdtLabelLayer()
    labelLayer.addTo(map)
    labelLayer.bringToFront()
  } else if (dataLayer) {
    dataLayer.bringToFront()
  }

  if (isPolar.value) {
    applyPolarZoom(false)
  } else {
    applyMercatorZoom(false)
  }
}

function resizeMap() {
  map?.invalidateSize({ animate: false })
}

function bindMapViewEvents() {
  if (!map) return
  map.off('zoomend', onMapViewChange)
  map.off('moveend', onMapViewChange)
  map.on('zoomend', onMapViewChange)
  map.on('moveend', onMapViewChange)
  currentMapZoom.value = map.getZoom()
}

function onMapViewChange() {
  if (!map) return
  if (isPolar.value) {
    clampPolarView(map)
  } else {
    clampMercatorView(map)
  }
  currentMapZoom.value = map.getZoom()
}

function applyMercatorZoom(resetView = false) {
  if (!map || isPolar.value) return
  mercatorEffectiveMinZoom.value = applyMercatorZoomToMap(
    map,
    { basemap: basemapLayer, data: dataLayer },
    { resetView },
  )
  setTdtLayerZoomLimits(
    [adminLayer, labelLayer],
    mercatorEffectiveMinZoom.value,
    DEFAULT_MERCATOR_ZOOM.max,
  )
  currentMapZoom.value = map.getZoom()
}

function applyPolarZoom(resetView = false) {
  if (!map || !isPolar.value) return
  const effective = applyPolarZoomToMap(
    map,
    polarZoomConfig.value,
    selectedProjection.value,
    { basemap: basemapLayer, data: dataLayer },
    { resetView },
  )
  polarEffectiveMinZoom.value = effective.min
  currentMapZoom.value = map.getZoom()
}

function initMapView() {
  if (!map) return
  if (isPolar.value) {
    applyPolarZoom(true)
  } else {
    applyMercatorZoom(true)
  }
}

function scheduleMapView() {
  requestAnimationFrame(() => {
    resizeMap()
    requestAnimationFrame(() => initMapView())
  })
}

function addBasemap() {
  if (!map) return
  if (basemapLayer) {
    map.removeLayer(basemapLayer)
    basemapLayer = null
  }
  basemapLayer = createLobeliaBasemapLayer(
    selectedBasemap.value,
    selectedProjection.value,
    isPolar.value ? polarZoomConfig.value : undefined,
  )
  basemapLayer.addTo(map)
  basemapLayer.bringToBack()
}

function buildWmsOptions(): L.WMSOptions {
  const opts: Record<string, string> = {
    layers: selectedLayer.value,
    styles: `raster/${selectedPalette.value}`,
    format: 'image/png',
    transparent: 'true',
    version: '1.3.0',
    colorscalerange: colorscalerange.value,
    NUMCOLORBANDS: '20',
    _v: String(layerVersion.value),
  }
  if (showTime.value && selectedTime.value) opts.time = selectedTime.value
  return opts as L.WMSOptions
}

function applyDataOpacity() {
  dataLayer?.setOpacity(dataOpacity.value)
}

function refreshDataLayer() {
  if (!map || !selectedLayer.value) return
  layerVersion.value++
  wmsLoadError.value = ''

  if (dataLayer) {
    map.removeLayer(dataLayer)
    dataLayer = null
  }

  if (!showDataLayer.value) return

  const mapCrs = map.options.crs!
  const zoomLimits = isPolar.value ? polarZoomConfig.value : undefined
  dataLayer = L.tileLayer.wms(NCWMS_BASE, {
    ...buildWmsOptions(),
    crs: mapCrs,
    continuousWorld: true,
    uppercase: true,
    opacity: dataOpacity.value,
    minZoom: zoomLimits?.min ?? 0,
    maxZoom: zoomLimits?.max ?? 22,
  })
  dataLayer.addTo(map)
  if (labelLayer) {
    labelLayer.bringToFront()
  } else {
    dataLayer.bringToFront()
  }

  if (isPolar.value) {
    applyPolarZoom(false)
  } else {
    applyMercatorZoom(false)
  }

  dataLayer.on('tileerror', () => {
    wmsLoadError.value = '数据瓦片加载失败，请检查 ncWMS 是否支持当前投影'
  })
}

function createMap() {
  destroyMap()
  const projection = selectedProjection.value
  const crs = getLobeliaMapCrs(projection)
  const isMercator = projection === 'EPSG:4326'

  map = L.map('lobelia-polar-map', {
    crs,
    center: getLobeliaDefaultCenter(projection),
    zoom: isMercator ? DEFAULT_MERCATOR_ZOOM.default : polarZoomConfig.value.default,
    minZoom: isMercator ? 0 : polarZoomConfig.value.min,
    maxZoom: isMercator ? DEFAULT_MERCATOR_ZOOM.max : polarZoomConfig.value.max,
    zoomControl: true,
    continuousWorld: true,
    worldCopyJump: false,
    ...(isMercator ? getMercatorMapOptions() : getPolarMapOptions(crs)),
  })

  bindMapViewEvents()
  addBasemap()
  syncTdtLayers()
  refreshDataLayer()
  scheduleMapView()
}

function onPolarZoomApply() {
  applyPolarZoom(true)
}

function onPolarZoomLimitsChange() {
  const z = clampPolarZoom({
    min: polarMinZoom.value,
    max: polarMaxZoom.value,
    default: polarDefaultZoom.value,
  })
  polarMinZoom.value = z.min
  polarMaxZoom.value = z.max
  polarDefaultZoom.value = z.default
  applyPolarZoom(false)
}

async function onLayerChange(layerName: string) {
  const layer = layerOptions.value.find((item) => item.value === layerName)
  showTime.value = Boolean(layer?.timeDim)
  timeOptions.value = layer?.timeDim ? parseTimeDimension(layer.timeDim) : []
  selectedTime.value = timeOptions.value[0]?.value || ''

  const meta = await fetchLayerMeta(layerName)
  if (meta?.scaleRange?.length === 2) {
    colorMin.value = meta.scaleRange[0]
    colorMax.value = meta.scaleRange[1]
    currentUnit.value = meta.units || ''
  }
  if (meta?.defaultPalette) selectedPalette.value = meta.defaultPalette
  if (!selectedTime.value && meta?.nearestTimeIso) {
    selectedTime.value = meta.nearestTimeIso
  }

  refreshDataLayer()
}

function onProjectionChange() {
  createMap()
}

function onBasemapChange() {
  addBasemap()
}

function onFilterChange() {
  refreshDataLayer()
}

function onWindowResize() {
  resizeMap()
  if (isPolar.value) applyPolarZoom(false)
  else applyMercatorZoom(false)
}

async function initPage() {
  loading.value = true
  try {
    layerOptions.value = await fetchCapabilities()
    const preferred = layerOptions.value.find((l) => l.value.includes('Water_u'))
      || layerOptions.value.find((l) => l.value.includes('velocity'))
      || layerOptions.value[0]
    if (preferred) {
      selectedLayer.value = preferred.value
      await onLayerChange(preferred.value)
    }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await initPage()
  createMap()
  window.addEventListener('resize', onWindowResize)
})

watch(dataOpacity, applyDataOpacity)
watch(panelCollapsed, () => {
  resizeMap()
  if (isPolar.value) applyPolarZoom(false)
  else applyMercatorZoom(false)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize)
  destroyMap()
})
</script>

<template>
  <div class="page">
    <div id="lobelia-polar-map" class="map" />

    <div class="settings-panel" :class="{ collapsed: panelCollapsed }">
      <div class="panel-header">
        <span>Lobelia 极地底图 Demo</span>
        <button class="collapse-btn" @click="panelCollapsed = !panelCollapsed">
          {{ panelCollapsed ? '»' : '«' }}
        </button>
      </div>

      <div v-show="!panelCollapsed" v-loading="loading" class="panel-body">
        <p class="hint-text attribution">
          {{ LOBELIA_ATTRIBUTION }}
        </p>

        <div class="form-item">
          <label>底图样式</label>
          <el-select v-model="selectedBasemap" @change="onBasemapChange">
            <el-option
              v-for="item in basemapOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>

        <div class="form-item">
          <label>投影</label>
          <el-select v-model="selectedProjection" @change="onProjectionChange">
            <el-option
              v-for="item in projectionOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <p v-if="isPolar" class="hint-text">
            极地模式：可设置缩放层级范围；实际最小缩放会随窗口大小自动抬高，避免缩到中间一小块
          </p>
        </div>

        <template v-if="isPolar">
          <div class="form-divider">极地缩放</div>
          <div class="form-item">
            <label>当前缩放 {{ currentMapZoom }}</label>
          </div>
          <div class="form-item">
            <label>最小缩放 {{ polarMinZoom }}</label>
            <el-slider
              v-model="polarMinZoom"
              :min="2"
              :max="8"
              :step="1"
              @change="onPolarZoomLimitsChange"
            />
            <p v-if="polarEffectiveMinZoom > polarMinZoom" class="hint-text">
              实际最小缩放（铺满视口）：{{ polarEffectiveMinZoom }}
            </p>
          </div>
          <div class="form-item">
            <label>最大缩放 {{ polarMaxZoom }}</label>
            <el-slider
              v-model="polarMaxZoom"
              :min="0"
              :max="8"
              :step="1"
              @change="onPolarZoomLimitsChange"
            />
          </div>
          <div class="form-item">
            <label>初始缩放 {{ polarDefaultZoom }}</label>
            <el-slider
              v-model="polarDefaultZoom"
              :min="polarMinZoom"
              :max="polarMaxZoom"
              :step="1"
            />
          </div>
          <button type="button" class="apply-btn secondary" @click="onPolarZoomApply">
            应用并定位到初始缩放
          </button>
        </template>

        <div class="form-item checkbox-row">
          <el-checkbox v-model="showAdminLayer" :disabled="isPolar" @change="syncTdtLayers">
            叠加天地图区划（vec_w）
          </el-checkbox>
        </div>
        <div class="form-item checkbox-row">
          <el-checkbox v-model="showLabelLayer" :disabled="isPolar" @change="syncTdtLayers">
            叠加天地图注记（cia_w）
          </el-checkbox>
        </div>
        <p v-if="isPolar" class="hint-text">
          天地图区划/注记仅支持全球 Web Mercator 投影
        </p>

        <div class="form-item checkbox-row">
          <el-checkbox v-model="showDataLayer" @change="refreshDataLayer">
            叠加 ncWMS 数据层
          </el-checkbox>
        </div>

        <template v-if="showDataLayer">
          <div class="form-item">
            <label>数据层透明度 {{ Math.round(dataOpacity * 100) }}%</label>
            <el-slider
              v-model="dataOpacity"
              :min="0.1"
              :max="1"
              :step="0.05"
            />
          </div>

          <div class="form-item">
            <label>数据变量</label>
            <el-select
              v-model="selectedLayer"
              filterable
              placeholder="选择 ncWMS 图层"
              @change="onLayerChange"
            >
              <el-option
                v-for="item in layerOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>

          <div v-if="showTime" class="form-item">
            <label>时间</label>
            <el-select v-model="selectedTime" @change="onFilterChange">
              <el-option
                v-for="item in timeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>

          <div class="form-item">
            <label>色板</label>
            <el-select v-model="selectedPalette" @change="onFilterChange">
              <el-option
                v-for="item in paletteOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>

          <div class="form-item range-row">
            <div class="range-field">
              <label>最小值</label>
              <el-input-number v-model="colorMin" :controls="false" class="range-input" />
            </div>
            <div class="range-field">
              <label>最大值</label>
              <el-input-number v-model="colorMax" :controls="false" class="range-input" />
            </div>
          </div>

          <button type="button" class="apply-btn" @click="onFilterChange">
            刷新数据层
          </button>

          <p v-if="wmsLoadError" class="wms-error">{{ wmsLoadError }}</p>
        </template>
      </div>
    </div>

    <div v-if="showDataLayer && legendUrl" class="legend-wrap">
      <img :key="legendUrl" :src="legendUrl" class="legend-img" alt="色标图例">
      <div class="legend-range">
        <span>{{ colorMin }}{{ currentUnit ? ` ${currentUnit}` : '' }}</span>
        <span>{{ colorMax }}{{ currentUnit ? ` ${currentUnit}` : '' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
}
.map {
  width: 100%;
  height: 100%;
  background: #dfe8ef;
}
:deep(.leaflet-container) {
  width: 100%;
  height: 100%;
  font-family: inherit;
}
.settings-panel {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 1000;
  width: 300px;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}
.settings-panel.collapsed {
  width: auto;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #eee;
}
.collapse-btn {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  padding: 0 4px;
}
.panel-body {
  padding: 12px 14px 16px;
}
.form-item {
  margin-bottom: 14px;
}
.form-item label {
  display: block;
  font-size: 13px;
  color: #333;
  margin-bottom: 6px;
}
.form-item :deep(.el-select) {
  width: 100%;
}
.hint-text {
  font-size: 12px;
  color: #888;
  line-height: 1.5;
  margin: 6px 0 0;
}
.attribution {
  padding: 8px 10px;
  background: #f5f8fc;
  border-radius: 4px;
  color: #666;
  margin: 0 0 12px;
}
.checkbox-row {
  margin-bottom: 10px;
}
.range-row {
  display: flex;
  gap: 10px;
}
.range-field {
  flex: 1;
}
.range-input {
  width: 100%;
}
.form-divider {
  margin: 12px 0 10px;
  padding-top: 12px;
  border-top: 1px solid #eee;
  font-size: 13px;
  font-weight: 600;
}
.apply-btn {
  width: 100%;
  padding: 8px 0;
  border: none;
  border-radius: 4px;
  background: #3c50a7;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}
.apply-btn:hover {
  background: #344796;
}
.wms-error {
  margin-top: 8px;
  font-size: 12px;
  color: #f56c6c;
}
.legend-wrap {
  position: absolute;
  right: 16px;
  bottom: 24px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.92);
  padding: 8px 10px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
.legend-img {
  display: block;
  width: 28px;
  height: 160px;
  object-fit: contain;
}
.legend-range {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #555;
  margin-top: 4px;
  gap: 8px;
}
</style>
