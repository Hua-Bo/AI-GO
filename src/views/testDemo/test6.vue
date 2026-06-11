<script setup lang="ts">
import html2canvas from 'html2canvas'
const { map, initMap, addWmsLayer, changeBaseMap, BaseMapType, addProvinceCityLayer } = useMapbox();
const mapInstance = ref(null);
const dialogTableVisible = ref(false);// 弹窗开关
const imgUrl = ref(''); // 截取到的地图图层
const bounds: any = ref(null); // 存储地图边界

// // 定义加载 GeoServer 数据的方法
// const getGeoServerData = (): Promise<{ data: any }> => {
//   const url = `http://localhost:8080/geoserver/test/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=test%3Anyc_roads&maxFeatures=50&outputFormat=application%2Fjson`;

//   return new Promise<{ data: any }>((resolve, reject) => {
//     fetch(url, {
//       method: "GET",
//       mode: "cors", // 确保支持跨域请求
//     })
//       .then((res) => res.json())
//       .then((res) => resolve({ data: res }))
//       .catch((e) => reject(e));
//   });
// };

// // 动态加载 GeoServer 数据
// const loadGeoServerData = async () => {
//   try {
//     const { data } = await getGeoServerData();
//     console.log(data);

//     if (!data || !map.value) return;

//     const sourceId = "geoServerSource";
//     const layerId = "geoServerLayer";

//     // 检查是否已存在该数据源
//     const existingSource = map.value.getSource(sourceId);
//     if (existingSource) {
//       // 更新 GeoJSON 数据
//       (existingSource as GeoJSONSource).setData(data);
//     } else {
//       // 添加新的 GeoJSON 数据源
//       map.value.addSource(sourceId, {
//         type: "geojson",
//         data,
//       });

//       // 添加图层
//       map.value.addLayer({
//         id: layerId,
//         type: "line", // 可更改为 "fill" 或 "circle" 根据需要调整
//         source: sourceId,
//         layout: {
//           "line-join": "round",
//           "line-cap": "round",
//         },
//         paint: {
//           "line-color": "#FF5733", // 设置线条颜色
//           "line-width": 2, // 设置线条宽度
//         },
//       });
//     }
//   } catch (error) {
//     console.error("加载 GeoServer 数据失败:", error);
//   }
// };

// 获取地图的边界
const getMapBounds = () => {
  const mapBounds = map.value?.getBounds();
  const result = {
    lngMax: mapBounds?._ne.wrap().lng, // 最大经度
    lngMin: mapBounds?._sw.wrap().lng, // 最小经度
    latMax: mapBounds?._ne.wrap().lat, // 最大纬度
    latMin: mapBounds?._sw.wrap().lat, // 最小纬度
  };
  bounds.value = result;
  console.log('Map Bounds:', bounds.value);
};

// 获取截图地址并显示弹框
const downloadImg = async () => {
  const canvas = await html2canvas(mapInstance.value!, { logging: false });
  imgUrl.value = canvas.toDataURL('image/png');
  dialogTableVisible.value = true;
};

const onClickProvinceOrCity = (city: string, province: string, country: string) => {
  console.log(city, province, country);
}


onMounted(() => {
  initMap({
    container: 'map',
    center: [108.84, 21.58],
    zoom: 8.8,
  });

  map.value?.on('load', () => {
    // 修改地图底图为卫星影像地图
    changeBaseMap(BaseMapType.TDT_IMAGE);
    // 添加一个wms图层
    addWmsLayer(
      'http://119.3.216.201:21621/geoserver/guangxi/wms',
      'guangxi:fbc',
      'guangxi:hpm_fengxian_dengji'
    );
    // 获取当前地图边界
    getMapBounds();
    addProvinceCityLayer(map.value!, true, onClickProvinceOrCity)
  });

  // 监听地图移动事件，实时获取地图边界
  map.value?.on("moveend", () => {
    getMapBounds();
  });
});
</script>

<template>
  <div id="map" ref="mapInstance" class="w-full h-full" />
  <div class="fixed top-0 left-0 z-10 p-2 bg-black/50 text-white" @click="downloadImg">下载图片{{dialogTableVisible}}</div>
  <MapScreenshotDialog 
    :dialogVisible="dialogTableVisible"
    :imgUrl="imgUrl"
    :mapBounds="bounds"
    @update:dialog-visible = "dialogTableVisible = $event"
  />
</template>

<style scoped>
/* 保持原有地图样式 */
.mapboxgl-ctrl-logo {
  display: none !important;
}
</style>