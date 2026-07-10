const baseSize = 16
const MOBILE_MAX = 768
const FONT_SCALE_KEY = 'travel_font_scale'

export function getTravelFontScale(): number {
  const raw = Number(localStorage.getItem(FONT_SCALE_KEY) || '1')
  if (!Number.isFinite(raw) || raw <= 0) return 1
  return Math.min(Math.max(raw, 0.85), 1.4)
}

export function setTravelFontScale(scale: number) {
  const next = Math.min(Math.max(scale, 0.85), 1.4)
  localStorage.setItem(FONT_SCALE_KEY, String(next))
  document.documentElement.style.setProperty('--app-font-scale', String(next))
  setRem()
}

export function setRem() {
  const width = document.documentElement.clientWidth
  const fontScale = getTravelFontScale()
  document.documentElement.style.setProperty('--app-font-scale', String(fontScale))

  // 手机端不能按 1920 设计稿等比缩小，否则根字号会变成 ~3px
  if (width <= MOBILE_MAX) {
    document.documentElement.style.fontSize = `${baseSize * fontScale}px`
    return
  }
  const layoutScale = Math.min(width / 1920, 1)
  document.documentElement.style.fontSize = `${baseSize * layoutScale * fontScale}px`
}

setRem()

window.addEventListener('resize', setRem)
