import {
  Cartesian3,
  Ellipsoid,
  EllipsoidSurfaceAppearance,
  GeometryInstance, Material,
  Primitive,
  Rectangle,
  RectangleGeometry,
} from 'cesium';

const sourceR = `
czm_material czm_getMaterial(czm_materialInput materialInput) {
  czm_material material = czm_getDefaultMaterial(materialInput);
  vec4 rgba = texture(image, materialInput.st);
  float f = 1.0 - rgba.b;
  vec4 color = texture(color_ramp, vec2(rgba.r, 0.5)) * f;
  color = czm_gammaCorrect(color);
  material.diffuse = color.rgb;
  material.alpha = color.a;
  return material;
}
`;
const sourceUV = `
uniform vec3 u_range_uv;
uniform vec3 u_range_s;

float uv2s(vec4 rgba){
  float u = rgba.r * (u_range_uv.y - u_range_uv.x) + u_range_uv.x;
  float v = rgba.g * (u_range_uv.y - u_range_uv.x) + u_range_uv.x;
  float s = sqrt(u * u + v * v);
  return (s - u_range_s.x) / (u_range_s.y - u_range_s.x);
}

czm_material czm_getMaterial(czm_materialInput materialInput) {
  czm_material material = czm_getDefaultMaterial(materialInput);
  vec4 rgba = texture(image, materialInput.st);
  float r = uv2s(rgba);
  float f = 1.0 - rgba.b;
  vec4 color = texture(color_ramp, vec2(r, 0.5)) * f;
  color = czm_gammaCorrect(color);
  material.diffuse = color.rgb;
  material.alpha = color.a;
  return material;
}
`;

export const ColorConfig: Record<string, [number, string][]> = {
  wind: [
    [0, 'rgb(98, 113, 184)'], // 0
    [12 / 255, 'rgb(61, 110, 163)'], // 1.5m/s
    [24 / 255, 'rgb(74, 146, 148)'], // 3m/s
    [32 / 255, 'rgb(74, 146, 148)'], // 4m/s
    [40 / 255, 'rgb(77, 142, 124)'], // 5m/s
    [60 / 255, 'rgb(76, 164, 76)'], // 7.5m/s
    [80 / 255, 'rgb(103, 164, 54)'], // 10m/s
    [100 / 255, 'rgb(162, 135, 64)'], // 12.5m/s
    [120 / 255, 'rgb(162, 109, 92)'], // 15m/s
    [140 / 255, 'rgb(162, 135, 64)'], // 17.5m/s
    [160 / 255, 'rgb(151, 75, 145)'], // 20m/s
    [200 / 255, 'rgb(95, 100, 160)'], // 25m/s
    [240 / 255, 'rgb(91, 136, 161)'], // 30m/s
    [1, 'rgb(91, 136, 161)'],
  ],
  seaCurrent: [
    [0, 'rgb(64, 77, 144)'], // 0
    [10 / 255, 'rgb(61, 121, 110)'], // 0.1
    [20 / 255, 'rgb(50, 140, 50)'], // 0.2
    [30 / 255, 'rgb(140, 133, 49)'], // 0.3
    [40 / 255, 'rgb(143, 115, 50)'], // 0.4
    [50 / 255, 'rgb(117, 52, 68)'], // 0.5
    [60 / 255, 'rgb(107, 67, 131)'], // 0.6
    [70 / 255, 'rgb(67, 93, 133)'], // 0.7
    [80 / 255, 'rgb(73, 122, 132)'], // 0.8
    [90 / 255, 'rgb(115, 135, 139)'], // 0.9
    [100 / 255, 'rgb(144, 144, 144)'],// 1
    [1, 'rgb(144, 144, 144)'],
  ],
  rain: [
    [0, '#a3a8af'], // 0mm
    [41 / 255, '#81cd71'], // 5mm
    [57 / 255, '#6ec569'], // 10mm
    [70 / 255, '#68c19a'], // 17.5mm
    [79 / 255, '#5db7c6'], // 25mm
    [87 / 255, '#5fabd9'], // 37.5mm
    [95 / 255, '#6199dc'], // 50mm
    [104 / 255, '#6488e0'], // 75mm
    [111 / 255, '#6973e4'], // 100mm
    [127 / 255, '#9a84e7'], // 175mm
    [132 / 255, '#f2a0e5'], // 250mm
    [141 / 255, '#dc80c9'], // 375mm
    [148 / 255, '#c15da8'], // 500m
    [1, '#b24a97'],
  ],
  waves: [
    [0, 'rgb(144,144,144)'], // 0
    [1, 'rgb(50,158,186)'], // 0
    [12 / 255, 'rgb(50,158,186)'], // 0.25m/s
    [24 / 255, 'rgb(50,158,186)'], // 0.5m/s
    [32 / 255, 'rgb(48,128,164)'], // 0.75m/s
    [40 / 255, 'rgb(48,99,142)'], // 1m/s
    [60 / 255, 'rgb(52,101,166)'], // 1.25m/s
    [80 / 255, 'rgb(56,104,192)'], // 1.5m/s
    [100 / 255, 'rgb(56,83,169)'], // 1.75m/s
    [120 / 255, 'rgb(57,61,143)'], // 2m/s
    [140 / 255, 'rgb(134,48,49)'], // 4m/s
    [160 / 255, 'rgb(194,76,91)'], // 6m/s
    [200 / 255, 'rgb(192,118,105)'], // 7.5m/s
    [240 / 255, 'rgb(192,162,157)'], // 9m/s
    [254 / 255, 'rgb(192,162,157)'], // 9m/s
    [1, 'rgb(236,225,203)'],
  ],
};

export const RangeConfig: Record<string, [number, number]> = {
  windUV: [-25, 0.2],
  windS: [0, 0.125],
  seaCurrentUV: [-2.5, 0.02],
  seaCurrentS: [0, 0.01],
  wavesS: [0, 0.2083],
};

export const Factor = {
  Waves: 'waves',
  Wind: 'wind',
  SeaCurrents: 'seaCurrents',
  Rain: 'rain'
};

interface ColorMapOptions {
  url: string,
  factor: string
}

export function useColorMap() {
  const rectangle = new RectangleGeometry({
    ellipsoid: Ellipsoid.WGS84,
    height: 10000.0,
    rectangle: Rectangle.fromDegrees(-180.0, -90, 180.0, 90),
    vertexFormat: EllipsoidSurfaceAppearance.VERTEX_FORMAT,
  });
  const geometry = new GeometryInstance({
    geometry: rectangle,
  });

  const getFabric = function (options: ColorMapOptions) {
    return new Promise((resolve, reject) => {
      const {url, factor} = options;
      let colorArray: [number, string][] = [];
      let range = [0, 0];
      let fabric = {
        uniforms: {
          image: url,
          color_ramp: document.createElement('canvas'),
          u_range_uv: new Cartesian3(),
          u_range_s: new Cartesian3()
        },
        source: '',
      };
      let rangeUV = null;
      switch (factor) {
        case Factor.Wind:
          colorArray = ColorConfig.wind;
          range = rangeFormat(RangeConfig.windS);
          rangeUV = rangeFormat(RangeConfig.windUV);
          fabric.source = sourceUV;
          fabric.uniforms.u_range_uv = new Cartesian3(rangeUV[0], rangeUV[1], rangeUV[2]);
          fabric.uniforms.u_range_s = new Cartesian3(range[0], range[1], range[2]);
          break;
        case Factor.SeaCurrents:
          colorArray = ColorConfig.seaCurrent;
          range = rangeFormat(RangeConfig.seaCurrentS);
          rangeUV = rangeFormat(RangeConfig.seaCurrentUV);
          fabric.source = sourceUV;
          fabric.uniforms.u_range_uv = new Cartesian3(rangeUV[0], rangeUV[1], rangeUV[2]);
          fabric.uniforms.u_range_s = new Cartesian3(range[0], range[1], range[2]);
          break;
        case Factor.Rain:
          colorArray = ColorConfig.rain;
          fabric.source = sourceR;
          break;
        case Factor.Waves:
          colorArray = ColorConfig.waves;
          range = rangeFormat(RangeConfig.wavesS);
          fabric.source = sourceR;
          break;
        default:
          colorArray = ColorConfig[factor];
          range = rangeFormat(RangeConfig[factor]);
          fabric.source = sourceR;
          break;
      }

      const [min, , delta] = range;
      const colors: [number, string][] = colorArray.map(item => [item[0] * 255 * delta + min, item[1]]);
      const colorOptions = {
        colorScaleType: '',
      };
      const color = createColorTexture([], colors, colorOptions);
      fabric.uniforms.color_ramp = color!.canvas;
      const image = new Image();
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
      image.onload = () => {
        fabric.uniforms.image = getBase64Image(image)
        resolve(fabric)
      }
      image.onerror = () => {
        reject(new Error('图片加载失败'))
      }
    })
  }

  const initColorMap = async function (options: ColorMapOptions) {
    const fabric = await getFabric(options)

    return new Primitive({
      geometryInstances: geometry,
      appearance: new EllipsoidSurfaceAppearance({
        material: new Material({fabric}),
      }),
      asynchronous: false,      // 确定图元是异步创建还是阻塞直到准备就绪
      compressVertices: false,  // 关闭顶点压缩
    });
  }

  const setColorMapOption = async function (primitive: Primitive, options: ColorMapOptions) {
    const fabric = await getFabric(options);
    const primitive2 = new Primitive({
      geometryInstances: geometry,
      appearance: new EllipsoidSurfaceAppearance({
        material: new Material({fabric}),
      }),
      asynchronous: false,      // 确定图元是异步创建还是阻塞直到准备就绪
      compressVertices: false,  // 关闭顶点压缩
    });
    primitive.appearance = primitive2.appearance
  }

  function getBase64Image(img: HTMLImageElement) {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx!.drawImage(img, 0, 0, img.width, img.height);
    const ext = img.src.substring(img.src.lastIndexOf(".") + 1).toLowerCase();
    return canvas.toDataURL("image/" + ext);
  }

  return {
    initColorMap,
    setColorMapOption
  }
}

function rangeFormat(range: [number, number]) {
  return [range[0], 255 * range[1] + range[0], range[1]];
}

function createColorTexture(range = [], colors: [number, string][], options: any) {
  const interpolateColor = colors
    .map((item) => ({
      key: item[0],
      value: item[1],
    }));
  const keys = interpolateColor
    .map(d => d.key);
  const [min, max] = [range[0] || Math.min(...keys), range[1] || Math.max(...keys)];
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = 256;
  canvas.height = 1;

  if (ctx) {
    if (options.colorScaleType !== 'linear') {
      const gradient = ctx.createLinearGradient(0, 0, 256, 0);

      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < interpolateColor.length; i += 1) {
        const key = interpolateColor[i].key;
        const color = interpolateColor[i].value;
        gradient.addColorStop((key - min) / (max - min), color);
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 1);
    } else {
      for (let i = 0; i < interpolateColor.length; i += 1) {
        const key = interpolateColor[i].key;
        let keyNext = key;
        if (i < interpolateColor.length - 1) {
          keyNext = interpolateColor[i + 1].key;
        } else {
          keyNext = max;
        }
        const color = interpolateColor[i].value;
        const current = (key - min) / (max - min) * 256; // 0 - 256
        const next = (keyNext - min) / (max - min) * 256; // 0 - 256
        ctx.fillStyle = color;
        ctx.fillRect(current, 0, next - current, 1);
      }
    }

    // const data = new Uint8Array(ctx.getImageData(0, 0, 256, 1).data);

    return {
      canvas,
      colorRange: [min, max],
    };
  }
}
