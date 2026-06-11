import type {ImageryProvider, Viewer} from 'cesium';
import {
  GeographicTilingScheme,
  ImageryLayer,
  Ion,
  UrlTemplateImageryProvider, WebMapTileServiceImageryProvider,
  WebMapServiceImageryProvider,
} from 'cesium'

/**
 * cesium 底图管理器
 */

Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4OGQwZTM2MC00NjkzLTRkZTgtYTU5MS0xZTA1NTljYWQyN2UiLCJpZCI6NTUwODUsImlhdCI6MTYyMDM5NjQ3NH0.lu_JBwyngYucPsvbCZt-xzmzgfwEKwcRXiYs5uV8uTM'

export enum LayerName {
  vec_w = 'vec_w',// 矢量底图-墨卡托投影
  cva_w = 'cva_w',// 矢量注记-墨卡托投影
  img_w = 'img_w',// 影像底图-墨卡托投影
  ter_w = 'ter_w',// 地形底图-墨卡托投影
  coastline = 'coastline',// 海岸线-墨卡托投影
}

export type LayerConfig = {
  [key in keyof typeof LayerName]?: boolean
}

export function useCesiumBaseLayer() {
  // 这里默认所有地图操作都在一个地图组件中，组件封装为有状态组件
  let baseLayers: Record<string, ImageryLayer> = {}

  const getImageryLayerConfig = (): Record<string, ImageryProvider> => {

    const vec_w = new UrlTemplateImageryProvider({
      url: window.env.vec_w_url,
      maximumLevel: 8
    })

    const cva_w = new UrlTemplateImageryProvider({
      url: window.env.vec_w_url,
      maximumLevel: 8
    })


    const img_w = new UrlTemplateImageryProvider({
      url: window.env.img_w_url,
      maximumLevel: 8
    })

    const ter_w = new WebMapTileServiceImageryProvider({
      url: `${window.env.geoserver_url}/geoserver/gwc/service/wmts?layer=td:dem_qh&style=td:dem-arcgis&tilematrixset=EPSG%3A4326&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix=EPSG%3A4326%3A{TileMatrix}&TileCol={TileCol}&TileRow={TileRow}`,
      // url: `http://localhost:8080/geoserver/gwc/service/wmts/rest/test:HYP_LR/{style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}?format=image/png`,
      layer: 'vec',
      style: 'default',
      format: 'tiles',
      tileMatrixSetID: 'w',
      maximumLevel: 12,
      tilingScheme: new GeographicTilingScheme(),
    })

    const coastline = new UrlTemplateImageryProvider({
      url: window.env.coastline_url,
      maximumLevel: 8
    })

    return {
      vec_w,
      cva_w,
      img_w,
      ter_w,
      coastline
    }
  }

  const initImageryLayers = (viewer: Viewer, layerConfig: LayerConfig) => {
    baseLayers = {}
    viewer.imageryLayers.removeAll()
    const config = getImageryLayerConfig()
    Object.entries(layerConfig).forEach(([key, value]) => {
      const l = new ImageryLayer(config[key], {show: value})
      baseLayers[key] = l
      viewer.imageryLayers.add(l)
    });
  }

  const addImageryLayers = (viewer: Viewer) => {
    let imageryProvider = new WebMapServiceImageryProvider({
      url: "http://localhost:8080/geoserver/test/wms",
      layers: 'test:HYP_LR',
      parameters: {
        service: 'WMS',
        format: 'image/png',
        transparent: true
      }
    });
    // 图层添加
    viewer.imageryLayers.addImageryProvider(imageryProvider);
  }

  const changeBaseLayer = (viewer: Viewer, layerName: keyof typeof LayerName) => {
    if (!viewer.imageryLayers.contains(baseLayers[layerName])) {
      return
    }
    hideBaseLayer([layerName])
    if (layerName === LayerName.vec_w) {
      baseLayers[LayerName.vec_w].show = true
      viewer.scene.globe.translucency.enabled = false;
    } else if (layerName === LayerName.cva_w) {
      baseLayers[LayerName.cva_w].show = true
      viewer.scene.globe.translucency.enabled = false;
    } else if (layerName === LayerName.img_w) {
      baseLayers[LayerName.img_w].show = true
      viewer.scene.globe.translucency.enabled = false;
    } else if (layerName === LayerName.ter_w) {
      baseLayers[LayerName.ter_w].show = false
      viewer.scene.globe.translucency.enabled = false;
    } else if (layerName === LayerName.coastline) {
      baseLayers[LayerName.coastline].show = true
      viewer.scene.globe.translucency.enabled = true;
    }
  }

  const hideBaseLayer = (exclude: string[]) => {
    for (const [name, layer] of Object.entries(baseLayers)) {
      if (exclude.indexOf(name) === -1) layer.show = false;
    }
  }

  return {
    initImageryLayers,
    changeBaseLayer,
    addImageryLayers,
  }
}
