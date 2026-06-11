<template>
  <div style="width: 100%;height:100%;position:relative" v-loading.fullscreen.lock="fullscreenLoading">
    <!-- 左上角控制组件，包括缩放、下载按钮 -->
    <LeftTopControl
        :zoomStep="1"
        :showZoom="true"
        :showDownload="true"
        :showRectangleSelect="false"
        :showExtraBtn="false"
        @rectangleSelected="handleRectangleSelected"
    />
    <!-- 右上角表单组件，用于提交查询 -->
    <MapRightTopForm @submit="submitForm"/>
    <!-- 右下角图例组件 -->
    <ColorLegend
        :unit="colorStore.getFactorUnit(factorValue)"
        :thresholds="colorStore.getFactorThresholds(factorValue)"
        :colors="colorStore.getFactorColors(factorValue)"
    />
    <!-- 地图容器 -->
    <div ref="mapContainer" class="map-container" id="mapContainer"/>

  </div>
</template>

<script lang="ts" setup>
import {ref, onMounted, onBeforeUnmount, watch} from 'vue';
import {addFlagPopupAtPoint, initMap, removeFlagPopup} from "@/composables/map/useInitMap.ts";
import {useMapStore, useColorStore} from "@/stores";
import {useI18n} from 'vue-i18n'
import _ from "lodash";
import MapRightTopForm from "@/components/other-comp/map-comp/map-right-top-form.vue";
import LeftTopControl from "@/components/other-comp/Independent-functional/left-top-control.vue";
import ColorLegend from "@/components/other-comp/Independent-functional/color-legend.vue";
import {generateGrayColorMap, generateIntervalColorMap, IGrayColorMapConfig} from '@/utils/color-format.ts'
import {addGrayLayer} from "@/utils/add-gray-layer.ts"
import {toRoman} from "@/utils/tool.ts";
import {IWaveFormData} from './map-right-top-form.vue'
import {ElMessage} from "element-plus";
import {getPointMeanValue, getSwhMean} from "@/apis/mapApi.ts";

const mapStore = useMapStore()
const colorStore = useColorStore()
const {marketMap} = storeToRefs(mapStore)
const {t} = useI18n()
const onlineImage = ref<string>('')
const fullscreenLoading = ref<boolean>(false);

// 当前因子
const factorValue = ref<string>('swh')

// 创建地图容器的引用
const mapContainer = ref<HTMLElement | null>(null);

const thresholdArr = ref<number[]>([])

// 接收框选区域事件
const handleRectangleSelected = (bounds: { topLeft: [number, number]; bottomRight: [number, number] }) => {
  console.log('框选区域：', bounds)
  // 在此可以继续处理，比如请求接口或标记区域
}

// 步骤3：提交表单并获取在线图像地址
const submitForm = async (form: IWaveFormData) => {
  thresholdArr.value = form.LOCALchosenArr
  colorStore.setFactorThresholds(form.factor, thresholdArr.value)
  try {
    fullscreenLoading.value = true
    const {data, errcode} = await getSwhMean(form);
    onlineImage.value = 'http://58.215.121.57:21920/'.concat(data.url)
    mapAddPoint(form)
    removeFlagPopup()
  } catch (error) {
    ElMessage({
      message: error,
      type: 'error',
    })
    fullscreenLoading.value = false
  }
}

// 鼠标点击事件
let handleClick: ((e: mapboxgl.MapMouseEvent & mapboxgl.EventData) => void) | null = null
const mapAddPoint = (form: IWaveFormData) => {
  if (handleClick) {
    marketMap.value.off('click', handleClick) // 移除旧 handler
  }
  handleClick = (e) => {
    queryPointInfo(e, form)
  }
  marketMap.value.on('click', handleClick)
}
// 调用点位查询接口并添加旗子
const queryPointInfo = async (e, form: IWaveFormData) => {
  const _form = _.cloneDeep(form) as any
  delete _form.LOCALchosenArr
  delete _form.LOCALfactorType
  delete _form.LOCALstatFeature
  delete _form.LOCALthresholdCustom
  delete _form.LOCALthresholdType
  delete _form.LOCALyears

  const roundToNearestHalf = (value: number): number => {
    const intPart = Math.floor(value)
    const decimal = value - intPart
    const nearest = decimal < 0.25 ? 0 : decimal < 0.75 ? 0.5 : 1
    return intPart + nearest
  }
  _form['lon'] = roundToNearestHalf(e.lngLat.lng)
  // 边界修正逻辑
  if (_form['lon'] < -180) _form['lon'] += 360;
  if (_form['lon'] > 180) _form['lon'] -= 360;
  _form['lat'] = roundToNearestHalf(e.lngLat.lat)

  try {
    const {data, errcode} = await getPointMeanValue(_form);
    const thresholdsArr = colorStore.getFactorThresholds(factorValue.value)
    const valueLabel = ref<string>('暂无')
    // 判断返回值属于哪个区间，并返回下限值对应的 index
    if (typeof data.value === 'number') {
      for (let i = 0; i < thresholdsArr.length - 1; i++) {
        if (data.value >= thresholdsArr[i] && data.value < thresholdsArr[i + 1]) {
          valueLabel.value =  `${toRoman(colorStore.getFactorColors(factorValue.value).length - i)}级`
        }
      }
    }
    addFlagPopupAtPoint(marketMap.value!, {
      lngLat: [e.lngLat.lng, e.lngLat.lat],
      factorLabel: '有效波高',
      factorValue: data.value ? `${Number(data.value).toFixed(2)}${colorStore.getFactorUnit(factorValue.value)}` : '暂无',
      dangerValue: valueLabel.value,
    })
  } catch (error) {
    ElMessage({
      message: error,
      type: 'error',
    })
  }


}

const addGrayFunc = (url, arr) => {
  // 配置灰度图颜色映射规则
  const temperatureGrayColors = getColorRamp(arr)
  console.log(temperatureGrayColors,'颜色映射规则')
  // 添加带颜色映射的灰度图图层
  addGrayLayer({
    map: marketMap.value!,
    id: 'test-image',
    imageUrl: url, // 你的灰度图路径
    bounds: [
      [-180, 85], // 左上
      [180, 85],  // 右上
      [180, -85], // 右下
      [-180, -85] // 左下
    ], // 对应图像的地理范围
    opacity: 0.9,
    colorRamp: temperatureGrayColors,
  })
}

const addOtherLayer = () => {
  // 添加世界陆地图层
  if (!marketMap.value?.getSource('world_china_province')) {
    marketMap.value?.addSource('world_china_province', {
      type: 'vector',
      tiles: [
        'http://119.3.216.201:21788/geoserver/gwc/service/tms/1.0.0/worldmap_qh%3Aworldmap_qh_store@EPSG:900913@pbf/{z}/{x}/{y}.pbf'
      ],
      scheme: 'tms'
    });
  }
  if (marketMap.value?.getLayer('world_china_province')) {
    marketMap.value?.removeLayer('world_china_province');
  }
  marketMap.value?.addLayer({
    id: 'world_china_province',
    type: 'fill',
    source: 'world_china_province',
    'source-layer': 'worldmap_qh_store',
    paint: {
      'fill-color': '#808080',
      'fill-opacity': 1
    }
  });

  // 添加暗线图层图层
  if (marketMap.value?.getLayer('osm-tiles')) {
    marketMap.value?.removeLayer('osm-tiles');
  }
  marketMap.value?.addLayer({
    id: 'osm-tiles',
    type: 'raster',
    source: 'osm-tiles',
  })

  // 添加地点注记图层
  if (marketMap.value?.getLayer('cvaLayer2')) {
    marketMap.value?.removeLayer('cvaLayer2');
  }
  marketMap.value?.addLayer({
    id: 'cvaLayer2',
    type: 'raster',
    source: 'cvaSource',
  })

  fullscreenLoading.value = false
}

// 步骤2：添加影像图层与灰度图层
const addPhotoLayer = (url, arr) => {
  if (!url) return
  addGrayFunc(url, arr)
  addOtherLayer()
}

// 获取渲染颜色配置
const getColorRamp = (data: number[], precision: number = 5) => {
  // 配置灰度图颜色映射规则
  const config: IGrayColorMapConfig = generateIntervalColorMap(data, precision)
  // 生成颜色映射数组
  return generateGrayColorMap(config)
}

// 步骤4：监听在线图像变化，更新图层图像
watch(onlineImage, (newUrl) => {
  // 添加图层
  addPhotoLayer(newUrl, thresholdArr.value)
});

// 步骤1：组件挂载时初始化地图及加载数据
onMounted(async () => {
  // 如果容器不存在则返回
  if (!mapContainer.value) return;
  // 初始化地图实例
  marketMap.value = initMap('mapContainer')

  // 地图加载完成后执行
  marketMap.value.on('load', async () => {
    if (!marketMap.value) return;
    fullscreenLoading.value = true
    addOtherLayer()
  });
});

// 组件卸载前执行
onBeforeUnmount(() => {
  if (marketMap.value) {
    marketMap.value.remove();  // 移除地图实例
  }
});
</script>

<style>
/* 地图容器样式 */
.map-container {
  width: 100%;
  height: 100%;
}


@-webkit-keyframes rotation {
  0% {
    -webkit-transform: rotate(0deg)
  }

  to {
    -webkit-transform: rotate(-1turn)
  }
}

@keyframes rotation {
  0% {
    -webkit-transform: rotate(0deg)
  }

  to {
    -webkit-transform: rotate(-1turn)
  }
}

.typhoon-center-png-wrapper {
  width: 34px;
  height: 35px;
}

.typhoon-center-png-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.typhoon-center-png {
  position: relative;
  width: 35px;
  height: 35px;
  background: url(/mapImages/grade.png);
  animation: rotation 1s linear infinite;
}

.typhoon-center-png.typhoon-center-png-0 {
  background-position: 0px 0;
}

.typhoon-center-png.typhoon-center-png-1 {
  background-position: -35px 0;
}

.typhoon-center-png.typhoon-center-png-2 {
  background-position: -70px 0;
}

.typhoon-center-png.typhoon-center-png-3 {
  background-position: -105px 0;
}

.typhoon-center-png.typhoon-center-png-4 {
  background-position: -140px 0;
}

.typhoon-center-png.typhoon-center-png-5 {
  background-position: -175px 0;
}

.mapboxgl-popup-content .typhoon-pop-content,
.mapboxgl-popup-content .pop-content {
  display: block;
}

.typhoon-switch-container,
.typhoon-pop-content,
.pop-content {
  display: none;
  color: #FFFEFE;
  font-size: 12px;
}

.pop-content {
  &-location {
    max-width: 130px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 5px;

    &-icon {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      width: 18px;
      height: 18px;
      margin-left: 8px;
      border-radius: 50%;
      border: 1px solid #FFFEFE;
      cursor: pointer;
      box-sizing: border-box;
    }
  }
}

.mapboxgl-marker {
  cursor: pointer;

  svg {
    height: 30px;
    width: auto;
  }
}

.marker-popup {
  .mapboxgl-popup-content {
    background: rgba(0, 0, 0, 0.7);
    border-radius: 5px;
    padding: 9px;
  }

  .mapboxgl-popup-tip {
    border-width: 6px;
  }

  &.mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip {
    border-top-color: rgba(0, 0, 0, 0.7);
  }

  &.mapboxgl-popup-anchor-top .mapboxgl-popup-tip {
    border-bottom-color: rgba(0, 0, 0, 0.7);
  }

  &.mapboxgl-popup-anchor-right .mapboxgl-popup-tip {
    border-left-color: rgba(0, 0, 0, 0.7);
  }

  &.mapboxgl-popup-anchor-left .mapboxgl-popup-tip {
    border-right-color: rgba(0, 0, 0, 0.7);
  }

  .mapboxgl-popup-close-button {
    color: #fff;
    font-size: 18px;
  }
}

.mapboxgl-popup-content .typhoon-switch-container {
  display: flex;
  align-items: center;
}

.marker-popup.marker-popup-typhoon-switch {
  .mapboxgl-popup-content {
    padding: 4px 5px 4px 9px;
  }
}

.typhoon-switch-container-popover {
  &.el-popover.el-popper {
    min-width: 100px;
    padding: 4px 2px;
  }

  .typhoon-switch-options {
    font-size: 12px;
  }

  .typhoon-switch-option {
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 2px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &:hover {
      background-color: #eee;
    }
  }

  .typhoon-switch-option-active {
    color: #4988FD;
  }
}
</style>