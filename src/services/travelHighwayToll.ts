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

export function parseDistanceKm(text?: string): number {
  if (!text) return 0
  const m = String(text).replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*(?:km|公里|千米)?/i)
  if (!m) return 0
  const n = Number(m[1])
  return Number.isFinite(n) ? n : 0
}

export function estimateTollYuan(distanceKm: number): number {
  if (distanceKm <= 0) return 0
  return Math.round(distanceKm * HIGHWAY_RATIO * TOLL_YUAN_PER_KM)
}

function segmentFromDay(day: number, from: string, to: string, distanceText?: string): HighwayTollSegment | null {
  const distanceKm = parseDistanceKm(distanceText)
  if (!from && !to && distanceKm <= 0) return null
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
      d.transportSummary?.totalDistance || d.transportSummary?.routeDescription || d.daySummary,
    ))
    .filter((s): s is HighwayTollSegment => !!s && s.distanceKm > 0)
}

/** 从大纲按天骨架提取高速费段 */
export function estimateHighwayTollsFromOutline(days: OutlineDayPlan[]): HighwayTollSegment[] {
  return days
    .map((d) => segmentFromDay(d.day, d.from, d.to, d.distance))
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
