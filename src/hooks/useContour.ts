import type { GeoJSONSource, Map as MapboxMap } from 'mapbox-gl'
import { getGeopotentialHeight } from '@/api/map'
import { FeatureCollection } from 'geojson'
import axios from 'axios'

export const geopotentialHeightSourceId = 'geopotentialHeightSource'
export const geopotentialHeightLayerId = 'geopotentialHeightLayer'
export const geopotentialHeightTextLayerId = 'geopotentialHeightTextLayer'

export function initContourLayer(map: MapboxMap, features: FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
}) {
  map.addSource(geopotentialHeightSourceId, {
    type: 'geojson',
    data: features,
  })
  // 3. 图层处理
  map.addLayer({
    id: geopotentialHeightLayerId,
    type: 'line',
    source: geopotentialHeightSourceId,
    paint: {
      'line-color': '#410c79',
      'line-width': 2,
    },
  })
  map.addLayer({
    id: geopotentialHeightTextLayerId,
    type: 'symbol',
    source: geopotentialHeightSourceId,
    layout: {
      'text-field': '{value}',
      'text-size': 12,
      'symbol-placement': 'line',
    },
    paint: {
      'text-color': '#151212',
      'text-halo-blur': 1,
      'text-halo-color': '#fff',
      'text-halo-width': 1,
    },
  })
}

// eslint-disable-next-line max-params
export async function renderContour(
  map: MapboxMap,
  date: string,
  time_param: string,
  source: string,
  various: string,
) {
  const { data } = await getGeopotentialHeight({
    time_param,
    var: various,
    source,
    date,
    errMsg: '此时间段暂无数据',
  })
  const result = await axios.get(`${import.meta.env.VITE_HOST}${data}`)

  const src = map.getSource(geopotentialHeightSourceId)
  if (src) {
    ;(src as GeoJSONSource).setData(result.data)
  } else {
    initContourLayer(map, data)
  }
}
