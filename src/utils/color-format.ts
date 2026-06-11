// 灰度图颜色映射配置接口
export interface IGrayColorMapConfig {
  min: number;    // 最小灰度值，对应起始色阶位置
  step: number;   // 每个色阶代表的灰度区间跨度（用于计算归一化比例）
  values: number[]; // 灰度值数组，通常是映射区间的关键点
  colors: string[]; // 对应每个灰度值的颜色值（如 'rgb(255,255,255)'）
}

/**
 * 根据配置生成灰度值与颜色的映射关系
 * @param config 包含最小值、步长、灰度值数组和颜色数组
 * @returns [归一化灰度值, 颜色] 的映射数组
 */
export function generateGrayColorMap(config: IGrayColorMapConfig): [number, string][] {
  const { min, step, values, colors } = config;
  const result: [number, string][] = [];

  for (let i = 0; i < values.length; i++) {
    // 归一化灰度值计算：用于 WebGL 中着色映射（值减去最小值再除以步长）
    const ratio = parseFloat(((values[i] - min) / step).toFixed(6));
    result.push([ratio, colors[i]]);
  }

  return result;
}

/**
 * 根据数值区间自动生成颜色映射配置
 * @param data 原始数值数组（最多6个值）
 * @param precision 小数精度，默认保留5位
 * @returns IGrayColorMapConfig 对象
 */
export function generateIntervalColorMap(data: number[], precision = 5): IGrayColorMapConfig {
  const fixed = (n: number) => parseFloat(n.toFixed(precision));
  const sorted = [...data].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const step = max - min;

  const values: number[] = [];
  const colors: string[] = [];

  const colorPalette = [
    'rgb(255,0,0)',     // 红
    'rgb(255,255,0)',   // 黄
    'rgb(0,0,255)',     // 蓝
    'rgb(0,255,0)',     // 绿
    'rgb(128,0,128)'    // 紫
  ];

  const epsilon = Math.pow(10, -precision);

  values.push(fixed(min)); // 推入最小值

  for (let i = 1; i < sorted.length - 1; i++) {
    const boundary = fixed(sorted[i]);
    values.push(fixed(boundary - epsilon));
    values.push(fixed(boundary + epsilon));
  }

  values.push(fixed(max)); // 推入最大值

  for (let i = 0; i < sorted.length - 1; i++) {
    const color = colorPalette[i];
    colors.push(color, color);
  }

  return {
    min,
    step,
    values,
    colors
  };
}