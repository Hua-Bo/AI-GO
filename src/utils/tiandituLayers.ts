/**
 * 天地图 Web Mercator 瓦片（与 test28 一致）
 */
import L from 'leaflet'

export const TDT_TOKEN = '0866c3992f556685911c58b631f978c0'

/** vec_w 区划边界 · cva_w 矢量注记 · cia_w 影像注记 · img_w 影像底图 */
export type TdtLayerType = 'vec_w' | 'cva_w' | 'cia_w' | 'img_w'

export function createTdtTileLayer(
  type: TdtLayerType,
  options?: L.TileLayerOptions,
): L.TileLayer {
  return L.tileLayer(
    `https://t{s}.tianditu.gov.cn/DataServer?T=${type}&x={x}&y={y}&l={z}&tk=${TDT_TOKEN}`,
    {
      subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
      maxZoom: 18,
      attribution: '© 天地图',
      ...options,
    },
  )
}

/** 区划边界（矢量底图，仅取边界/陆地面） */
export function createTdtAdminLayer(options?: L.TileLayerOptions) {
  return createTdtTileLayer('vec_w', options)
}

/** 地名注记（影像注记，叠在海洋/影像底图上） */
export function createTdtLabelLayer(options?: L.TileLayerOptions) {
  return createTdtTileLayer('cia_w', options)
}

export function setTdtLayerZoomLimits(
  layers: Array<L.TileLayer | null | undefined>,
  min: number,
  max: number,
) {
  layers.forEach((layer) => {
    if (!layer) return
    layer.options.minZoom = min
    layer.options.maxZoom = max
    layer.redraw()
  })
}
