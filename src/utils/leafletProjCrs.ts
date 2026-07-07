/**
 * Proj4Leaflet 自定义 CRS 注册与解析
 * @see https://kartena.github.io/Proj4Leaflet/
 */
import L from 'leaflet'
import proj4 from 'proj4'
// CJS 模块加载时会执行 factory(L, proj4)，将 L.Proj 挂到 Leaflet 上
import proj4leafletExport from 'proj4leaflet/src/proj4leaflet.js'

type Proj4LeafletFactory = (leaflet: typeof L, proj4lib: typeof proj4) => unknown

type LeafletWithProj = typeof L & {
  Proj?: {
    CRS: new (code: string, def: string, options?: L.Proj.ProjCrsOptions) => L.CRS
  }
}

function ensureProj4Leaflet() {
  const Leaflet = L as LeafletWithProj
  if (Leaflet.Proj?.CRS) return

  const proj4lib = (proj4 as { default?: typeof proj4 }).default || proj4
  const mod = proj4leafletExport as unknown

  // 部分打包器只导出 factory 函数，需手动调用
  if (typeof mod === 'function') {
    (mod as Proj4LeafletFactory)(L, proj4lib)
  } else {
    const factory = (mod as { default?: unknown })?.default
    if (typeof factory === 'function') {
      (factory as Proj4LeafletFactory)(L, proj4lib)
    }
  }

  if (!Leaflet.Proj?.CRS) {
    throw new Error('Proj4Leaflet 初始化失败：L.Proj.CRS 未注册')
  }
}

ensureProj4Leaflet()

/** 4326 选项在 Leaflet 中仍用 Web Mercator 瓦片 */
export type MapCrsKey = 'EPSG:4326' | 'EPSG:32661' | 'EPSG:32761' | 'EPSG:3413'

export interface MapCrsMeta {
  key: MapCrsKey
  /** WMS GetMap 请求的 CRS / SRS 参数 */
  wmsCode: string
  /** 是否可叠加天地图（仅 Web Mercator） */
  showBaseMap: boolean
  /** 默认视野中心 [lat, lng] */
  defaultCenter: [number, number]
  defaultZoom: number
  /** fitBounds 用的经纬度范围（可选） */
  fitLatLngBounds?: L.LatLngBoundsExpression
}

const PROJ4_DEFS: Record<Exclude<MapCrsKey, 'EPSG:4326'>, string> = {
  'EPSG:32661': '+proj=stere +lat_0=90 +lat_ts=90 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
  'EPSG:32761': '+proj=stere +lat_0=-90 +lat_ts=-90 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
  'EPSG:3413': '+proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
}

const EXTENTS: Record<Exclude<MapCrsKey, 'EPSG:4326'>, number> = {
  'EPSG:32661': 5_000_000,
  'EPSG:32761': 5_000_000,
  'EPSG:3413': 4_060_480,
}

const WMS_IMAGE_BBOX: Record<Exclude<MapCrsKey, 'EPSG:4326'>, string> = {
  'EPSG:32661': '-5000000,-5000000,5000000,5000000',
  'EPSG:32761': '-5000000,-5000000,5000000,5000000',
  'EPSG:3413': '-4060480,-4060480,4060480,4060480',
}

function buildResolutions(extent: number, levels = 12): number[] {
  const span = extent * 2
  const resolutions: number[] = []
  for (let z = 0; z <= levels; z++) {
    resolutions.push(span / 256 / 2 ** z)
  }
  return resolutions
}

function createProjCrs(key: Exclude<MapCrsKey, 'EPSG:4326'>): L.Proj.CRS {
  const extent = EXTENTS[key]
  return new L.Proj.CRS(key, PROJ4_DEFS[key], {
    origin: [-extent, extent],
    bounds: L.bounds([-extent, -extent], [extent, extent]),
    resolutions: buildResolutions(extent),
  })
}

const CRS_CACHE: Partial<Record<MapCrsKey, L.CRS>> = {
  'EPSG:4326': L.CRS.EPSG3857,
}

export function getLeafletCrs(key: MapCrsKey): L.CRS {
  if (key === 'EPSG:4326') return L.CRS.EPSG3857
  if (!CRS_CACHE[key]) {
    CRS_CACHE[key] = createProjCrs(key)
  }
  return CRS_CACHE[key]!
}

const CRS_META: Record<MapCrsKey, MapCrsMeta> = {
  'EPSG:4326': {
    key: 'EPSG:4326',
    wmsCode: 'EPSG:3857',
    showBaseMap: true,
    defaultCenter: [20, 120],
    defaultZoom: 3,
  },
  'EPSG:32661': {
    key: 'EPSG:32661',
    wmsCode: 'EPSG:32661',
    showBaseMap: false,
    defaultCenter: [75, 0],
    defaultZoom: 2,
    fitLatLngBounds: [[55, -110], [87, 110]],
  },
  'EPSG:32761': {
    key: 'EPSG:32761',
    wmsCode: 'EPSG:32761',
    showBaseMap: false,
    defaultCenter: [-75, 0],
    defaultZoom: 2,
    fitLatLngBounds: [[-87, -110], [-55, 110]],
  },
  'EPSG:3413': {
    key: 'EPSG:3413',
    wmsCode: 'EPSG:3413',
    showBaseMap: false,
    defaultCenter: [75, -45],
    defaultZoom: 2,
    fitLatLngBounds: [[40.24, -180], [90, 180]],
  },
}

export function usesPolarImageMode(key: MapCrsKey): boolean {
  return key !== 'EPSG:4326'
}

/** Proj4Leaflet 下单图 WMS 的 bbox（与 CRS 投影单位一致） */
export function getWmsImageBbox(crsKey: MapCrsKey, customBbox?: string): string {
  if (crsKey === 'EPSG:4326') return ''
  if (customBbox) return customBbox
  return WMS_IMAGE_BBOX[crsKey]
}

/** L.Proj.imageOverlay 使用的投影坐标范围（与 WMS bbox 一致，全幅出图） */
export function getProjectedBounds(crsKey: Exclude<MapCrsKey, 'EPSG:4326'>): L.Bounds {
  const extent = EXTENTS[crsKey]
  return L.bounds([-extent, -extent], [extent, extent])
}

/**
 * 根据投影选择与当前图层，解析地图应使用的 CRS
 * - 4326：Web Mercator 全球 + 天地图
 * - 32661/32761：ncWMS 极地投影
 * - IBCAO 非 4326：原生 EPSG:3413（北极）
 */
export function resolveMapCrsKey(projection: string, layerValue?: string): MapCrsKey {
  if (layerValue === 'cite:ibcao_3413') {
    return projection === 'EPSG:4326' ? 'EPSG:4326' : 'EPSG:3413'
  }
  if (projection === 'EPSG:32661' || projection === 'EPSG:32761') {
    return projection
  }
  return 'EPSG:4326'
}

/** IBCAO 仅北极；选南极投影时纠正为北极 */
export function normalizeProjection(projection: string, layerValue?: string): string {
  if (layerValue === 'cite:ibcao_3413' && projection === 'EPSG:32761') {
    return 'EPSG:32661'
  }
  return projection
}

export function getMapCrsMeta(key: MapCrsKey): MapCrsMeta {
  return CRS_META[key]
}
