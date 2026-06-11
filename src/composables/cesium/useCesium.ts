import type {
  Rectangle,
  HeadingPitchRollValues, DirectionUp, Matrix4, Primitive
} from 'cesium';
import {
  Viewer,
  Cartesian3,
  Cartesian2,
  CesiumTerrainProvider,
  HeadingPitchRoll,
  Ion,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Color,
  NearFarScalar,
  HeightReference,
  CustomDataSource,
  VerticalOrigin, CreditDisplay,
} from 'cesium'
import {useCesiumBaseLayer} from '@/composables/cesium/useCesiumBaseLayer.ts'
import {useColorMap} from "@/composables/cesium/colormap/colorMap.ts";

const {initImageryLayers, addImageryLayers} = useCesiumBaseLayer()
const {initColorMap} = useColorMap()

Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4OGQwZTM2MC00NjkzLTRkZTgtYTU5MS0xZTA1NTljYWQyN2UiLCJpZCI6NTUwODUsImlhdCI6MTYyMDM5NjQ3NH0.lu_JBwyngYucPsvbCZt-xzmzgfwEKwcRXiYs5uV8uTM'

export default function useCesium() {
  const viewerRef = shallowRef<Viewer | null>(null)
  let colorMapPrimitive: Primitive | null = null  // 色斑图图元


  const initMap = async function (
    container: string,
    options?: {
      destination?: Cartesian3 | Rectangle;
      orientation?: HeadingPitchRollValues | DirectionUp;
      endTransform?: Matrix4;
      convert?: boolean;
    }
  ) {

    // 1. 视图初始化
    const terrainProvider = await CesiumTerrainProvider.fromUrl(window.env.cesium_terrain_url, {
      requestVertexNormals: true,
      requestWaterMask: true
    });
    let viewer = new Viewer(container, {
      terrainProvider,
      baseLayerPicker: false, // 图层选择器
      animation: false, // 左下角仪表
      fullscreenButton: false, // 全屏按钮
      geocoder: false, // 右上角查询搜索
      infoBox: false, // 信息框
      homeButton: false, // home按钮
      sceneModePicker: false, // 3d 2d选择器
      selectionIndicator: false, //
      timeline: false, // 时间轴
      navigationHelpButton: false, // 右上角帮助按钮
      shouldAnimate: true,
    })
    viewerRef.value = viewer
    const {scene, camera} = viewer;
    viewer.cesiumWidget.creditContainer.setAttribute('style', 'display:none') // 去除logo
    CreditDisplay.cesiumCredit.showOnScreen = false
    viewer.resolutionScale = window.devicePixelRatio; // 分辨率适配
    scene.verticalExaggeration = 10.0;                // 地形高度拉伸
    scene.verticalExaggerationRelativeHeight = 0
    scene.skyAtmosphere.show = true;                  // 大气渲染
    scene.fog.density = 0.0001                        // 雾气中水分含量
    // viewer.scene.globe.enableLighting = false
    // viewer.scene.globe.depthTestAgainstTerrain = true  // 开启深度测试
    scene.postProcessStages.fxaa.enabled = true  // 开启抗锯齿
    scene.debugShowFramesPerSecond = false       // 显示刷新率和帧率
    scene.skyBox.show = false
    // 三维色斑图需要设置背景色
    viewer.scene.globe.baseColor = Color.TRANSPARENT;
    viewer.scene.globe.undergroundColor = Color.TRANSPARENT;
    viewer.scene.globe.translucency.backFaceAlpha = 0.0;

    // viewer.scene.globe.translucency.enabled = true;
    // viewer.scene.globe.translucency.frontFaceAlphaByDistance = new NearFarScalar(1.5e2, 1.0, 1.5e6, 0.0);
    // viewer.scene.globe.translucency.backFaceAlphaByDistance = new NearFarScalar(1.5e2, 1.0, 1.5e6, 0.0);
    camera.setView(options ? options : {
      destination: new Cartesian3(
        -2710292.813384663,
        -4360657.061518585,
        3793571.786860543
      ),
      orientation: new HeadingPitchRoll(
        5.794062761901799,
        -0.30293409742984756,
        0.0009187098191985044
      ),
    });

    // 2. 底图配置
    initImageryLayers(viewer, {
      // vec_w: false,
      // cva_w: false,
      // img_w: true,
      'ter_w': true,
      // 'coastline': false
    })

    addImageryLayers(viewer)

    // 色斑图配置
    // console.log(viewer.imageryLayers)
    // viewer.imageryLayers.removeAll()
    // viewer.imageryLayers.addImageryProvider(new UrlTemplateImageryProvider({
    //   url: "https://nine-confidential.obs.cn-north-4.myhuaweicloud.com/darkmap-retina/{z}/{x}/{y}.png",
    // }));
    // viewer.scene.globe.baseColor = Color.TRANSPARENT;
    // viewer.scene.globe.undergroundColor = Color.TRANSPARENT;
    // viewer.scene.globe.translucency.enabled = true;
    // viewer.scene.globe.translucency.backFaceAlpha = 0.0;
  }

  // 查看当前视角的 x,y,z,heading,pitch,roll值
  const registerCameraClick = function (callback: Function, once?: boolean) {
    callback()
    const viewer = viewerRef.value
    if (!viewer) {
      return
    }
    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(() => {
      const heading = viewer.scene.camera.heading;
      const pitch = viewer.scene.camera.pitch;
      const roll = viewer.scene.camera.roll;
      if (once) {
        handler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
      }

      console.log(viewer.scene.camera.position);
      console.log(heading, pitch, roll);
    }, ScreenSpaceEventType.LEFT_CLICK);
  }

  const addColorMap = async (url: string, factor: string) => {
    if (colorMapPrimitive) {
      viewerRef.value!.scene.primitives.remove(colorMapPrimitive)
      colorMapPrimitive = null
    }
    colorMapPrimitive = await initColorMap({
      url,
      factor,
    })
    viewerRef.value!.scene.primitives.add(colorMapPrimitive);
  }

  const removeColorMap = () => {
    viewerRef.value!.scene.primitives.remove(colorMapPrimitive)
    colorMapPrimitive = null
  }

  const isolineDataSourceName = 'isoline'
  const isolineDataSourceRef = ref(new CustomDataSource(isolineDataSourceName))

  const addIsoline = function (url: string) {
    if (!viewerRef.value?.dataSources.contains(isolineDataSourceRef.value)) {
      viewerRef.value?.dataSources.add(isolineDataSourceRef.value)
    }
    fetch(url).then(res => {
      return res.json()
    }).then((res: any) => {
      for (let i = 0, l = res.features.length; i < l; i++) {
        const t = res.features[i]
        if (t.geometry.type === 'Point') {
          const position = Cartesian3.fromDegrees(t.geometry.coordinates[0], t.geometry.coordinates[1], 4000)
          isolineDataSourceRef.value.entities.add({
            position: position,
            label: {
              text: `${t.properties.value}`,
              font: '12pt Arial', // 字体样式
              fillColor: Color.WHITE, // 字体颜色
              outlineWidth: 1,
              verticalOrigin: VerticalOrigin.TOP,
              pixelOffset: new Cartesian2(0, 2),
              heightReference: HeightReference.RELATIVE_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
              translucencyByDistance: new NearFarScalar(6371000 * 1.7, 1.0, 6371000 * 1.701, 0.0)
            }
          })
          isolineDataSourceRef.value.entities.add({
            position: position,
            label: {
              text: `${t.properties.type}`,
              font: '16pt Arial', // 字体样式
              fillColor: Color.WHITE, // 字体颜色
              outlineWidth: 1,
              verticalOrigin: VerticalOrigin.BOTTOM,
              pixelOffset: new Cartesian2(0, -2),
              heightReference: HeightReference.RELATIVE_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
              translucencyByDistance: new NearFarScalar(6371000 * 1.7, 1.0, 6371000 * 1.701, 0.0)
            }
          })
        } else if (t.geometry.type === 'LineString') {
          const degreesArray = []
          for (let j = 0, al = t.geometry.coordinates.length; j < al; j++) {
            degreesArray.push(t.geometry.coordinates[j][0])
            degreesArray.push(t.geometry.coordinates[j][1])
          }
          if (degreesArray.length > 4) {
            const position = Cartesian3.fromDegrees(t.geometry.coordinates[0][0], t.geometry.coordinates[0][1], 4000)
            isolineDataSourceRef.value.entities.add({
              polyline: {
                positions: Cartesian3.fromDegreesArray(degreesArray),
                material: Color.WHITE,
                width: 1,
                clampToGround: true
              },
              position: position,
              label: {
                text: `${t.properties.value}`,
                backgroundColor: new Color(1, 1, 1, 0.6),
                showBackground: true,
                font: '8pt Arial', // 字体样式
                fillColor: Color.BLACK, // 字体颜色
                outlineWidth: 1,
                heightReference: HeightReference.RELATIVE_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                translucencyByDistance: new NearFarScalar(6371000 * 1.7, 1.0, 6371000 * 1.701, 0.0)
              }
            })
          }
        }
      }
    })
  }

  const removeIsoline = function () {
    isolineDataSourceRef.value.entities.removeAll()
  }

  return {
    viewerRef,
    initMap,
    registerCameraClick,
    addColorMap,
    removeColorMap,
    addIsoline,
    removeIsoline
  }
}
