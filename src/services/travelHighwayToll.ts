import type {
  BudgetItem,
  DetailedBudget,
  DetailedDailyPlan,
  HighwayTollSegment,
  OutlineDayPlan,
  RoutePlanningParams,
} from '@/types/travelTypes'

/** 城际高速费粗估：约 0.5 元/km（高速段约占里程 70%） */
const HIGHWAY_RATIO = 0.7
const TOLL_YUAN_PER_KM = 0.5
/** 单日驾车建议上限，超过则提示拆天 */
export const MAX_REASONABLE_DAILY_KM = 800
/** 不同城市之间若解析出过小里程，视为误把「小时」等数字当成公里 */
const MIN_INTERCITY_KM = 40

export function parseDistanceKm(text?: string): number {
  if (!text) return 0
  const raw = String(text).replace(/,/g, '').replace(/，/g, ',')

  // 1) 优先：带明确里程单位的数字（避免把「约3小时」里的 3 当成公里）
  const withUnit = [...raw.matchAll(/(\d+(?:\.\d+)?)\s*(?:km|公里|千米)/gi)]
    .map((m) => Number(m[1]))
    .filter((n) => Number.isFinite(n) && n > 0)
  if (withUnit.length) {
    // 同一段文案里可能同时出现「3小时」「150公里」，取带单位的最大值更合理
    return Math.round(Math.max(...withUnit))
  }

  // 2) 排除时长类数字后再找「约 150」这类裸数字（且不能紧跟小时/分钟）
  const bare = [...raw.matchAll(/(\d+(?:\.\d+)?)\s*(?!小时|时|h\b|分钟|分|min)/gi)]
    .map((m) => Number(m[1]))
    .filter((n) => Number.isFinite(n) && n >= 10 && n <= 5000)
  if (bare.length) {
    // 文案极短且几乎只有数字时才用；否则宁可不估，避免乱抓「第1天/2人」
    const compact = raw.replace(/\s+/g, '')
    if (compact.length <= 12 || /^(约)?\d+(\.\d+)?(左右)?$/.test(compact)) {
      return Math.round(bare[0])
    }
  }

  return 0
}

/** 从多个候选文案中解析最可信的里程 */
export function pickDistanceKm(candidates: Array<string | undefined | null>): number {
  const scored: number[] = []
  for (const c of candidates) {
    if (!c) continue
    const km = parseDistanceKm(c)
    if (km > 0) scored.push(km)
  }
  if (!scored.length) return 0
  // 优先较大的合理城际里程（误解析常是 1~5）
  const plausible = scored.filter((n) => n >= MIN_INTERCITY_KM && n <= MAX_REASONABLE_DAILY_KM)
  if (plausible.length) return Math.max(...plausible)
  return Math.max(...scored)
}

export function estimateTollYuan(distanceKm: number): number {
  if (distanceKm <= 0) return 0
  return Math.round(distanceKm * HIGHWAY_RATIO * TOLL_YUAN_PER_KM)
}

function isLikelySameCity(from: string, to: string): boolean {
  const a = (from || '').replace(/市|区|县/g, '').trim()
  const b = (to || '').replace(/市|区|县/g, '').trim()
  if (!a || !b) return true
  return a === b || a.includes(b) || b.includes(a)
}

function segmentFromDay(day: number, from: string, to: string, distanceText?: string, extraTexts: string[] = []): HighwayTollSegment | null {
  const distanceKm = pickDistanceKm([distanceText, ...extraTexts])
  if (!from && !to && distanceKm <= 0) return null

  // 不同城市却只有个位数/极小里程：几乎肯定是误解析，丢弃该段以免「3km≈¥1」误导
  if (!isLikelySameCity(from, to) && distanceKm > 0 && distanceKm < MIN_INTERCITY_KM) {
    return null
  }
  if (distanceKm <= 0) return null

  const tollYuan = estimateTollYuan(distanceKm)
  const note = distanceKm > MAX_REASONABLE_DAILY_KM
    ? `单日约 ${distanceKm}km，建议拆成两天（超过 ${MAX_REASONABLE_DAILY_KM}km 不合理）`
    : undefined
  return {
    day,
    from: from || '—',
    to: to || '—',
    distanceKm,
    tollYuan,
    source: 'estimate',
    note,
  }
}

/** 从详细每日行程提取高速费段 */
export function estimateHighwayTollsFromDailyPlans(dailyPlans: DetailedDailyPlan[]): HighwayTollSegment[] {
  return dailyPlans
    .map((d) => segmentFromDay(
      d.day,
      d.startCity,
      d.endCity,
      d.transportSummary?.totalDistance,
      [
        d.transportSummary?.routeDescription,
        d.daySummary,
        ...(d.tips || []),
      ].filter(Boolean) as string[],
    ))
    .filter((s): s is HighwayTollSegment => !!s && s.distanceKm > 0)
}

/** 从大纲按天骨架提取高速费段 */
export function estimateHighwayTollsFromOutline(days: OutlineDayPlan[]): HighwayTollSegment[] {
  return days
    .map((d) => segmentFromDay(d.day, d.from, d.to, d.distance, [d.note].filter(Boolean) as string[]))
    .filter((s): s is HighwayTollSegment => !!s && s.distanceKm > 0)
}

export function formatTollAmount(yuan: number): string {
  if (yuan <= 0) return '约 0 元（以实际为准）'
  const low = Math.round(yuan * 0.85)
  const high = Math.round(yuan * 1.2)
  return `约 ${low}-${high} 元（以实际为准）`
}

export function sumTollYuan(segments: HighwayTollSegment[]): number {
  return segments.reduce((s, x) => s + x.tollYuan, 0)
}

/** 把高速费并入总预算：替换已有 highway 项，或追加 */
export function mergeHighwayIntoBudget(
  budget: DetailedBudget,
  segments: HighwayTollSegment[],
  params?: RoutePlanningParams,
): DetailedBudget {
  const hasSelfDrive = (params?.departurePoints || []).some((d) => d.transportType === 'selfDriving')
  if (!hasSelfDrive || !segments.length) return budget

  const total = sumTollYuan(segments)
  const highwayItem: BudgetItem = {
    category: 'highway',
    name: '全程高速费预估',
    amount: formatTollAmount(total),
    description: segments
      .map((s) => `D${s.day} ${s.from}→${s.to} ${s.distanceKm}km ≈¥${s.tollYuan}${s.note ? `（${s.note}）` : ''}`)
      .join('；'),
  }

  const items = (budget.items || []).filter((i) => i.category !== 'highway')
  items.push(highwayItem)

  const notes = [...(budget.notes || [])]
  const tip = '高速费按里程粗估（约 0.5 元/km×高速占比），以高德路径规划/ETC 实际为准。'
  if (!notes.some((n) => n.includes('高速费'))) notes.push(tip)

  return { ...budget, items, notes }
}

/** 可选：若配置了 VITE_AMAP_KEY，尝试用高德驾车路径拿 tolls（失败则回退估算） */
export async function fetchAmapDrivingToll(
  origin: string,
  destination: string,
): Promise<{ distanceKm: number; tollYuan: number } | null> {
  const key = String(import.meta.env.VITE_AMAP_KEY || '').trim()
  if (!key || !origin || !destination) return null
  try {
    const url = `https://restapi.amap.com/v3/direction/driving?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&extensions=all&key=${encodeURIComponent(key)}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json() as {
      status?: string
      route?: { paths?: Array<{ distance?: string; tolls?: string }> }
    }
    if (data.status !== '1') return null
    const path = data.route?.paths?.[0]
    if (!path) return null
    const distanceKm = Math.round(Number(path.distance || 0) / 1000)
    const tollYuan = Math.round(Number(path.tolls || 0))
    if (!distanceKm) return null
    return { distanceKm, tollYuan: tollYuan || estimateTollYuan(distanceKm) }
  } catch {
    return null
  }
}
