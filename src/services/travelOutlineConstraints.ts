import type { DestinationIntent, GuideOutline, OutlineDayPlan, RoutePlanningParams } from '@/types/travelTypes'
import { parseDistanceKm, MAX_REASONABLE_DAILY_KM } from '@/services/travelHighwayToll'

/** 广西主要城市（过夜禁区检测用） */
const GUANGXI_CITY_RE = /南宁|柳州|桂林|梧州|北海|防城港|钦州|贵港|玉林|百色|贺州|河池|来宾|崇左|广西/

function userNotes(params: RoutePlanningParams): string {
  return [
    params.destinationIntent.extraNote,
    params.outlineRevisionNote,
    params.accommodationPreference?.note,
  ].filter(Boolean).join('\n')
}

/** 用户是否明确要求不在广西境内过夜/停留 */
export function wantsAvoidGuangxiOvernight(params: RoutePlanningParams): boolean {
  const notes = userNotes(params)
  return /不(?:要|得|许|能)?(?:在)?广西|避免(?:在)?广西|禁止(?:在)?广西|勿(?:在)?广西|广西境内(?:不|勿|禁止)|不(?:要|得)?(?:在)?百色|避免百色|不要停(?:留)?百色/.test(notes)
}

export function returnHomeLabel(params: RoutePlanningParams): string {
  const di = params.destinationIntent
  return (di.returnTo || params.departurePoints[0]?.address || '出发地').trim() || '出发地'
}

/**
 * 写入提示词的硬性约束：返程拆天、禁止示意末日程、广西过夜等
 */
export function buildHardTravelConstraints(params: RoutePlanningParams): string {
  const lines: string[] = []
  const di = params.destinationIntent
  const notes = userNotes(params)
  const home = returnHomeLabel(params)
  const days = params.travelDays

  if (di.returnTripNeeded) {
    lines.push(
      `需要返程到「${home}」：必须在 ${days} 天内把去程+目的地停留+真实返程全部排完。`,
      `返程按约 600–700km/天拆多天（例：返程约 2500km ≈ 4–5 天）；严禁把整段返程塞进最后 1 天。`,
      `禁止任何「示意返程 / 仅作大纲 / 实际需多天 / 0公里 / 休整结束旅程」的占位天；每一天都必须有真实 from→to 与大致公里数。`,
      `若总天数偏紧：优先压缩去程途中停留天数，保证返程也能按天落地；并在 dailyArrangementNote 写明「天数偏紧，去程已压缩」。`,
      `最后一天应是返程最后一程开回家（overnightType=home，过夜写回家/出发地），不得写成同城休整天（如 南宁→南宁 0km）。`,
    )
  }

  if (wantsAvoidGuangxiOvernight(params)) {
    lines.push(
      `【过夜禁区】严禁在广西境内过夜（含百色、柳州、桂林、河池、崇左等全部广西城市）。`,
      `可途经广西加油/吃饭短暂停留，但 overnight 不得写广西城市；倒数第二晚应住在贵州/云南等省外城市，最后一天再直接开回「${home}」。`,
      `禁止为了「顺路」安排百色过夜。`,
    )
  }

  if (notes.trim()) {
    lines.push(`用户补充说明必须逐条遵守：${notes.trim()}`)
  }

  if (!lines.length) return ''
  return `【硬性行程约束】\n${lines.map((l, i) => `${i + 1}. ${l}`).join('\n')}`
}

function isPlaceholderReturnDay(d: OutlineDayPlan): boolean {
  const blob = `${d.distance || ''} ${d.driveTime || ''} ${d.note || ''} ${d.from} ${d.to}`
  if (/示意|仅作大纲|实际返程需多天|占位/.test(blob)) return true
  const km = parseDistanceKm(d.distance)
  if (km <= 0 && /返程|回|结束旅程|休整/.test(blob)) return true
  if (km <= 0 && d.from && d.to && d.from.replace(/市/g, '') === d.to.replace(/市/g, '')) return true
  return false
}

function overnightInGuangxi(overnight: string, day: number, travelDays: number, home: string): boolean {
  if (!overnight) return false
  // 最后一天回家到南宁允许
  if (day === travelDays && (overnight.includes('回家') || overnight.includes(home) || /南宁/.test(overnight))) {
    return false
  }
  return GUANGXI_CITY_RE.test(overnight)
}

/** 大纲质量检查，供预览面板提示用户修改 */
export function analyzeOutlineWarnings(
  outline: GuideOutline,
  params: RoutePlanningParams,
): string[] {
  const days = outline.dailyOutlines || []
  if (!days.length) return ['缺少按天大纲 dailyOutlines，建议重新生成']

  const warnings: string[] = []
  const home = returnHomeLabel(params)
  const avoidGx = wantsAvoidGuangxiOvernight(params)
  const di = params.destinationIntent

  for (const d of days) {
    const km = parseDistanceKm(d.distance)
    if (km > MAX_REASONABLE_DAILY_KM) {
      warnings.push(`第 ${d.day} 天约 ${km}km，超过建议上限，必须再拆天`)
    }
    if (isPlaceholderReturnDay(d)) {
      warnings.push(`第 ${d.day} 天疑似返程占位（0km/示意/休整），请重生成并实拆返程`)
    }
    if (avoidGx && overnightInGuangxi(d.overnight, d.day, params.travelDays, home)) {
      warnings.push(`第 ${d.day} 天过夜「${d.overnight}」在广西境内，与「不在广西停留」冲突`)
    }
  }

  if (di.returnTripNeeded) {
    const last = days[days.length - 1]
    if (last) {
      const homeKey = home.replace(/市|区|县/g, '').slice(0, 2)
      const arrivesHome = [last.to, last.overnight].some((x) =>
        x && (x.includes('回家') || (homeKey && x.includes(homeKey)) || /南宁/.test(x)),
      )
      if (!arrivesHome && !isPlaceholderReturnDay(last)) {
        warnings.push(`最后一天未明确回到「${home}」，请检查返程是否排完`)
      }
    }

    // 粗检：后半程若几乎没有里程，说明返程被吃掉
    const half = Math.ceil(days.length / 2)
    const backKm = days.slice(half).reduce((s, d) => s + parseDistanceKm(d.distance), 0)
    const frontKm = days.slice(0, half).reduce((s, d) => s + parseDistanceKm(d.distance), 0)
    if (frontKm > 1500 && backKm < 800 && days.length >= 10) {
      warnings.push(`去程里程明显多于返程（后半程仅约 ${backKm}km），返程天数可能不够，建议压缩去程或增加天数`)
    }
  }

  return warnings
}

export function formatOutlineDayHint(d: OutlineDayPlan): string {
  return `第${d.day}天 ${d.from}→${d.to} ${d.distance || ''} ${d.driveTime || ''} 景点:${(d.attractions || []).join('、') || '—'} 过夜:${d.overnight || '—'}${d.note ? ` 备注:${d.note}` : ''}`
}

export function buildReturnDayBudgetHint(params: RoutePlanningParams): string {
  const di: DestinationIntent = params.destinationIntent
  if (!di.returnTripNeeded) return ''
  const dest = di.destinationText || '目的地'
  return `天数分配建议：先保证「${dest}」可达与返程可完成，再分配途中游玩；长途环线（如南宁↔拉萨）15 天通常去程约 7–8 天、目的地 1 天、返程约 4–6 天，不要去程吃满导致返程崩盘。`
}
