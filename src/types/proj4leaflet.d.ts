import type { Map as LeafletMap } from 'leaflet'

declare module 'leaflet' {
  namespace Proj {
    interface ProjCrsOptions {
      origin?: [number, number]
      resolutions?: number[]
      bounds?: L.Bounds
      transformation?: L.Transformation
    }

    class CRS extends L.CRS {
      code?: string
      constructor(code: string, def: string, options?: ProjCrsOptions)
    }

    class ImageOverlay extends L.ImageOverlay {}

    function imageOverlay(
      url: string,
      bounds: L.Bounds,
      options?: L.ImageOverlayOptions,
    ): ImageOverlay
  }
}

/** Vite/CJS 下 default 为 factory 执行结果 L.Proj，不是 factory 本身 */
declare module 'proj4leaflet/src/proj4leaflet.js' {
  const ProjNamespace: LeafletMap | Record<string, unknown>
  export default ProjNamespace
}
