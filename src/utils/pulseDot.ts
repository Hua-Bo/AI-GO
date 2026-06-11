export type PulseDotOptions = {
    // 逻辑尺寸（CSS 像素），实际绘制会自动乘 DPR
    width: number
    height: number
  
    // 点中心（CSS 像素）
    x: number
    y: number
  
    // 中心点
    dotRadius?: number
    dotColor?: string
  
    // 脉冲层（原字段保留）
    ringCount?: number // 层数
    minRingRadius?: number // 起始半径
    maxRingRadius?: number // 最大半径
    ringLineWidth?: number // 保留字段（实心模式不再使用）
    ringColor?: string // 扩散层颜色（统一）
    ringColors?: string[] // 或每层不同颜色（优先于 ringColor）
    periodMs?: number // 一个圈从小到大时长
    fadePow?: number // 透明度衰减强度（越大越快变淡）
  
    // ✅ 新增：软边强度（0~1），越大越柔和，默认 0.5
    softEdge?: number
  
    // 背景（可选）
    clearColor?: string | null // null=透明清屏；'#000' 等=纯色底
  
    // 叠加效果（可选）：'source-over' 普通；'lighter' 亮色叠加更“发光”
    composite?: GlobalCompositeOperation
  }
  
  export function createPulseDot(canvas: HTMLCanvasElement, opt: PulseDotOptions) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context not available')
  
    let raf = 0
    let running = false
    let dpr = Math.max(1, window.devicePixelRatio || 1)
    let startTs = 0
  
    // 默认值
    const get = () => {
      const ringCount = opt.ringCount ?? 3
      const periodMs = opt.periodMs ?? 1200
      const dotRadius = opt.dotRadius ?? 8
      const dotColor = opt.dotColor ?? '#18D6C8'
      const minRingRadius = opt.minRingRadius ?? dotRadius + 6
      const maxRingRadius = opt.maxRingRadius ?? dotRadius + 30
  
      const ringColor = opt.ringColor ?? dotColor
      const ringColors = opt.ringColors
      const fadePow = opt.fadePow ?? 2.0
      const clearColor = opt.clearColor ?? null
      const composite = opt.composite ?? 'source-over'
  
      // ✅ 软边强度：0.35~0.55 最像你图里那种“连续无留白”
      const softEdge = clamp01(opt.softEdge ?? 0.5)
  
      return {
        ringCount,
        periodMs,
        dotRadius,
        dotColor,
        minRingRadius,
        maxRingRadius,
        ringColor,
        ringColors,
        fadePow,
        clearColor,
        composite,
        softEdge,
      }
    }
  
    const resize = (width = opt.width, height = opt.height) => {
      opt.width = width
      opt.height = height
      dpr = Math.max(1, window.devicePixelRatio || 1)
  
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
  
      // 统一用 CSS 像素绘制：先 scale 到 DPR
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
  
    // easing：让扩散更“自然”（先快后慢）
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
  
    const clear = () => {
      const { clearColor } = get()
      if (clearColor) {
        ctx.save()
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.fillStyle = clearColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.restore()
      } else {
        ctx.clearRect(0, 0, opt.width, opt.height)
      }
    }
  
    // ----------- 关键：无留白的“实心软边扩散层” -----------
    const withAlpha = (c: string, a: number) => {
      a = clamp01(a)
  
      // rgba(...)
      if (c.startsWith('rgba(')) {
        return c.replace(/rgba\(([^)]+)\)/, (_m, body) => {
          const parts = body.split(',').map((s) => s.trim())
          // 取前三个
          return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${a})`
        })
      }
  
      // rgb(...)
      if (c.startsWith('rgb(')) {
        const body = c.slice(4, -1)
        const parts = body.split(',').map((s) => s.trim())
        return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${a})`
      }
  
      // #RGB / #RRGGBB
      if (c.startsWith('#') && (c.length === 4 || c.length === 7)) {
        const hex =
          c.length === 4 ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}` : c
        const r = parseInt(hex.slice(1, 3), 16)
        const g = parseInt(hex.slice(3, 5), 16)
        const b = parseInt(hex.slice(5, 7), 16)
        return `rgba(${r}, ${g}, ${b}, ${a})`
      }
  
      // 兜底：不解析（比如 'red'），只能原样返回
      return c
    }
  
    const fillSoftCircle = (x: number, y: number, r: number, color: string, alpha: number, softEdge: number) => {
      // softEdge 越大，透明过渡区越宽
      const mid = Math.max(0, 1 - softEdge)
  
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      // 关键：中间一直是“填充态”，边缘再渐隐 -> 视觉连续无留白
      g.addColorStop(0, withAlpha(color, alpha * 0.95))
      g.addColorStop(mid, withAlpha(color, alpha))
      g.addColorStop(1, withAlpha(color, 0))
  
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    // ----------------------------------------------------
  
    const draw = (now: number) => {
      const {
        ringCount,
        periodMs,
        dotRadius,
        dotColor,
        minRingRadius,
        maxRingRadius,
        ringColor,
        ringColors,
        fadePow,
        composite,
        softEdge,
      } = get()
  
      const t = now - startTs
      clear()
  
      ctx.save()
      ctx.globalCompositeOperation = composite
  
      // 多层“实心扩散”：每层错开相位（i / ringCount）
      for (let i = 0; i < ringCount; i++) {
        const phase = i / ringCount
        const p = ((t / periodMs) + phase) % 1 // 0~1
        const ep = easeOutCubic(p)
  
        const r = minRingRadius + (maxRingRadius - minRingRadius) * ep
        const alpha = Math.pow(1 - p, fadePow)
  
        const c = ringColors?.[i % ringColors.length] ?? ringColor
        fillSoftCircle(opt.x, opt.y, r, c, alpha, softEdge)
      }
  
      // 中心点（保持常亮）
      ctx.globalAlpha = 1
      ctx.fillStyle = dotColor
      ctx.beginPath()
      ctx.arc(opt.x, opt.y, dotRadius, 0, Math.PI * 2)
      ctx.fill()
  
      ctx.restore()
    }
  
    const loop = (now: number) => {
      if (!running) return
      draw(now)
      raf = requestAnimationFrame(loop)
    }
  
    const start = () => {
      if (running) return
      running = true
      startTs = performance.now()
      raf = requestAnimationFrame(loop)
    }
  
    const stop = () => {
      running = false
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }
  
    const setCenter = (x: number, y: number) => {
      opt.x = x
      opt.y = y
    }
  
    // 初始化一次
    resize(opt.width, opt.height)
  
    return { start, stop, resize, setCenter, drawOnce: () => draw(performance.now()) }
  }
  
  // ---------- utils ----------
  function clamp01(v: number) {
    if (v < 0) return 0
    if (v > 1) return 1
    return v
  }