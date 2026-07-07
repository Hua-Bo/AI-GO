<!--
  WMS 多源可视化页面（test28 — Leaflet + Proj4Leaflet）
  4326 → Web Mercator；32661/32761/3413 → Proj4Leaflet 自定义 CRS + WMS 瓦片
  访问：/#/test28 或 /#/ncwms-leaflet
-->
<script setup lang="ts">
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  getLeafletCrs,
  getMapCrsMeta,
  getProjectedBounds,
  getWmsImageBbox,
  normalizeProjection,
  resolveMapCrsKey,
  usesPolarImageMode,
  type MapCrsKey,
} from '@/utils/leafletProjCrs'

const NCWMS_BASE = '/ncwms2/wms'
const GEOSERVER_WMS_BASE = '/geoserver/cite/wms'
const TDT_TOKEN = '0866c3992f556685911c58b631f978c0'

type WmsProvider = 'ncwms' | 'geoserver'

interface LayerOption {
  value: string
  label: string
  timeDim?: string
  elevDim?: string
  dataset?: string
  provider?: WmsProvider
  wmsStyle?: string
  imageBbox?: string
  imageSrs?: string
  imageSize?: [number, number]
  forceImageOverlay?: boolean
}

interface DataSourceOption {
  value: string
  label: string
}

interface LayerMeta {
  scaleRange: [number, number]
  units: string
  palettes?: string[]
  defaultPalette?: string
  nearestTimeIso?: string
}

const COMMON_PALETTE_OPTIONS = [
  { label: '默认 default', value: 'default' },
  { label: '红蓝发散 div-RdBu', value: 'div-RdBu' },
  { label: '光谱 div-Spectral', value: 'div-Spectral' },
  { label: '橙红顺序 seq-OrRd', value: 'seq-OrRd' },
  { label: '蓝色顺序 seq-Blues', value: 'seq-Blues' },
  { label: '绿色顺序 seq-Greens', value: 'seq-Greens' },
]

const projectionOptions = [
  { label: '赤道投影（EPSG:4326）', value: 'EPSG:4326' },
  { label: '北极极地投影（EPSG:32661）', value: 'EPSG:32661' },
  { label: '南极极地投影（EPSG:32761）', value: 'EPSG:32761' },
]

const DATA_SOURCE_LABELS: Record<string, string> = {
  mfwam: 'MFWAM 海浪预报',
  gebco: 'GEBCO 海底地形',
  ibcao: 'IBCAO 北极海底地形',
}

const GEBCO_LAYER = 'gebco/elevation'
const IBCAO_LAYER = 'cite:ibcao_3413'
const GEBCO_SCALE: [number, number] = [-8000, 5000]
const GEBCO_PALETTE = 'div-RdBu'

const IBCAO_3413_BBOX = '-4060480,-4060480,4060480,4060480'

const PREFERRED_LAYER: Record<string, string> = {
  gebco: GEBCO_LAYER,
  ibcao: IBCAO_LAYER,
}

const STATIC_LAYERS: LayerOption[] = [
  {
    value: IBCAO_LAYER,
    label: 'IBCAO 北极海底地形（ibcao_3413）',
    dataset: 'ibcao',
    provider: 'geoserver',
    wmsStyle: 'ibcao_bathymetry',
    imageSrs: 'EPSG:3413',
    imageBbox: IBCAO_3413_BBOX,
    imageSize: [1024, 1024],
    forceImageOverlay: true,
  },
]

let map: L.Map | null = null
let baseImgLayer: L.TileLayer | null = null
let baseLabelLayer: L.TileLayer | null = null
let wmsLayer: L.TileLayer.WMS | null = null
let imageOverlayLayer: L.Layer | null = null
let activeCrsKey: MapCrsKey = 'EPSG:4326'
const wmsLoadError = ref('')

const panelCollapsed = ref(false)
const loading = ref(false)
const dataSourceOptions = ref<DataSourceOption[]>([])
const selectedDataSource = ref('')
const allLayers = ref<LayerOption[]>([])
const featureOptions = ref<LayerOption[]>([])
const timeOptions = ref<{ label: string; value: string }[]>([])
const elevationOptions = ref<{ label: string; value: string }[]>([])
const selectedFeature = ref('')
const selectedTime = ref('')
const selectedElevation = ref('')
const selectedProjection = ref('EPSG:4326')
const showTime = ref(false)
const showElevation = ref(false)
const colorMin = ref(0)
const colorMax = ref(8)
const currentUnit = ref('m')
const selectedPalette = ref('default')
const numColorBands = ref(20)
const logScale = ref(false)
const paletteOptions = ref(COMMON_PALETTE_OPTIONS)
const layerVersion = ref(0)

const currentLayer = computed(() =>
  allLayers.value.find((layer) => layer.value === selectedFeature.value)
  || featureOptions.value.find((layer) => layer.value === selectedFeature.value),
)

const isGeoServerLayer = computed(() => currentLayer.value?.provider === 'geoserver')
const showNcwmsColorConfig = computed(() => !isGeoServerLayer.value)
const showColorBar = computed(() => showNcwmsColorConfig.value)
const isPolarMode = computed(() => selectedProjection.value !== 'EPSG:4326')

const colorscalerange = computed(() => `${colorMin.value},${colorMax.value}`)

const legendUrl = computed(() => {
  if (!showNcwmsColorConfig.value || !selectedFeature.value) return ''
  const log = logScale.value ? '&LOGSCALE=true' : ''
  return `${NCWMS_BASE}?service=WMS&version=1.3.0&request=GetLegendGraphic&layers=${selectedFeature.value}&styles=raster/${selectedPalette.value}&colorscalerange=${colorscalerange.value}&NUMCOLORBANDS=${numColorBands.value}${log}&width=24&height=160&format=image/png&_v=${layerVersion.value}`
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

function parseElevationDimension(dim: string) {
  return dim.trim().split(',').map((v) => {
    const val = v.trim()
    return { label: `${val} m`, value: val }
  })
}

async function fetchCapabilities(): Promise<LayerOption[]> {
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
      elevDim: el.querySelector(':scope > Dimension[name="elevation"]')?.textContent?.trim(),
      dataset: name.split('/')[0],
      provider: 'ncwms',
    })
  })
  return [...STATIC_LAYERS, ...layers]
}

function buildDataSourceOptions(layers: LayerOption[]) {
  const datasets = [...new Set(layers.map((l) => l.dataset).filter(Boolean) as string[])]
  return datasets.map((value) => ({ value, label: DATA_SOURCE_LABELS[value] || value }))
}

function filterLayersBySource(source: string) {
  return allLayers.value.filter((layer) => layer.dataset === source)
}

async function fetchLayerMeta(layerName: string, provider: WmsProvider = 'ncwms'): Promise<LayerMeta | null> {
  if (provider === 'geoserver') return null
  const url = `${NCWMS_BASE}?service=WMS&version=1.3.0&request=GetMetadata&item=layerDetails&layerName=${encodeURIComponent(layerName)}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function applyScaleRange(min: number, max: number, unit: string) {
  colorMin.value = min
  colorMax.value = max
  currentUnit.value = unit || ''
}

function buildNcwmsWmsOptions(layerName: string, mapCrs: L.CRS): L.WMSOptions {
  const opts: Record<string, string> = {
    layers: layerName,
    styles: `raster/${selectedPalette.value}`,
    format: 'image/png',
    transparent: 'true',
    version: '1.3.0',
    colorscalerange: colorscalerange.value,
    NUMCOLORBANDS: String(numColorBands.value),
    _v: String(layerVersion.value),
  }
  if (logScale.value) opts.LOGSCALE = 'true'
  if (showTime.value && selectedTime.value) opts.time = selectedTime.value
  if (showElevation.value && selectedElevation.value) opts.elevation = selectedElevation.value
  return { ...opts, crs: mapCrs } as L.WMSOptions
}

function buildPolarImageWmsUrl(layer: LayerOption, crsKey: MapCrsKey) {
  const meta = getMapCrsMeta(crsKey)
  const bbox = getWmsImageBbox(crsKey, layer.imageBbox)
  const v = layerVersion.value

  if (layer.provider === 'geoserver') {
    return [
      `${GEOSERVER_WMS_BASE}?service=WMS&version=1.1.0&request=GetMap`,
      `layers=${encodeURIComponent(layer.value)}`,
      `styles=${layer.wmsStyle || ''}`,
      'format=image/png&transparent=true',
      `srs=${meta.wmsCode}`,
      `bbox=${bbox}`,
      'width=1024&height=1024',
      `_v=${v}`,
    ].join('&')
  }

  const parts = [
    `${NCWMS_BASE}?service=WMS&version=1.3.0&request=GetMap`,
    `layers=${layer.value}`,
    `styles=raster/${selectedPalette.value}`,
    'format=image/png&transparent=true',
    `colorscalerange=${colorscalerange.value}`,
    `NUMCOLORBANDS=${numColorBands.value}`,
    `crs=${meta.wmsCode}`,
    `bbox=${bbox}`,
    'width=1024&height=1024',
    `_v=${v}`,
  ]
  if (logScale.value) parts.push('LOGSCALE=true')
  if (showTime.value && selectedTime.value) parts.push(`time=${encodeURIComponent(selectedTime.value)}`)
  if (showElevation.value && selectedElevation.value) parts.push(`elevation=${selectedElevation.value}`)
  return parts.join('&')
}

function applyProjectionForLayer(projection: string, layerValue?: string) {
  const normalized = normalizeProjection(projection, layerValue)
  if (normalized !== projection) {
    selectedProjection.value = normalized
    ElMessage.warning('IBCAO 为北极数据，不能使用南极投影，已切换为北极极地投影')
  }
  return normalized
}

function buildGeoServerWmsOptions(layer: LayerOption, mapCrs: L.CRS): L.WMSOptions {
  return {
    layers: layer.value,
    styles: layer.wmsStyle || '',
    format: 'image/png',
    transparent: true,
    version: '1.1.0',
    crs: mapCrs,
    _v: String(layerVersion.value),
  } as L.WMSOptions
}

function setBaseMapVisible(visible: boolean) {
  if (!map || !baseImgLayer || !baseLabelLayer) return
  if (visible) {
    baseImgLayer.addTo(map)
    baseLabelLayer.addTo(map)
  } else {
    map.removeLayer(baseImgLayer)
    map.removeLayer(baseLabelLayer)
  }
}

function invalidateMapSize() {
  map?.invalidateSize({ animate: false })
}

const MERCATOR_WORLD_BOUNDS = L.latLngBounds([-85, -180], [85, 180])

function updateViewportZoomLimits() {
  if (!map || selectedProjection.value !== 'EPSG:4326') return
  invalidateMapSize()
  // inside=true：最小 zoom 使全球范围铺满视口，宽屏不再上下留黑边
  const fillMinZoom = map.getBoundsZoom(MERCATOR_WORLD_BOUNDS, true)
  map.setMinZoom(fillMinZoom)
  baseImgLayer?.setMinZoom(fillMinZoom)
  baseLabelLayer?.setMinZoom(fillMinZoom)
  if (map.getZoom() < fillMinZoom) {
    map.setZoom(fillMinZoom)
  }
}

function fitPolarView(crsKey: MapCrsKey) {
  if (!map || crsKey === 'EPSG:4326') return
  invalidateMapSize()
  const projBounds = getProjectedBounds(crsKey as Exclude<MapCrsKey, 'EPSG:4326'>)
  const crs = map.options.crs!
  const sw = crs.unproject(L.point(projBounds.min.x, projBounds.min.y))
  const ne = crs.unproject(L.point(projBounds.max.x, projBounds.max.y))
  map.fitBounds(L.latLngBounds(sw, ne), { padding: [0, 0], animate: false })
}

function fitViewForCrs(crsKey?: MapCrsKey) {
  if (!map) return
  const key = crsKey || activeCrsKey
  const meta = getMapCrsMeta(key)
  invalidateMapSize()

  if (key === 'EPSG:4326') {
    updateViewportZoomLimits()
    const z = Math.max(map.getMinZoom(), meta.defaultZoom)
    map.setView(meta.defaultCenter, z, { animate: false })
    return
  }

  map.setMinZoom(0)
  baseImgLayer?.setMinZoom(0)
  baseLabelLayer?.setMinZoom(0)
  fitPolarView(key)
}

function syncMapView() {
  fitViewForCrs()
}

function scheduleMapView() {
  requestAnimationFrame(() => {
    invalidateMapSize()
    requestAnimationFrame(() => syncMapView())
  })
}

function removeDataLayer() {
  if (!map) return
  if (wmsLayer) {
    map.removeLayer(wmsLayer)
    wmsLayer = null
  }
  if (imageOverlayLayer) {
    map.removeLayer(imageOverlayLayer)
    imageOverlayLayer = null
  }
}

async function verifyWmsImage(url: string) {
  try {
    const res = await fetch(url)
    if (!res.ok || !res.headers.get('content-type')?.includes('image')) {
      wmsLoadError.value = `WMS 请求失败（HTTP ${res.status}），请检查 ncWMS / GeoServer 服务`
      return
    }
    wmsLoadError.value = ''
  } catch {
    wmsLoadError.value = 'WMS 请求失败，请检查内网服务是否可达'
  }
}

function refreshLayer() {
  const layer = currentLayer.value
  if (!map || !layer) return

  layerVersion.value++
  removeDataLayer()
  wmsLoadError.value = ''

  if (usesPolarImageMode(activeCrsKey)) {
    const url = buildPolarImageWmsUrl(layer, activeCrsKey)
    const projBounds = getProjectedBounds(activeCrsKey as Exclude<MapCrsKey, 'EPSG:4326'>)
    const LProj = (L as typeof L & { Proj: typeof L.Proj }).Proj
    imageOverlayLayer = LProj.imageOverlay(url, projBounds, { opacity: 0.92 })
    imageOverlayLayer.addTo(map)
    imageOverlayLayer.bringToFront()
    setBaseMapVisible(false)
    verifyWmsImage(url)
    scheduleMapView()
    return
  }

  setBaseMapVisible(true)
  const mapCrs = map.options.crs!
  const base = layer.provider === 'geoserver' ? GEOSERVER_WMS_BASE : NCWMS_BASE
  const options = layer.provider === 'geoserver'
    ? buildGeoServerWmsOptions(layer, mapCrs)
    : buildNcwmsWmsOptions(layer.value, mapCrs)

  wmsLayer = L.tileLayer.wms(base, {
    ...options,
    crs: mapCrs,
    continuousWorld: true,
    uppercase: true,
  })
  wmsLayer.addTo(map)
  wmsLayer.bringToFront()
}

function applyLayerScale(layerName: string, meta: LayerMeta | null) {
  if (layerName.startsWith('gebco/')) {
    applyScaleRange(GEBCO_SCALE[0], GEBCO_SCALE[1], meta?.units || 'm')
    return
  }
  if (meta?.scaleRange?.length === 2) {
    applyScaleRange(meta.scaleRange[0], meta.scaleRange[1], meta.units)
  }
}

function applyLayerPalette(layerName: string, meta: LayerMeta | null) {
  paletteOptions.value = meta?.palettes?.length
    ? meta.palettes.map((name) => ({ label: name, value: name }))
    : COMMON_PALETTE_OPTIONS
  selectedPalette.value = layerName.startsWith('gebco/')
    ? GEBCO_PALETTE
    : (meta?.defaultPalette || 'default')
}

function applyColorConfig() {
  refreshLayer()
}

async function loadFeatureDimensions(feature: LayerOption) {
  showTime.value = !!feature.timeDim
  showElevation.value = !!feature.elevDim
  timeOptions.value = feature.timeDim ? parseTimeDimension(feature.timeDim) : []
  elevationOptions.value = feature.elevDim ? parseElevationDimension(feature.elevDim) : []
  selectedTime.value = timeOptions.value[0]?.value || ''
  selectedElevation.value = elevationOptions.value[0]?.value || ''
}

async function onFeatureChange(layerName: string) {
  loading.value = true
  const feature = featureOptions.value.find((f) => f.value === layerName)
  if (feature) await loadFeatureDimensions(feature)

  if (feature?.provider !== 'geoserver') {
    const meta = await fetchLayerMeta(layerName, feature?.provider)
    applyLayerScale(layerName, meta)
    applyLayerPalette(layerName, meta)
    numColorBands.value = 20
    logScale.value = false
    if (!selectedTime.value && meta?.nearestTimeIso) {
      selectedTime.value = meta.nearestTimeIso
    }
  }

  loading.value = false
  const proj = applyProjectionForLayer(selectedProjection.value, layerName)
  switchMapCrs(resolveMapCrsKey(proj, layerName))
}

async function onDataSourceChange(source: string) {
  featureOptions.value = filterLayersBySource(source)
  const preferred = featureOptions.value.find((item) => item.value === PREFERRED_LAYER[source])
  const nextLayer = preferred?.value || featureOptions.value[0]?.value
  if (!nextLayer) return
  selectedFeature.value = nextLayer
  await onFeatureChange(nextLayer)
}

function onFilterChange() {
  refreshLayer()
}

function onProjectionChange(crs: string) {
  const proj = applyProjectionForLayer(crs, selectedFeature.value)
  switchMapCrs(resolveMapCrsKey(proj, selectedFeature.value))
}

function addBaseLayers() {
  const tileOpts: L.TileLayerOptions = { maxZoom: 18, minZoom: 2 }
  baseImgLayer = L.tileLayer(
    `https://t{s}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=${TDT_TOKEN}`,
    { ...tileOpts, subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'], attribution: '© 天地图' },
  )
  baseLabelLayer = L.tileLayer(
    `https://t{s}.tianditu.gov.cn/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=${TDT_TOKEN}`,
    { ...tileOpts, subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'] },
  )
}

function destroyMapInternal() {
  removeDataLayer()
  if (map) {
    map.remove()
    map = null
  }
  baseImgLayer = null
  baseLabelLayer = null
}

function createMap(crsKey: MapCrsKey) {
  destroyMapInternal()

  activeCrsKey = crsKey
  const leafletCrs = getLeafletCrs(crsKey)
  const meta = getMapCrsMeta(crsKey)
  const isMercator = crsKey === 'EPSG:4326'

  map = L.map('leaflet-ncwms-map', {
    crs: leafletCrs,
    center: meta.defaultCenter,
    zoom: meta.defaultZoom,
    minZoom: isMercator ? 2 : 0,
    maxZoom: isMercator ? 18 : 12,
    zoomControl: true,
    continuousWorld: true,
    worldCopyJump: false,
    ...(isMercator ? { maxBounds: [[-85, -180], [85, 180]] as L.LatLngBoundsExpression, maxBoundsViscosity: 1 } : {}),
  })

  if (meta.showBaseMap) {
    addBaseLayers()
    baseImgLayer!.addTo(map)
    baseLabelLayer!.addTo(map)
  }

  refreshLayer()
  scheduleMapView()
}

function switchMapCrs(crsKey: MapCrsKey) {
  if (crsKey === activeCrsKey && map) {
    refreshLayer()
    requestAnimationFrame(() => fitViewForCrs(crsKey))
    return
  }
  createMap(crsKey)
}

async function initPage() {
  loading.value = true
  allLayers.value = await fetchCapabilities()
  dataSourceOptions.value = buildDataSourceOptions(allLayers.value)
  const defaultSource = dataSourceOptions.value.find((item) => item.value === 'gebco')?.value
    || dataSourceOptions.value[0]?.value
    || ''
  if (defaultSource) {
    selectedDataSource.value = defaultSource
    await onDataSourceChange(defaultSource)
  }
  loading.value = false
}

function onWindowResize() {
  if (activeCrsKey === 'EPSG:4326') {
    updateViewportZoomLimits()
  } else {
    invalidateMapSize()
    fitPolarView(activeCrsKey)
  }
}

onMounted(async () => {
  await initPage()
  if (!map) createMap('EPSG:4326')
  window.addEventListener('resize', onWindowResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize)
  destroyMapInternal()
})
</script>

<template>
  <div class="page">
    <div id="leaflet-ncwms-map" class="map" />

    <div class="settings-panel" :class="{ collapsed: panelCollapsed }">
      <div class="panel-header">
        <span>可视化设置（Leaflet + Proj4）</span>
        <button class="collapse-btn" @click="panelCollapsed = !panelCollapsed">
          {{ panelCollapsed ? '»' : '«' }}
        </button>
      </div>

      <div v-show="!panelCollapsed" v-loading="loading" class="panel-body">
        <div class="form-item">
          <label><span class="required">*</span> 数据源</label>
          <el-select v-model="selectedDataSource" placeholder="请选择数据源" @change="onDataSourceChange">
            <el-option v-for="item in dataSourceOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>

        <div class="form-item">
          <label><span class="required">*</span> 要素选择</label>
          <el-select v-model="selectedFeature" placeholder="请选择要素" filterable @change="onFeatureChange">
            <el-option v-for="item in featureOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>

        <div v-if="showTime" class="form-item">
          <label><span class="required">*</span> 时间选择</label>
          <el-select v-model="selectedTime" placeholder="请选择时间" @change="onFilterChange">
            <el-option v-for="item in timeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>

        <div v-if="showElevation" class="form-item">
          <label><span class="required">*</span> 垂向分层选择</label>
          <el-select v-model="selectedElevation" placeholder="请选择垂向分层" @change="onFilterChange">
            <el-option v-for="item in elevationOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>

        <div class="form-item">
          <label><span class="required">*</span> 投影选择</label>
          <el-select v-model="selectedProjection" placeholder="请选择投影" @change="onProjectionChange">
            <el-option v-for="item in projectionOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <p v-if="isPolarMode" class="hint-text polar-hint">
            极地模式无天地图底图，数据以 WMS 单图按投影坐标叠加
          </p>
          <p v-if="wmsLoadError" class="wms-error">{{ wmsLoadError }}</p>
        </div>

        <template v-if="showNcwmsColorConfig">
          <div class="form-divider">配色设置（ncWMS）</div>

          <div class="form-item palette-hint">
            <label>色板 palette</label>
            <p class="hint-text">色板通过 WMS 参数 <code>styles=raster/色板名</code> 生效，改后请点「应用配色」</p>
            <el-select v-model="selectedPalette" filterable placeholder="选择色板">
              <el-option v-for="item in paletteOptions" :key="item.value" :label="item.label" :value="item.value" />
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

          <div class="form-item">
            <label>色带分段 {{ numColorBands }}</label>
            <el-slider v-model="numColorBands" :min="5" :max="250" :step="5" />
          </div>

          <div class="form-item checkbox-row">
            <el-checkbox v-model="logScale">对数色标</el-checkbox>
          </div>

          <button type="button" class="apply-color-btn" @click="applyColorConfig">
            应用配色
          </button>
        </template>
      </div>
    </div>

    <div v-if="showColorBar" class="legend-wrap">
      <img v-if="legendUrl" :key="legendUrl" :src="legendUrl" class="legend-img" alt="色标图例">
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
  z-index: 0;
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
  width: 280px;
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
.required {
  color: #f56c6c;
  margin-right: 2px;
}
.form-item :deep(.el-select) {
  width: 100%;
}
.form-divider {
  margin: 12px 0 10px;
  padding-top: 12px;
  border-top: 1px solid #eee;
  font-size: 13px;
  font-weight: 600;
}
.range-row {
  display: flex;
  gap: 10px;
}
.range-field {
  flex: 1;
}
.range-field label {
  font-size: 12px;
  color: #666;
}
.range-input {
  width: 100%;
}
.checkbox-row {
  margin-bottom: 8px;
}
.palette-hint .hint-text {
  margin: 0 0 6px;
  font-size: 11px;
  line-height: 1.4;
  color: #888;
}
.palette-hint code {
  font-size: 10px;
  color: #666;
}
.polar-hint {
  margin-top: 6px;
  color: #909399;
}
.wms-error {
  margin: 6px 0 0;
  font-size: 12px;
  color: #f56c6c;
  line-height: 1.4;
}
.apply-color-btn {
  width: 100%;
  padding: 8px 0;
  border: none;
  border-radius: 4px;
  background: #409eff;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}
.apply-color-btn:hover {
  background: #66b1ff;
}
.legend-wrap {
  position: absolute;
  right: 24px;
  bottom: 32px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
.legend-img {
  height: 160px;
  width: 28px;
  object-fit: fill;
}
.legend-range {
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 11px;
  color: #444;
}
</style>
