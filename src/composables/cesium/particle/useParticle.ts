import type {Viewer} from "cesium";
import type {ShallowRef} from "Vue";
import CesiumWind from "./main.js"
import type {Ref} from "vue";

interface ParticleOption {
  url: string       // 图片地址
  extent: number[]  // 数据边界，[west, east, south, north],
  dx: number        // 经度分辨率
  dy: number        // 维度分辨率
  uMin: number      // 最小值
  uDelta: number    // 色值映射单位
}

function loadImage(url: string, callback: (image: HTMLImageElement) => void, onerror?: any) {
  const image = new Image();
  // const canvas = Platform.createCanvas2d({type: '2d', width: 257, height: 257})
  // const image = canvas.createImage()
  image.crossOrigin = 'anonymous';
  image.onload = () => callback(image);
  if (onerror) {
    image.onerror = onerror;
  } else {
    // tslint:disable-next-line:no-console no-empty
    image.onerror = (err) => {
      console.log(err)
    };
  }
  image.src = url;
}

const windOptions = {
  colorScale: [
    'rgb(236,239,243)',
    'rgb(245,241,242)',
  ],
  frameRate: 16,
  maxAge: 32,
  globalAlpha: 0.9,
  velocityScale: 1 / 60,
  paths: 2000
};

export default function useParticle(viewerRef: ShallowRef<Viewer | null>) {

  const particleLayer: Ref<CesiumWind | null> = ref(null)

  // 初始化粒子动画
  const initParticle = function (option: ParticleOption) {
    return new Promise((resolve) => {
      loadImage(option.url, (image) => {
        const offCanvas = document.createElement('canvas')
        offCanvas.width = image.width;
        offCanvas.height = image.height;
        const offCtx = offCanvas.getContext('2d');
        offCtx!.drawImage(image, 0, 0)
        const sid = offCtx!.getImageData(0, 0, image.width, image.height).data;
        const u = []
        const v = []
        for (let i = 0; i < sid.length; i += 4) {
          if (sid[i] === 0 && sid[i + 1] === 0) {
            u[i / 4] = null
            v[i / 4] = null
          } else {
            u[i / 4] = sid[i] * option.uDelta + option.uMin
            v[i / 4] = sid[i + 1] * option.uDelta + option.uMin
          }

        }
        const data = [
          {
            header: {
              nx: image.width,
              ny: image.height,
              lo1: option.extent[0],
              la1: option.extent[2],
              lo2: option.extent[1],
              la2: option.extent[3],
              dx: option.dx,
              dy: option.dy,
              parameterCategory: 1,
              parameterNumber: 2
            },
            data: u
          },
          {
            header: {
              nx: image.width,
              ny: image.height,
              lo1: option.extent[0],
              la1: option.extent[2],
              lo2: option.extent[1],
              la2: option.extent[3],
              dx: option.dx,
              dy: option.dy,
              parameterCategory: 1,
              parameterNumber: 3
            },
            data: v
          }
        ]
        particleLayer.value = new CesiumWind(data, {windOptions});
        resolve(particleLayer.value)
      })
    })
  }

  // 添加粒子动画
  const addParticle = function (windLayer: CesiumWind) {
    windLayer.addTo(viewerRef.value);
  }

  // 删除粒子动画
  const removeParticle = function (windLayer: CesiumWind) {
    windLayer.remove();
  }

  return {
    particleLayer,
    initParticle,
    addParticle,
    removeParticle
  }
}
