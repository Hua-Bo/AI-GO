/**
 * Copernicus Marine MyOcean Viewer 使用的 Lobelia 海洋底图瓦片（Demo 引用）
 * @see https://data.marine.copernicus.eu/viewer/expert
 */
import L from 'leaflet'
import { getLeafletCrs, type MapCrsKey } from '@/utils/leafletProjCrs'

export type LobeliaBasemapStyle = 'light' | 'dark'

const LOBELIA_TILE_BASE = 'https://s3.waw3-1.cloudferro.com/tiles-lobelia-oceans'

/** 与 Proj4Leaflet CRS 一致，使用 256px 标准瓦片（非 @2x） */
export const LOBELIA_TILE_SIZE = 256

/** Lobelia 极地瓦片金字塔边长（米），与 UPS ±5000km 一致 */
export const POLAR_TILE_EXTENT = 5_000_000

/** 极地默认缩放：z=2 时为 4×4 瓦片 */
export const POLAR_DEFAULT_ZOOM = 2

/** 极地缩放默认范围（Lobelia 瓦片约 0–8 级；min≥2 避免缩放过小瓦片错位） */
export const DEFAULT_POLAR_ZOOM = {
  min: 2,
  max: 6,
  default: POLAR_DEFAULT_ZOOM,
} as const

export interface PolarZoomConfig {
  min: number
  max: number
  default: number
}

export function clampPolarZoom(cfg: PolarZoomConfig): PolarZoomConfig {
  const min = Math.max(0, Math.floor(cfg.min))
  const max = Math.max(min, Math.floor(cfg.max))
  const defaultZoom = Math.min(Math.max(Math.floor(cfg.default), min), max)
  return { min, max, default: defaultZoom }
}

/** 使极地瓦片范围铺满视口所需的最小 zoom（防止缩到中间一小块） */
export function getPolarFillMinZoom(map: L.Map): number {
  map.invalidateSize({ animate: false })
  const bounds = getPolarTileLatLngBounds(map.options.crs!)
  let fillMin = map.getBoundsZoom(bounds, true)
  if (!Number.isFinite(fillMin)) {
    fillMin = POLAR_DEFAULT_ZOOM
  }
  return Math.max(0, Math.ceil(fillMin))
}

/** 合并用户配置与视口铺满下限 */
export function resolveEffectivePolarZoom(map: L.Map, cfg: PolarZoomConfig): EffectivePolarZoom {
  const base = clampPolarZoom(cfg)
  const fillMin = getPolarFillMinZoom(map)
  const min = Math.max(base.min, fillMin)
  const max = Math.max(min, base.max)
  const defaultZoom = Math.min(Math.max(base.default, min), max)
  return { min, max, default: defaultZoom, fillMin }
}

export type EffectivePolarZoom = PolarZoomConfig & { fillMin: number }

/** Web Mercator 常用显示范围（避免极地拉伸，与 test28 一致） */
export const MERCATOR_WORLD_BOUNDS = L.latLngBounds([-85, -180], [85, 180])

export const DEFAULT_MERCATOR_ZOOM = {
  default: 3,
  max: 12,
} as const

/** 使全球范围铺满视口所需的最小 zoom（防止宽屏上下留白） */
export function getMercatorFillMinZoom(map: L.Map): number {
  map.invalidateSize({ animate: false })
  let fillMin = map.getBoundsZoom(MERCATOR_WORLD_BOUNDS, true)
  if (!Number.isFinite(fillMin)) {
    fillMin = DEFAULT_MERCATOR_ZOOM.default
  }
  return Math.max(0, Math.ceil(fillMin))
}

export function applyMercatorZoomToMap(
  map: L.Map,
  layers?: { basemap?: L.TileLayer | null; data?: L.TileLayer.WMS | null },
  options?: { resetView?: boolean },
): number {
  const fillMin = getMercatorFillMinZoom(map)
  map.setMinZoom(fillMin)
  map.setMaxZoom(DEFAULT_MERCATOR_ZOOM.max)
  setLayerZoomLimits(layers?.basemap ?? undefined, fillMin, DEFAULT_MERCATOR_ZOOM.max)
  setLayerZoomLimits(layers?.data ?? undefined, fillMin, DEFAULT_MERCATOR_ZOOM.max)

  if (options?.resetView) {
    const z = Math.max(fillMin, DEFAULT_MERCATOR_ZOOM.default)
    map.setView(getLobeliaDefaultCenter('EPSG:4326'), z, { animate: false })
  } else if (map.getZoom() < fillMin) {
    map.setZoom(fillMin)
  } else if (map.getZoom() > DEFAULT_MERCATOR_ZOOM.max) {
    map.setZoom(DEFAULT_MERCATOR_ZOOM.max)
  }

  clampMercatorView(map)
  return fillMin
}

/** 缩放/平移后把视口限制在全球范围内，避免边缘留白 */
export function clampMercatorView(map: L.Map) {
  if (map.getZoom() < map.getMinZoom()) {
    map.setZoom(map.getMinZoom(), { animate: false })
  }
  map.panInsideBounds(MERCATOR_WORLD_BOUNDS, { animate: false })
}

/** 缩放/平移后把视口限制在极地瓦片范围内 */
export function clampPolarView(map: L.Map) {
  if (map.getZoom() < map.getMinZoom()) {
    map.setZoom(map.getMinZoom(), { animate: false })
  }
  map.panInsideBounds(getPolarTileLatLngBounds(map.options.crs!), { animate: false })
}

/** Leaflet 仅 Map 有 setMinZoom；图层通过 options + redraw 更新 */
function setLayerZoomLimits(layer: L.GridLayer | null | undefined, min: number, max: number) {
  if (!layer) return
  layer.options.minZoom = min
  layer.options.maxZoom = max
  layer.redraw()
}

export function applyPolarZoomToMap(
  map: L.Map,
  cfg: EffectivePolarZoom | PolarZoomConfig,
  projection: MapCrsKey,
  layers?: { basemap?: L.TileLayer | null; data?: L.TileLayer.WMS | null },
  options?: { resetView?: boolean },
): EffectivePolarZoom {
  const effective = 'fillMin' in cfg
    ? cfg as EffectivePolarZoom
    : resolveEffectivePolarZoom(map, cfg)

  map.setMinZoom(effective.min)
  map.setMaxZoom(effective.max)
  setLayerZoomLimits(layers?.basemap ?? undefined, effective.min, effective.max)
  setLayerZoomLimits(layers?.data ?? undefined, effective.min, effective.max)

  if (options?.resetView) {
    map.setView(getLobeliaDefaultCenter(projection), effective.default, { animate: false })
  } else if (map.getZoom() < effective.min) {
    map.setZoom(effective.min)
  } else if (map.getZoom() > effective.max) {
    map.setZoom(effective.max)
  }

  clampPolarView(map)
  return effective
}

export function getLobeliaMapCrs(projection: MapCrsKey): L.CRS {
  return getLeafletCrs(projection)
}

export function getLobeliaTileCrsCode(projection: MapCrsKey): string {
  if (projection === 'EPSG:4326') return '3857'
  return projection.replace('EPSG:', '')
}

export function createLobeliaBasemapLayer(
  style: LobeliaBasemapStyle,
  projection: MapCrsKey,
  zoomLimits?: Pick<PolarZoomConfig, 'min' | 'max'>,
): L.TileLayer {
  const crsCode = getLobeliaTileCrsCode(projection)
  const isMercator = projection === 'EPSG:4326'
  return L.tileLayer(
    `${LOBELIA_TILE_BASE}-${style}/v3/${crsCode}/{z}/{x}/{y}.png`,
    {
      tileSize: LOBELIA_TILE_SIZE,
      maxZoom: isMercator ? 12 : (zoomLimits?.max ?? 8),
      minZoom: isMercator ? 0 : (zoomLimits?.min ?? 0),
      continuousWorld: true,
      attribution: '© OSM · GEBCO · ECMWF · Lobelia/Copernicus Marine (Demo)',
    },
  )
}

export const LOBELIA_ATTRIBUTION =
  '底图来源 Copernicus Marine MyOcean Viewer（Lobelia），含 OpenStreetMap、GEBCO、ECMWF 数据，仅供样式参考 Demo。'

export function getLobeliaDefaultCenter(projection: MapCrsKey): [number, number] {
  if (projection === 'EPSG:32661') return [90, 0]
  if (projection === 'EPSG:32761') return [-90, 0]
  return [20, 0]
}

export function getPolarTileLatLngBounds(crs: L.CRS, extent = POLAR_TILE_EXTENT): L.LatLngBounds {
  const sw = crs.unproject(L.point(-extent, -extent))
  const ne = crs.unproject(L.point(extent, extent))
  return L.latLngBounds(sw, ne)
}

/** 极地初次进入：适配全幅瓦片范围 */
export function fitPolarContentView(map: L.Map, _projection?: MapCrsKey) {
  map.invalidateSize({ animate: false })
  const bounds = getPolarTileLatLngBounds(map.options.crs!)
  map.fitBounds(bounds, { padding: [16, 16], animate: false })
}

export function getMercatorMapOptions(): Pick<L.MapOptions, 'maxBounds' | 'maxBoundsViscosity'> {
  return {
    maxBounds: MERCATOR_WORLD_BOUNDS,
    maxBoundsViscosity: 1,
  }
}

export function getPolarMapOptions(crs: L.CRS): Pick<L.MapOptions, 'maxBounds' | 'maxBoundsViscosity'> {
  return {
    maxBounds: getPolarTileLatLngBounds(crs),
    maxBoundsViscosity: 1,
  }
}
