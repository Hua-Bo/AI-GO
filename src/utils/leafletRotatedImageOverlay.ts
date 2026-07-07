/**
 * 三点定标旋转贴图（Leaflet.ImageOverlay.Rotated 精简版）
 * 用于 IBCAO EPSG:3413 菱形贴图，Mapbox image 源的四角等价方案
 */
import L from 'leaflet'

export class RotatedImageOverlay extends L.ImageOverlay {
  private _topLeft!: L.LatLng
  private _topRight!: L.LatLng
  private _bottomLeft!: L.LatLng

  constructor(
    url: string,
    topleft: L.LatLngExpression,
    topright: L.LatLngExpression,
    bottomleft: L.LatLngExpression,
    options?: L.ImageOverlayOptions,
  ) {
    super(url, L.latLngBounds(topleft, bottomleft), options)
    this._topLeft = L.latLng(topleft)
    this._topRight = L.latLng(topright)
    this._bottomLeft = L.latLng(bottomleft)
  }

  override onAdd(map: L.Map) {
    this._image = L.DomUtil.create('img', 'leaflet-image-layer') as HTMLImageElement
    if (this.options.className) {
      L.DomUtil.addClass(this._image, this.options.className)
    }
    this._image.src = this._url
    this._image.alt = ''
    this._image.style.position = 'absolute'
    this._image.style.opacity = String(this.options.opacity ?? 1)

    map.on('zoom viewreset resetview', this._reset, this)
    this._reset()
    map.getPanes().overlayPane.appendChild(this._image)
    return this
  }

  override onRemove(map: L.Map) {
    map.off('zoom viewreset resetview', this._reset, this)
    L.DomUtil.remove(this._image)
    return this
  }

  private _reset = () => {
    const map = this._map
    const img = this._image as HTMLImageElement
    if (!map || !img) return

    const pxTopLeft = map.latLngToLayerPoint(this._topLeft)
    const pxTopRight = map.latLngToLayerPoint(this._topRight)
    const pxBottomLeft = map.latLngToLayerPoint(this._bottomLeft)

    const pxWidth = pxTopRight.x - pxTopLeft.x
    const pxHeight = pxBottomLeft.y - pxTopLeft.y

    L.DomUtil.setTransform(img, pxTopLeft, 0)
    img.style.width = `${pxWidth}px`
    img.style.height = `${pxHeight}px`
  }
}

export function rotatedImageOverlay(
  topleft: L.LatLngExpression,
  topright: L.LatLngExpression,
  bottomleft: L.LatLngExpression,
  url: string,
  options?: L.ImageOverlayOptions,
) {
  return new RotatedImageOverlay(url, topleft, topright, bottomleft, options)
}
