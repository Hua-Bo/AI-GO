<script setup lang="ts">

const {map, initMap, addWmsLayer, changeBaseMap, BaseMapType, addProvinceCityLayer} = useMapbox()

const addBuildingLayer = function() {
  // map.value?.addLayer({
  //   id: "testShap",
  //   type: "fill",
  //   source: {
  //     type: "vector",
  //     scheme: "tms",
  //     tiles: [
  //       // "http://119.3.216.201:21621/geoserver/gwc/service/tms/1.0.0/global-cities:gadm_province_c@EPSG%3A900913@pbf/{z}/{x}/{y}.pbf"
  //       // "http://119.3.216.201:21621/geoserver/gwc/service/tms/1.0.0/global-cities%3Agadm_province_c@EPSG%3A900913@pbf/{z}/{x}/{y}.pbf",
  //       "http://119.3.216.201:21621/geoserver/gwc/service/tms/1.0.0/test%3AtestShap@EPSG%3A900913@pbf/{z}/{x}/{y}.pbf", // 自己传的
  //       // "http://localhost:8080/geoserver/gwc/service/tms/1.0.0/test%3Agao@EPSG%3A900913@pbf/{z}/{x}/{y}.pbf"
  //       // "http://localhost:8080/geoserver/test/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image%2Fjpeg&TRANSPARENT=true&STYLES&LAYERS=test%3Agao&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&SRS=EPSG%3A3857&WIDTH=768&HEIGHT=359&BBOX={bbox-epsg-3857}"
  //     ]
  //   },
  //   "source-layer": "testShap", // 确保名称与 GeoServer 中一致
  //   paint: {
  //     "fill-color": "black", // 高对比度颜色
  //     "fill-opacity": 0.1, // 不透明
  //     "fill-outline-color": '#000',
  //   }
  // });

  // map.value?.on('click', 'testShap', (e) => {
  //   console.log('testShap', e.features?.[0].properties);
  // });

  // world_china_province
  // world_china_city
    map.value?.addLayer({
        "id": "wcIceCat",
        "type": "fill",
        "source": {
            "type": "vector",
            // TMS 调用需要加上这行
            "scheme":"tms",
            // URL 是 GeoServer 中 TMS 的服务链接，选择墨卡托投影的那个我这里是900913
            // "tiles": ["URL/{z}/{x}/{y}.pbf"],
            "tiles": ['http://localhost:8080/geoserver/gwc/service/tms/1.0.0/test%3AwcIceCat@EPSG%3A900913@pbf/{z}/{x}/{y}.pbf'],
            // tiles: ['http://localhost:8080/geoserver/gwc/service/tms/1.0.0/test:wcIceCat@EPSG:4326@pbf/{z}/{x}/{y}.pbf']
        },
        // source-layer 是你 Geoserver 图层的名称即 上面 URL 的 title
        "source-layer": "wcIceCat",
        "paint": {
            "fill-color":'rgba(255, 0, 0, 1)',
            "fill-outline-color": '#e6205e',
            // "fill-opacity":0.1
        }
    });

    map.value?.on('click', 'wcIceCat', (e) => {
      const { NAME_2, NAME_1, COUNTRY } = e.features?.[0]?.properties || {}
      console.log('wcIceCat', NAME_2, NAME_1, COUNTRY);
      console.log(e.features?.[0]?.properties);
      
      
    })
};

const onClickProvinceOrCity = function() {
  map.value?.on('click', 'gadm_province_c', (e) => {
    const feature = e.features[0]
    console.log(feature)
  })
}

onMounted(() => {
  initMap({
    container: 'map',
    center: [108.84, 21.58],
    zoom: 8.8,
  })
  map.value?.on('load', () => {
    // 修改地图底图为卫星影像地图
    changeBaseMap(BaseMapType.TDT_IMAGE)
    // 添加一个wms图层
    // addWmsLayer('http://119.3.216.201:21621/geoserver/guangxi/wms', 'guangxi:fbc', 'guangxi:hpm_fengxian_dengji')
    // addWmsLayer2()
    addBuildingLayer();
    // addProvinceCityLayer(map.value!, true, onClickProvinceOrCity());
  })
})

</script>

<template>
  <div id="map" class="w-full h-full"/>
</template>

<style>
.mapboxgl-ctrl-logo {
  display: none !important;
}
</style>
