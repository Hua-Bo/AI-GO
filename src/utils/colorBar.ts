export interface ColorSetting {
  data: Uint8ClampedArray
  canvas: HTMLCanvasElement
  texture?: WebGLTexture
}

export function dynamicColorBar(min: number, max: number, unit: string): Record<string, any> {
  const [step, , minFormat, , f] = calcStep(min, max)
  const colorArr = [
    [0, 'rgb(3,80,248)'],
    [0 / 255, 'rgb(3,80,248)'], // 0
    [20 / 255, 'rgb(88,119,229)'], //
    [40 / 255, 'rgb(95, 143, 197)'], // 40
    [60 / 255, 'rgb(104,192,199)'], //
    [80 / 255, 'rgb(29,154,164)'], // 80
    [100 / 255, 'rgb(80, 140, 62)'], //
    [120 / 255, 'rgb(121, 146, 28)'], // 120
    [140 / 255, 'rgb(171, 161, 14)'], //
    [160 / 255, 'rgb(223, 177, 6)'], // 160
    [180 / 255, 'rgb(243, 150, 6)'], //
    [200 / 255, 'rgb(236, 95, 21)'], // 200
    [220 / 255, 'rgb(190, 65, 18)'], //
    [240 / 255, 'rgb(138, 43, 10)'], // 240
    [1, 'rgb(138, 43, 10)'],
  ]
  const legendArr = [
    unit,
    parseFloat(minFormat.toFixed(f)),
    parseFloat((minFormat + 40 * step).toFixed(f)),
    parseFloat((minFormat + 80 * step).toFixed(f)),
    parseFloat((minFormat + 120 * step).toFixed(f)),
    parseFloat((minFormat + 160 * step).toFixed(f)),
    parseFloat((minFormat + 200 * step).toFixed(f)),
    parseFloat((minFormat + 240 * step).toFixed(f)),
  ]
  const ramp = getColorRamp(colorArr)
  return {
    color: colorArr,
    legend: legendArr,
    ramp: ramp.data,
  }
}

function calcStep(min: number, max: number): number[] {
  const t = (max - min) / 255
  if (t === 0) {
    return [0, 1 / 255, min, max + 1]
  }
  let s = 10000
  let f = 0
  while (t / s < 1) {
    s /= 10
    if (s < 1) {
      f += 1
    }
  }
  let n = 1
  while (s * n < t) {
    n += 1
  }
  const step = s * n
  const minFormat = parseFloat((Math.floor(min / s) * s).toFixed(f))
  const maxFormat = parseFloat((minFormat + 255 * s).toFixed(f))
  return [step, s, minFormat, maxFormat, f]
}

export function getColorRamp(colors: (any)[][]): ColorSetting {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 1
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  const gradient = ctx.createLinearGradient(0, 0, 256, 1)

  colors.forEach(([offset, rgb]) => {
    return gradient.addColorStop(offset, rgb)
  })
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 1)

  return {
    canvas,
    data: ctx.getImageData(0, 0, 256, 1).data,
  }
}


// eslint-disable-next-line max-params
export function getColorMinMax(data: Record<string, any>[], keys: string[], minMaxMap: Record<string, any>, unitConfig: Record<string, string>) {
  for (const k of keys) {
    let [kMin, kMax] = minMaxMap[k] ? minMaxMap[k] : [undefined, undefined]
    for (const d of data) {
      // if (d[k]) {
      if (d[k] !== undefined) {
        const t = d[k]
        if (kMin === undefined) kMin = t
        if (kMax === undefined) kMax = t
        if (t < kMin) kMin = t
        if (t > kMax) kMax = t
      }
    }
    if (kMin !== undefined) {
      const colorBar = dynamicColorBar(kMin, kMax, unitConfig[k])
      minMaxMap[k] = [kMin, kMax, colorBar]
    }
  }
  console.log(minMaxMap)
  return minMaxMap
}

export function getColorByValue(colorMinMax: Record<string, any>, factor: string, value: number) {
  const [kMin, kMax, colorBar] = colorMinMax[factor]
  if (kMax === kMin) {
    return [colorBar.ramp[0], colorBar.ramp[1], colorBar.ramp[2]]
  }
  const index = Math.floor((value - kMin) * 255 / (kMax - kMin))
  return [colorBar.ramp[index * 4], colorBar.ramp[index * 4 + 1], colorBar.ramp[index * 4 + 2]]
}
