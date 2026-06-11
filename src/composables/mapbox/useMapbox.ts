import type {Map, MapboxOptions, RasterLayer, RasterSource} from 'mapbox-gl'
import mapboxGL from 'mapbox-gl'
import {ColorRamp, MapboxClient} from 'weatherv'
import type { Map as MapboxMap } from 'mapbox-gl'
import { areaOptions } from "@/config/modle";

// 地图基础底图类型
enum BaseMapType {
  TDT_VECTOR = 'TDT_Vector',
  TDT_IMAGE = 'TDT_Image'
}

// 地图中心点配置
interface centerConfig {
  center: [number, number],
  zoom: number
}

const mapConfigSample: centerConfig = {
  center: [120, 30],
  zoom: 4
}

// 天地图矢量底图
const tdtVecLayerId = 'tdtVecLayer'
const tdtVecSource: RasterSource = {
  type: 'raster',
  tiles: [
    // 'https://t0.tianditu.gov.cn/DataServer?T=ter_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
    'https://t0.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
    'https://t1.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
    'https://t2.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
    'https://t3.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
    'https://t4.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
    'https://t5.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
    'https://t6.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
  ],
  tileSize: 256,
}
const tdtVecLayer: RasterLayer = {
  id: tdtVecLayerId,
  type: 'raster',
  source: 'tdtVecSource',
  layout: {
    visibility: 'visible'
  }
}

// 天地图矢量标注
const tdtCvaLayerId = 'tdtCvaLayer'
const tdtCvaSource: RasterSource = {
  type: 'raster',
  tiles: [
    'https://t0.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
    'https://t1.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
    'https://t2.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
    'https://t3.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
    'https://t4.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
    'https://t5.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
    'https://t6.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
  ],
  tileSize: 256,
}
const tdtCvaLayer: RasterLayer = {
  id: tdtCvaLayerId,
  type: 'raster',
  source: 'tdtCvaSource',
  layout: {
    visibility: 'visible'
  }
}

// 天地图影像底图
const tdtImgLayerId = 'tdtImgLayer'
const tdtImgSource: RasterSource = {
  type: 'raster',
  tiles: [
    'https://t0.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
    'https://t1.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
    'https://t2.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
    'https://t3.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
    'https://t4.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
    'https://t5.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
    'https://t6.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
    // 'http://119.3.216.201:21702/user-data/{z}/{x}/{y}/tiandimap_{z}-{x}-{y}.png',】
  ],
  tileSize: 256,
}
const tdtImgLayer: RasterLayer = {
  id: tdtImgLayerId,
  type: 'raster',
  source: 'tdtImgSource',
  layout: {
    visibility: 'none'
  }
}

// 天地图影像标注
const tdtCiaLayerId = 'tdtCiaLayer'
const tdtCiaSource: RasterSource = {
  type: 'raster',
  tiles: [
    'https://t0.tianditu.gov.cn/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
    'https://t1.tianditu.gov.cn/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
    'https://t2.tianditu.gov.cn/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
    'https://t3.tianditu.gov.cn/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
    'https://t4.tianditu.gov.cn/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
    'https://t5.tianditu.gov.cn/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
    'https://t6.tianditu.gov.cn/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=0866c3992f556685911c58b631f978c0',
  ],
  tileSize: 256,
}
const tdtCiaLayer: RasterLayer = {
  id: tdtCiaLayerId,
  type: 'raster',
  source: 'tdtCiaSource',
  layout: {
    visibility: 'none'
  }
}

const darkSource: RasterSource = {
  type: 'raster',
  tiles: [
    'http://cfdt.ninecosmos.cn/darkmap-retina/{z}/{x}/{y}.png',
  ],
  tileSize: 256,
}
const darkSourceLayer: RasterLayer = {
  id: 'darkSourceLayer',
  type: 'raster',
  source: 'darkSource',
}

export default function useMapbox() {
  const map = shallowRef<Map | null>(null)
  const baseMapLayer = ref(BaseMapType.TDT_VECTOR)

  const initMap = (options: MapboxOptions) => {
    map.value = new mapboxGL.Map({
      accessToken: 'pk.eyJ1IjoiY3Q0MDltcXJvcyIsImEiOiJjbHAycXk3dHMwczR6MnFtcjRpenJsaHY0In0.MiS9dSXCQ7VqNz6lPREsHw',
      center: mapConfigSample.center,
      zoom: mapConfigSample.zoom,
      maxZoom: 10,
      minZoom: 1,
      preserveDrawingBuffer: true,
      dragRotate: false,
      pitchWithRotate: false,
      style: {
        version: 8,
        name: 'Mapbox Streets',
        glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
        sources: {
          tdtVecSource,
          darkSource,
          tdtCvaSource,
          tdtImgSource,
          tdtCiaSource,
        },
        layers: [
          tdtVecLayer,
          darkSourceLayer,
          tdtCvaLayer,
          tdtImgLayer,
          tdtCiaLayer,
        ],
      },
      ...options,
    })

    map.value.on('click', (e) => {
      // 获取点击的坐标信息
      const lngLat = e.lngLat;

      // 在控制台输出坐标信息
      console.log('Clicked at:', lngLat);
    });
  }

  const changeBaseMap = (type: BaseMapType) => {
    baseMapLayer.value = type
    if (type === BaseMapType.TDT_VECTOR) {
      map.value?.setLayoutProperty(tdtVecLayerId, 'visibility', 'visible')
      map.value?.setLayoutProperty(tdtCvaLayerId, 'visibility', 'visible')
      map.value?.setLayoutProperty(tdtImgLayerId, 'visibility', 'none')
      map.value?.setLayoutProperty(tdtCiaLayerId, 'visibility', 'none')
    } else if (type === BaseMapType.TDT_IMAGE) {
      map.value?.setLayoutProperty(tdtVecLayerId, 'visibility', 'none')
      map.value?.setLayoutProperty(tdtCvaLayerId, 'visibility', 'none')
      map.value?.setLayoutProperty(tdtImgLayerId, 'visibility', 'visible')
      map.value?.setLayoutProperty(tdtCiaLayerId, 'visibility', 'visible')
    }
  }

  const wmsSourceId = 'wms-source'
  const wmsLayerId = 'wms-layer'

  const addWmsLayer = (serverUrl: string, layers: string, style: string) => {
    const url = `${serverUrl}?bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&transparent=true&width=512&height=512&layers=${layers}&style=${style}`
    map.value?.addSource(wmsSourceId, {
      'type': 'raster',
      'tiles': [url],
    });
    map.value?.addLayer(
      {
        'id': wmsLayerId,
        'type': 'raster',
        'source': wmsSourceId,
      }
    );
  }

  const addWmsLayer2 = () => {
    map.value?.addSource('mapbox-test-source', {
      'type': 'raster',
      'tiles': [
        'http://localhost:8080/geoserver/test/wms?service=WMS&version=1.1.0&request=GetMap&layers=test:mapbox-test&styles=&bbox={bbox-epsg-3857}&width=768&height=768&srs=EPSG:3857&format=image/png&TRANSPARENT=TRUE',
      ],
      'tileSize': 256
    });
    map.value?.addLayer({
      id: 'mapbox-test-layer',
      type: 'raster',
      source: 'mapbox-test-source',
      paint: {
        'raster-opacity': 0.3,
      },
    });
  }

  const removeWmsLayer = () => {
    const wmsSource = map.value?.getSource(wmsSourceId)
    if (wmsSource) {
      map.value?.removeSource(wmsSourceId)
      map.value?.removeLayer(wmsLayerId)
    }
  }

  const client = new MapboxClient()

  const setColorConfig = (
    colorConfig: {
      factor: string
      colors: (string | number)[][]
    },
    decodeConfig?: {
      min: number
      step: number
    },
  ) => {
    client.colorMapTileLayer.setColorConfig(colorConfig.factor, ColorRamp.getColorRamp(colorConfig.colors))
    if (decodeConfig) {
      client.colorMapTileLayer.setDecodeConfig(colorConfig.factor, decodeConfig.min, decodeConfig.step)
    }
  }

  const setColorMapTileLayerOption = (url: string, factor: string) => {
    client.colorMapTileLayer.setOption({
      url,
      factor,
      zoom: 0,
    })
  }

  const updateProvinceLayerLayout = (
    map: MapboxMap,
    city: string,
    province: string,
    country: string
  ) => {
    let countryCorrected = country
    let provinceCorrected = province
    if (province === 'Taiwan') {
      if (city) {
        countryCorrected = 'Taiwan'
      } else {
        provinceCorrected = '台湾省'
      }
    } else if (province === 'Northern Areas') {
      countryCorrected = 'Azad Kashmir'
      provinceCorrected = 'Gilgit-Baltistan'
    } else if (province === 'Azad Kashmir') {
      countryCorrected = 'Azad Kashmir'
    } else if (province === 'Jammu & Kashmir') {
      countryCorrected = 'Jammu and Kashmir'
      provinceCorrected = 'Jammu and Kashmir'
    }
    if (city && provinceCorrected && countryCorrected) {
      console.log(city, provinceCorrected, countryCorrected);
      
      map.setPaintProperty('cityHighlightLayerId', 'line-color', [
        'case',
        ['all', ['==', ['get', 'city'], city], ['==', ['get', 'province'], provinceCorrected], ['==', ['get', 'country'], countryCorrected]],
        '#008DB3',
        'rgba(0, 0, 0, 0)',
      ]);
      map.setPaintProperty('provinceHighlightLayerId', 'line-color', 'rgba(0, 0, 0, 0)');
    } else if (provinceCorrected && countryCorrected) {
      map.setPaintProperty('provinceHighlightLayerId', 'line-color', [
        'case',
        ['all', ['==', ['get', 'province'], provinceCorrected], ['==', ['get', 'country'], countryCorrected]],
        '#008DB3',
        'rgba(0, 0, 0, 0)',
      ]);
      map.setPaintProperty('cityHighlightLayerId', 'line-color', 'rgba(0, 0, 0, 0)');
    } else {
      map.setPaintProperty('provinceHighlightLayerId', 'line-color', 'rgba(0, 0, 0, 0)');
      map.setPaintProperty('cityHighlightLayerId', 'line-color', 'rgba(0, 0, 0, 0)');
    }
  }

  /**
  * 添加省份城市边界图层
  * @param map mapbox实例
  * @param show 是否显示
  * @param clickCallback 点击后的回调函数，传回城市、省份、国家
  */
  const addProvinceCityLayer = (map: MapboxMap, show = true, clickCallback?: (city: string, province: string, country: string) => void) => {
    // 添加市级规划区
    map.addSource('citySourceId', {
      type: 'vector',
      scheme: "tms",
      tiles: [
        'http://localhost:8080/geoserver/gwc/service/tms/1.0.0/test%3Aworld_china_city_4@EPSG%3A900913@pbf/{z}/{x}/{y}.pbf'
        // `http://119.3.216.201:21621/geoserver/gwc/service/tms/1.0.0/global-cities:gadm_city_c@EPSG%3A900913@pbf/{z}/{x}/{y}.pbf`,
      ]
    });
    const cityNotShowProvinces = [
      '北京市', '天津市',
      '上海市', '重庆市',
      '台湾省',
    ]
    map.addLayer({
      id: 'cityLayerId',
      type: 'fill',
      source: 'citySourceId',
      // "source-layer": "gadm_city_c",
      "source-layer": "world_china_city_4",
      minzoom: 5,
      layout: {
        visibility: show ? 'visible' : 'none',
      },
      filter: [
        'all',
        ['in', ['get', 'country'], ['literal', ['CHINA'/** , 'Taiwan' */]]],
        ['!', ['in', ['get', 'province'], ['literal', cityNotShowProvinces]]],
      ],
      paint: {
        "fill-color": 'rgba(0, 0, 0, 0)',
        "fill-outline-color": 'red',
      },
    });
    // 添加省级规划区
    map.addSource('provinceSourceId', {
      type: 'vector',
      scheme: "tms",
      tiles: [
        'http://localhost:8080/geoserver/gwc/service/tms/1.0.0/test%3Aworld_china_province@EPSG%3A900913@pbf/{z}/{x}/{y}.pbf',
      ]
    });
    const showProvinceCountryArr = [...areaOptions.map(opt => opt.value), 'Azad Kashmir', 'Jammu and Kashmir']
    console.log(showProvinceCountryArr);
    
    map.addLayer({
      id: 'provinceLayerId',
      type: 'fill',
      source: 'provinceSourceId',
      "source-layer": "world_china_province",
      filter: [
        'any',
        ['all', ['in', ['get', 'country'], ['literal', showProvinceCountryArr]], ['<', ['zoom'], 5]],
        ['all', ['in', ['get', 'country'], ['literal', showProvinceCountryArr.filter((_, index) => index !== 1)]], ['>=', ['zoom'], 5]],
        ['in', ['get', 'province'], ['literal', cityNotShowProvinces]],
      ],
      layout: {
        visibility: show ? 'visible' : 'none',
      },
      paint: {
        "fill-color": 'rgba(0, 0, 0, 0)',
        "fill-outline-color": 'red',
      },
    });

    // 添加高亮图层
    map.addLayer({
      id: 'cityHighlightLayerId',
      type: 'line',
      source: 'citySourceId',
      // "source-layer": "gadm_city_c",
      "source-layer": "world_china_city_4",
      filter: ['in', ['get', 'country'], ['literal', ['CHINA', 'Taiwan']]],
      // minzoom: 5,
      layout: {
        visibility: show ? 'visible' : 'none',
      },
      paint: {
        "line-color": 'rgba(0, 0, 0, 0)',
        "line-width": 2,
      },
    });
    map.addLayer({
      id: 'provinceHighlightLayerId',
      type: 'line',
      source: 'provinceSourceId',
      "source-layer": "world_china_province",
      filter: [
        'any',
        ['all', ['in', ['get', 'country'], ['literal', showProvinceCountryArr]]],
      ],
      layout: {
        visibility: show ? 'visible' : 'none',
      },
      paint: {
        "line-color": 'rgba(0, 0, 0, 0)',
        "line-width": 2,
      },
    });

    map.on('click', 'cityLayerId', (e) => {
      console.log('cityLayerId', e.features?.[0].properties);
      const { city, province, country } = e.features?.[0]?.properties || {}
      clickCallback && clickCallback(city, province, country)
      updateProvinceLayerLayout(map, city, province, country)
    });
    map.on('click', 'provinceLayerId', (e) => {
      console.log('provinceLayerId', e.features?.[0].properties);
      const { province, country } = e.features?.[0]?.properties || {}
      clickCallback && clickCallback('', province, country)
      updateProvinceLayerLayout(map, '', province, country)
    });
  }

  return {
    BaseMapType,
    map,
    initMap,
    changeBaseMap,
    addWmsLayer,
    addWmsLayer2,
    removeWmsLayer,
    client,
    setColorConfig,
    setColorMapTileLayerOption,
    addProvinceCityLayer,
  }
}
