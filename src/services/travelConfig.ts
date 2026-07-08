/** 默认风景图（public 目录） */
export const DEFAULT_SCENIC_IMAGE = '/images/default-scenic.jpg'

/** 最后兜底：若 default-scenic.jpg 也加载失败 */
export function localFallbackImage(): string {
  return '/t2m.jpg'
}
