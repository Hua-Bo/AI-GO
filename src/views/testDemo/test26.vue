<!--
  WMS 多源可视化页面（test26）
  - ncWMS2：海浪预报、GEBCO 海底地形等（WMS 1.3.0，支持服务端配色）
  - GeoServer：IBCAO 北极海底地形（WMS 1.1.0，服务端 SLD 样式）
  详细说明见同目录：test26_前端使用手册.md
-->
<script setup lang="ts">
import mapboxGL from 'mapbox-gl'

// =============================================================================
// 一、服务地址（开发环境走 Vite 代理，避免浏览器 CORS 拦截瓦片请求）
// 代理配置见 vite.config.ts → server.proxy
// =============================================================================
/** ncWMS2 服务（海浪、GEBCO 等），WMS 1.3.0 */
const NCWMS_BASE = '/ncwms2/wms'
/** GeoServer cite 工作空间，WMS 1.1.0 */
const GEOSERVER_WMS_BASE = '/geoserver/cite/wms'
/** Mapbox 数据源 / 图层 ID */
const SOURCE_ID = 'ncwms-source'
const LAYER_ID = 'ncwms-layer'

const { map, initMap, changeBaseMap, BaseMapType } = useMapbox()

// =============================================================================
// 二、类型定义
// =============================================================================
/** WMS 提供方：ncwms 支持配色参数；geoserver 使用服务端样式 */
type WmsProvider = 'ncwms' | 'geoserver'

/** 可选图层项（来自 GetCapabilities 或静态配置） */
interface LayerOption {
  value: string
  label: string
  timeDim?: string
  elevDim?: string
  dataset?: string
  provider?: WmsProvider
  /** GeoServer 样式名，如 ibcao_bathymetry */
  wmsStyle?: string
  /** 极地/单图模式下的 WMS bbox（WMS 1.1.0：minx,miny,maxx,maxy） */
  imageBbox?: string
  /** 单图 WMS 请求使用的 SRS，如 EPSG:3413（北极立体投影） */
  imageSrs?: string
  /** 单图宽高（与 WMS width/height 一致） */
  imageSize?: [number, number]
  /**
   * 单图贴图四角经纬度 [左上, 右上, 右下, 左下]（EPSG:4326）
   * 由 imageSrs 下的 bbox 四角经坐标转换得到，避免 Web Mercator 瓦片畸变
   */
  imageCoords?: LngLatQuad
  /** 赤道投影下也强制用 image 叠加（不走 EPSG:3857 瓦片） */
  forceImageOverlay?: boolean
  /** 选中后自动飞行的中心与缩放 */
  viewCenter?: [number, number]
  viewZoom?: number
}

interface DataSourceOption {
  value: string
  label: string
}

/** ncWMS GetMetadata layerDetails 返回结构 */
interface LayerMeta {
  scaleRange: [number, number]
  units: string
  palettes?: string[]
  defaultPalette?: string
  nearestTimeIso?: string
  datesWithData?: Record<string, Record<string, number[]>>
  supportsProfiles?: boolean
}

const COMMON_PALETTE_OPTIONS = [
  { label: '默认 default', value: 'default' },
  { label: '红蓝发散 div-RdBu', value: 'div-RdBu' },
  { label: '光谱 div-Spectral', value: 'div-Spectral' },
  { label: '橙红顺序 seq-OrRd', value: 'seq-OrRd' },
  { label: '蓝色顺序 seq-Blues', value: 'seq-Blues' },
  { label: '绿色顺序 seq-Greens', value: 'seq-Greens' },
]

// =============================================================================
// 三、投影配置
// 赤道投影用瓦片（EPSG:3857）；极地投影用单张 image 源
// =============================================================================
const projectionOptions = [
  { label: '赤道投影（EPSG:4326）', value: 'EPSG:4326', center: [120, 20] as [number, number], zoom: 3 },
  { label: '北极极地投影（EPSG:32661）', value: 'EPSG:32661', center: [0, 75] as [number, number], zoom: 2 },
  { label: '南极极地投影（EPSG:32761）', value: 'EPSG:32761', center: [0, -75] as [number, number], zoom: 2 },
]

/** 极地投影下 ncWMS GetMap 的 bbox（对应投影坐标） */
const POLAR_BBOX: Record<string, string> = {
  'EPSG:32661': '-5000000,-5000000,5000000,5000000',
  'EPSG:32761': '-5000000,-5000000,5000000,5000000',
}

type LngLatQuad = [number, number][]

/** 极地单图贴图范围（经纬度四角） */
const POLAR_COORDS: Record<string, LngLatQuad> = {
  'EPSG:32661': [[-180, 45], [180, 45], [180, 90], [-180, 90]],
  'EPSG:32761': [[-180, -90], [180, -90], [180, -45], [-180, -45]],
}

// =============================================================================
// 四、数据源与图层配置
// =============================================================================
/** 数据集 ID → 面板显示名称 */
const DATA_SOURCE_LABELS: Record<string, string> = {
  mfwam: 'MFWAM 海浪预报',
  gebco: 'GEBCO 海底地形',
  ibcao: 'IBCAO 北极海底地形',
}

const GEBCO_LAYER = 'gebco/elevation'
const IBCAO_LAYER = 'cite:ibcao_3413'

/**
 * EPSG:3413 完美贴图方案（Mapbox image 源）
 * 1. WMS 用原生 EPSG:3413 出图（立体投影，与数据一致）
 * 2. bbox 四角用 gdaltransform 转为 WGS84，作为 coordinates
 * 3. Mapbox 用透视变换将菱形图贴到 Mercator 底图上
 *
 * 预计算命令：
 *   gdaltransform -s_srs EPSG:3413 -t_srs EPSG:4326
 * 投影中心 (0,0) → 北极点约 [-45, 90]
 */
const IBCAO_3413_BBOX = '-4060480,-4060480,4060480,4060480'
const IBCAO_3413_POLE: [number, number] = [-45, 90]
const IBCAO_3413_COORDS: LngLatQuad = [
  [-180, 40.2458509956064], // 像素左上 ↔ 投影 (-4060480,  4060480)
  [90, 40.2458509956064],   // 像素右上 ↔ 投影 ( 4060480,  4060480)
  [0, 40.2458509956064],    // 像素右下 ↔ 投影 ( 4060480, -4060480)
  [-90, 40.2458509956064],  // 像素左下 ↔ 投影 (-4060480, -4060480)
]

/** 天地图底图图层 ID（隐藏后仅显示 IBCAO，避免 Mercator 底图干扰） */
const BASE_MAP_LAYER_IDS = ['tdtVecLayer', 'tdtCvaLayer', 'tdtImgLayer', 'tdtCiaLayer']

/** 切换数据源时优先选中的图层 */
const PREFERRED_LAYER: Record<string, string> = {
  gebco: GEBCO_LAYER,
  ibcao: IBCAO_LAYER,
}

/**
 * GEBCO 专用配色（传给 ncWMS 的 WMS 参数，非前端像素着色）
 * - colorscalerange：数值映射范围
 * - palette：ncWMS 内置色板名，见 GetMetadata.palettes
 */
const GEBCO_SCALE: [number, number] = [-8000, 5000]
const GEBCO_PALETTE = 'div-RdBu'

/**
 * 非 GetCapabilities 的静态图层（如 GeoServer IBCAO）
 * 新增外部 WMS 时可在此扩展
 */
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
    imageCoords: IBCAO_3413_COORDS,
    forceImageOverlay: true,
    viewCenter: IBCAO_3413_POLE,
    viewZoom: 2,
  },
]

// =============================================================================
// 五、面板状态
// =============================================================================
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

// =============================================================================
// 六、配色状态（ncWMS 图层）
// colorMin/colorMax → WMS 参数 colorscalerange
// 图例使用 GetLegendGraphic，与地图瓦片配色一致
// =============================================================================
const colorMin = ref(0)
const colorMax = ref(8)
const dataMin = ref<number | null>(null)
const dataMax = ref<number | null>(null)
const currentUnit = ref('m')
/** ncWMS 实际传给服务端的配色（改后需点「应用配色」或触发 refreshLayer） */
const selectedPalette = ref('default')
const numColorBands = ref(20)
const logScale = ref(false)
const paletteOptions = ref(COMMON_PALETTE_OPTIONS)
/** 递增可强制 Mapbox 重新请求瓦片（绕过缓存） */
const layerVersion = ref(0)
const useImageSource = ref(false)

const currentLayer = computed(() =>
  allLayers.value.find((layer) => layer.value === selectedFeature.value)
  || featureOptions.value.find((layer) => layer.value === selectedFeature.value),
)

const isIbcaoLayer = computed(() => selectedFeature.value === IBCAO_LAYER)
const isGeoServerLayer = computed(() => currentLayer.value?.provider === 'geoserver')
const arcticImageMode = computed(() => isIbcaoLayer.value)
/** GeoServer 图层由服务端 SLD 配色，不提供 ncWMS 配色面板 */
const showNcwmsColorConfig = computed(() => !isGeoServerLayer.value)
const showColorBar = computed(() => showNcwmsColorConfig.value)

/** 与地图配色一致的 ncWMS 服务端图例 */
const legendUrl = computed(() => {
  if (!showNcwmsColorConfig.value || !selectedFeature.value) return ''
  const log = logScale.value ? '&LOGSCALE=true' : ''
  return `${NCWMS_BASE}?service=WMS&version=1.3.0&request=GetLegendGraphic&layers=${selectedFeature.value}&styles=raster/${selectedPalette.value}&colorscalerange=${colorscalerange.value}&NUMCOLORBANDS=${numColorBands.value}${log}&width=24&height=160&format=image/png&_v=${layerVersion.value}`
})

/** 拼入 ncWMS GetMap 的 colorscalerange 参数，格式 "min,max" */
const colorscalerange = computed(() => `${colorMin.value},${colorMax.value}`)

// =============================================================================
// 八、WMS 能力与元数据
// =============================================================================

/** 解析 GetCapabilities 中 Dimension time 的 ISO8601 区间 */
function parseTimeDimension(dim: string): { label: string; value: string }[] {
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
    const label = iso.replace('T', ' ').replace('Z', ' UTC')
    options.push({ label, value: iso })
  }
  return options
}

/** 解析 GetCapabilities 中 Dimension elevation */
function parseElevationDimension(dim: string): { label: string; value: string }[] {
  const text = dim.trim()
  if (!text) return []
  return text.split(',').map((v) => {
    const val = v.trim()
    return { label: `${val} m`, value: val }
  })
}

/**
 * 拉取 ncWMS + 静态图层列表
 * 仅保留 queryable 且名称含 "/" 的图层（如 mfwam/VHM0）
 */
async function fetchCapabilities(): Promise<LayerOption[]> {
  const url = `${NCWMS_BASE}?service=WMS&version=1.3.0&request=GetCapabilities`
  const text = await (await fetch(url)).text()
  const doc = new DOMParser().parseFromString(text, 'text/xml')
  const layers: LayerOption[] = []

  doc.querySelectorAll('Layer[queryable="1"]').forEach((el) => {
    const name = el.querySelector(':scope > Name')?.textContent?.trim()
    const title = el.querySelector(':scope > Title')?.textContent?.trim()
    if (!name || !name.includes('/')) return
    const timeDim = el.querySelector(':scope > Dimension[name="time"]')?.textContent?.trim()
    const elevDim = el.querySelector(':scope > Dimension[name="elevation"]')?.textContent?.trim()
    const dataset = name.split('/')[0]
    layers.push({
      value: name,
      label: title ? `${title}（${name.split('/')[1]}）` : name,
      timeDim,
      elevDim,
      dataset,
      provider: 'ncwms',
    })
  })
  return [...STATIC_LAYERS, ...layers]
}

function buildDataSourceOptions(layers: LayerOption[]): DataSourceOption[] {
  const datasets = [...new Set(layers.map((layer) => layer.dataset).filter(Boolean) as string[])]
  return datasets.map((value) => ({
    value,
    label: DATA_SOURCE_LABELS[value] || value,
  }))
}

function filterLayersBySource(source: string): LayerOption[] {
  return allLayers.value.filter((layer) => layer.dataset === source)
}

/**
 * 获取图层默认色标范围与单位
 * 返回 scaleRange 用于初始化 colorscalerange
 */
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

/** 同步 colorMin/colorMax 与图例单位 */
function applyScaleRange(min: number, max: number, unit: string) {
  dataMin.value = min
  dataMax.value = max
  colorMin.value = min
  colorMax.value = max
  currentUnit.value = unit || ''
}

// =============================================================================
// 九、WMS URL 构建（配色参数在此注入）
// =============================================================================

/**
 * ncWMS GetMap 参数
 * 配色三要素：
 *   styles=raster/{palette} — 本实例色板必须写在 styles 里，单独 palette= 无效
 *   colorscalerange         — 数值范围，如 "0,8"
 *   NUMCOLORBANDS           — 色带分段数，越大越平滑
 * 可选扩展：LOGSCALE、ABOVEMAXCOLOR、BELOWMINCOLOR（见使用手册）
 */
function buildNcwmsParams(layer: string) {
  const parts = [
    'service=WMS',
    'version=1.3.0',
    'request=GetMap',
    `layers=${layer}`,
    `styles=raster/${selectedPalette.value}`,
    'format=image/png',
    'transparent=true',
    `colorscalerange=${colorscalerange.value}`,
    `NUMCOLORBANDS=${numColorBands.value}`,
  ]
  if (logScale.value) parts.push('LOGSCALE=true')
  if (showTime.value && selectedTime.value) parts.push(`time=${encodeURIComponent(selectedTime.value)}`)
  if (showElevation.value && selectedElevation.value) parts.push(`elevation=${selectedElevation.value}`)
  return parts
}

/** GeoServer WMS 1.1.0 参数（配色由服务端 styles 控制） */
function buildGeoServerParams(layer: LayerOption) {
  const parts = [
    'service=WMS',
    'version=1.1.0',
    'request=GetMap',
    `layers=${encodeURIComponent(layer.value)}`,
    `styles=${layer.wmsStyle || ''}`,
    'format=image/png',
    'transparent=true',
  ]
  return parts
}

/**
 * 赤道投影瓦片 URL
 * 注意：bbox 必须为未编码的 {bbox-epsg-3857}，Mapbox 会自动替换
 */
function shouldUseImageOverlay(layer: LayerOption): boolean {
  return layer.forceImageOverlay === true || selectedProjection.value !== 'EPSG:4326'
}

function buildTileWmsUrl(layer: LayerOption) {
  if (layer.provider === 'geoserver') {
    return `${GEOSERVER_WMS_BASE}?${buildGeoServerParams(layer).join('&')}&srs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256&_v=${layerVersion.value}`
  }
  const crs = selectedProjection.value === 'EPSG:4326' ? 'EPSG:3857' : selectedProjection.value
  return `${NCWMS_BASE}?${buildNcwmsParams(layer.value).join('&')}&crs=${crs}&bbox={bbox-epsg-3857}&width=256&height=256&_v=${layerVersion.value}`
}

/**
 * 单图 WMS URL（image 源，非瓦片）
 * IBCAO 使用原生 EPSG:3413 出图，再靠 imageCoords 贴到经纬度地图
 */
function buildImageWmsUrl(layer: LayerOption) {
  if (layer.provider === 'geoserver') {
    const srs = layer.imageSrs || 'EPSG:4326'
    const bbox = layer.imageBbox || '-180,60,180,90'
    const [w, h] = layer.imageSize || [1024, 512]
    return `${GEOSERVER_WMS_BASE}?${buildGeoServerParams(layer).join('&')}&srs=${srs}&bbox=${bbox}&width=${w}&height=${h}&_v=${layerVersion.value}`
  }
  const crs = selectedProjection.value
  const bbox = POLAR_BBOX[crs]
  return `${NCWMS_BASE}?${buildNcwmsParams(layer.value).join('&')}&crs=${crs}&bbox=${bbox}&width=1024&height=1024&_v=${layerVersion.value}`
}

function getImageCoords(layer: LayerOption): LngLatQuad {
  if (layer.imageCoords) return layer.imageCoords
  return POLAR_COORDS[selectedProjection.value]
}

/** 隐藏/显示天地图底图（IBCAO 模式建议隐藏，只保留立体投影贴图） */
function setBaseMapVisible(visible: boolean) {
  if (!map.value) return
  BASE_MAP_LAYER_IDS.forEach((id) => {
    if (map.value?.getLayer(id)) {
      map.value.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none')
    }
  })
}

/**
 * 将视野缩放到 IBCAO 菱形贴图范围（含北极点）
 * 使 EPSG:3413 出图与 Mapbox 视图对齐
 */
function fitIbcaoView(coords: LngLatQuad = IBCAO_3413_COORDS) {
  if (!map.value) return
  const bounds = new mapboxGL.LngLatBounds(coords[0], coords[0])
  coords.forEach((c) => bounds.extend(c as [number, number]))
  bounds.extend(IBCAO_3413_POLE)
  map.value.fitBounds(bounds, { padding: 24, duration: 800, maxZoom: 4 })
}

function applyArcticImageMode(layer: LayerOption | undefined) {
  const active = layer?.value === IBCAO_LAYER
  setBaseMapVisible(!active)
  if (active) {
    fitIbcaoView(layer.imageCoords)
  }
}

// =============================================================================
// 十、Mapbox 图层渲染
// =============================================================================
function removeDataLayer() {
  if (!map.value) return
  if (map.value.getLayer(LAYER_ID)) map.value.removeLayer(LAYER_ID)
  if (map.value.getSource(SOURCE_ID)) map.value.removeSource(SOURCE_ID)
}

/**
 * 刷新数据图层
 * - 普通图层 + 赤道投影 → raster 瓦片（EPSG:3857）
 * - 极地投影 / forceImageOverlay → image 单图（如 IBCAO EPSG:3413）
 */
function refreshLayer() {
  const layer = currentLayer.value
  if (!map.value?.isStyleLoaded() || !layer) return

  layerVersion.value++
  removeDataLayer()

  const useImage = shouldUseImageOverlay(layer)
  useImageSource.value = useImage

  if (useImage) {
    map.value.addSource(SOURCE_ID, {
      type: 'image',
      url: buildImageWmsUrl(layer),
      coordinates: getImageCoords(layer),
    })
  } else {
    map.value.addSource(SOURCE_ID, {
      type: 'raster',
      tiles: [buildTileWmsUrl(layer)],
      tileSize: 256,
    })
  }

  const isArctic = layer.value === IBCAO_LAYER
  map.value.addLayer({
    id: LAYER_ID,
    type: 'raster',
    source: SOURCE_ID,
    paint: {
      'raster-opacity': isArctic ? 1 : 0.85,
      'raster-fade-duration': 0,
      'raster-resampling': 'linear',
    },
  })
}

// =============================================================================
// 十一、交互事件
// =============================================================================
async function loadFeatureDimensions(feature: LayerOption) {
  showTime.value = !!feature.timeDim
  showElevation.value = !!feature.elevDim

  timeOptions.value = feature.timeDim ? parseTimeDimension(feature.timeDim) : []
  elevationOptions.value = feature.elevDim ? parseElevationDimension(feature.elevDim) : []

  selectedTime.value = timeOptions.value[0]?.value || ''
  selectedElevation.value = elevationOptions.value[0]?.value || ''
}

/** 按图层类型设置默认色标：GEBCO 用手动范围，其余用 GetMetadata.scaleRange */
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
  if (meta?.palettes?.length) {
    paletteOptions.value = meta.palettes.map((name) => ({ label: name, value: name }))
  } else {
    paletteOptions.value = COMMON_PALETTE_OPTIONS
  }
  if (layerName.startsWith('gebco/')) {
    selectedPalette.value = GEBCO_PALETTE
    return
  }
  selectedPalette.value = meta?.defaultPalette || 'default'
}

/** 应用配色：重新请求 ncWMS 瓦片，地图颜色才会变化 */
function applyColorConfig() {
  refreshLayer()
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

  applyArcticImageMode(feature)

  if (feature?.value !== IBCAO_LAYER && feature?.viewCenter && map.value) {
    map.value.flyTo({
      center: feature.viewCenter,
      zoom: feature.viewZoom ?? map.value.getZoom(),
      duration: 800,
    })
  }

  loading.value = false
  refreshLayer()
}

async function onDataSourceChange(source: string) {
  featureOptions.value = filterLayersBySource(source)
  const preferredName = PREFERRED_LAYER[source]
  const preferred = featureOptions.value.find((item) => item.value === preferredName)
  const nextLayer = preferred?.value || featureOptions.value[0]?.value
  if (!nextLayer) return
  selectedFeature.value = nextLayer
  await onFeatureChange(nextLayer)
}

function onFilterChange() {
  refreshLayer()
}

function onProjectionChange(crs: string) {
  if (isIbcaoLayer.value) {
    fitIbcaoView()
  } else {
    const opt = projectionOptions.find((p) => p.value === crs)
    if (opt && map.value) {
      map.value.flyTo({ center: opt.center, zoom: opt.zoom, duration: 800 })
    }
  }
  refreshLayer()
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

// =============================================================================
// 十二、初始化
// =============================================================================
onMounted(() => {
  initMap({
    container: 'ncwms-map',
    center: [120, 20],
    zoom: 3,
  })

  map.value?.on('load', () => {
    changeBaseMap(BaseMapType.TDT_IMAGE)
    initPage()
  })
})
</script>

<template>
  <div class="page">
    <!-- Mapbox 地图容器 -->
    <div id="ncwms-map" class="map" :class="{ 'arctic-image-mode': arcticImageMode }" />

    <!-- 左侧可视化设置面板 -->
    <div class="settings-panel" :class="{ collapsed: panelCollapsed }">
      <div class="panel-header">
        <span>可视化设置</span>
        <button class="collapse-btn" @click="panelCollapsed = !panelCollapsed">
          {{ panelCollapsed ? '»' : '«' }}
        </button>
      </div>

      <div v-show="!panelCollapsed" v-loading="loading" class="panel-body">
        <!-- 数据源：按 dataset 分组（mfwam / gebco / ibcao 等） -->
        <div class="form-item">
          <label><span class="required">*</span> 数据源</label>
          <el-select
            v-model="selectedDataSource"
            placeholder="请选择数据源"
            @change="onDataSourceChange"
          >
            <el-option
              v-for="item in dataSourceOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>

        <!-- 要素：具体 WMS 图层名 -->
        <div class="form-item">
          <label><span class="required">*</span> 要素选择</label>
          <el-select
            v-model="selectedFeature"
            placeholder="请选择要素"
            filterable
            @change="onFeatureChange"
          >
            <el-option
              v-for="item in featureOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>

        <!-- 时间维（仅 ncWMS 时序图层显示） -->
        <div v-if="showTime" class="form-item">
          <label><span class="required">*</span> 时间选择</label>
          <el-select v-model="selectedTime" placeholder="请选择时间" @change="onFilterChange">
            <el-option
              v-for="item in timeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>

        <!-- 垂向维（仅含 elevation 维度的图层显示） -->
        <div v-if="showElevation" class="form-item">
          <label><span class="required">*</span> 垂向分层选择</label>
          <el-select v-model="selectedElevation" placeholder="请选择垂向分层" @change="onFilterChange">
            <el-option
              v-for="item in elevationOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>

        <!-- 投影：赤道用瓦片，极地用单图 -->
        <div class="form-item">
          <label><span class="required">*</span> 投影选择</label>
          <el-select v-model="selectedProjection" placeholder="请选择投影" @change="onProjectionChange">
            <el-option
              v-for="item in projectionOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>

        <!-- ncWMS 配色：修改后必须点「应用配色」才会更新地图 -->
        <template v-if="showNcwmsColorConfig">
          <div class="form-divider">配色设置（ncWMS）</div>

          <div class="form-item palette-hint">
            <label>色板 palette</label>
            <p class="hint-text">色板通过 WMS 参数 <code>styles=raster/色板名</code> 生效，改后请点「应用配色」</p>
            <el-select v-model="selectedPalette" filterable placeholder="选择色板">
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

    <!-- 右下角：ncWMS 服务端图例（与地图瓦片配色一致） -->
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
}
.map {
  width: 100%;
  height: 100%;
}
/* IBCAO 模式：背景色与 WMS 图透明区接近，菱形外角更自然 */
.map.arctic-image-mode {
  background: #b8cdb8;
}
.settings-panel {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
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
.form-item:last-child {
  margin-bottom: 0;
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
  color: #333;
}
.range-row {
  display: flex;
  gap: 10px;
}
.range-field {
  flex: 1;
}
.range-field label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
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
  z-index: 10;
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
  border-radius: 2px;
}
.legend-range {
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 11px;
  color: #444;
}
:deep(.mapboxgl-ctrl-logo) {
  display: none !important;
}
</style>
