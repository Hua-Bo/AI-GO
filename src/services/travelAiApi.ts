import { AiJsonParseError, callAiChatJson } from '@/services/travelAiChat'
import { getScenicImage, buildScenicImageKeyword, batchGetScenicImages } from '@/services/travelImageApi'
import { estimateHighwayTollsFromDailyPlans, mergeHighwayIntoBudget } from '@/services/travelHighwayToll'
import {
  buildHardTravelConstraints,
  buildReturnDayBudgetHint,
  formatOutlineDayHint,
} from '@/services/travelOutlineConstraints'
import type {
  AiModelConfig,
  DetailedBudget,
  DetailedDailyPlan,
  DetailedMeetingPlan,
  DetailedScenicSpot,
  DetailedTravelGuide,
  GuideOutline,
  GuideTipsResult,
  OutlineDayPlan,
  PlanGenerationState,
  PlanStep,
  RoutePlanningParams,
  StartPlan,
} from '@/types/travelTypes'
import { needMeetingPlan } from '@/types/travelTypes'
import {
  composeDetailedGuide,
  normalizeBudget,
  normalizeDailyPlan,
  normalizeGuideOutline,
  normalizeGuideTips,
  normalizeMeetingPlan,
  normalizeStartPlan,
  enrichStartPlan,
  attachWeatherAndRemindersToDailyPlan,
} from '@/utils/travelNormalize'
import { isBadWeather } from '@/services/travelWeatherCore'

export class PlanStepError extends Error {
  step: PlanStep
  day?: number
  rawResponse?: string

  constructor(message: string, step: PlanStep, day?: number, rawResponse?: string) {
    super(message)
    this.name = 'PlanStepError'
    this.step = step
    this.day = day
    this.rawResponse = rawResponse
  }
}

export interface PlanRouteOptions {
  onProgress?: (step: string) => void
  onStateUpdate?: (state: PlanGenerationState) => void
  signal?: AbortSignal
  existing?: Partial<PlanGenerationState>
  fromStep?: PlanStep
  retryDay?: number
  /** 生成到该步骤后停止（含该步）。如 'outline' 只生成大纲 */
  stopAfterStep?: PlanStep
}

const BASE_SYSTEM = `你是专业旅游路线规划师，擅长撰写真实、可执行的图文攻略。只输出严格 JSON，不要 Markdown，不要解释。
所有数组字段必须返回数组。景区必须提供 imageKeyword（格式：省份 + 城市 + 景区名），不要返回真实图片 URL。
禁止使用"周边景点""当地美食""自由活动"等笼统词代替真实地点。不要虚构景区，不要把城市名当成景区名。`

function buildOutdoorPrefs(params: RoutePlanningParams): string {
  const items = [
    params.preferFreeSpots && '免费景区',
    params.preferParks && '公园',
    params.preferCamping && '露营',
    params.preferLakeside && '湖边',
    params.preferForest && '森林',
    params.preferCityWalk && '城市散步',
    params.preferLowCost && '低成本',
    params.avoidTicketsExpensive && '避开高门票',
    params.preferDriveToSpot && '车能开到附近',
    params.preferRiverside && '河边玩水',
    params.preferWaterPlay && '湖边/溪流',
    params.preferWildSpot && '小众野点',
    params.preferEasyParking && '停车方便',
  ].filter(Boolean)
  return items.length ? items.join('、') : '无'
}

function buildDrivePrefs(params: RoutePlanningParams): string {
  const rules = [
    params.preferDriveToSpot && '优先可开车到景点附近（步行0-500米）',
    params.preferEasyParking && '优先停车方便点位',
    params.preferRiverside && '优先河边可玩水点位',
    params.preferWaterPlay && '优先湖边/溪流点位',
    params.preferWildSpot && '可包含小众野点，但需标注安全与停车需现场确认',
  ].filter(Boolean)
  return rules.length ? rules.join('；') : '无'
}

function buildAccommodationPrefs(params: RoutePlanningParams): string {
  const p = params.accommodationPreference
  const home = p.homeBaseAddress || params.departurePoints[0]?.address || ''
  const text = `${home} ${params.destinationIntent.destinationText || ''} ${p.note || ''}`
  const localKeywords = ['周边', '附近', '本地', '滨湖', '太湖', '蠡湖', '长广溪', '鼋头渚', '雪浪山', '惠山', '宜兴']
  const shouldNoHotel = p.mode === 'auto' && params.departurePoints.length === 1
    && (localKeywords.some((k) => text.includes(k)) || (text.includes('无锡') && params.destinationIntent.destinationText.includes('无锡')))
  const mode = shouldNoHotel ? 'noHotelPreferred' : p.mode
  const maxKm = p.maxReturnDistanceKm || 80
  const hotelDays = (p.hotelDays || []).filter((d) => d >= 1 && d <= params.travelDays)
  const hotelDayText = hotelDays.length
    ? `指定住酒店天数：第${hotelDays.join('、')}天；原因：${p.hotelDayReason || '洗衣洗烘/补给'}`
    : '指定住酒店天数：无'

  const campingRules = mode === 'campingOrCar'
    ? [
      '6) 默认车宿/露营：hotelSuggestion 使用 needed=false,type=car 或 camping，写明安全停车/营地建议，酒店预算记0。',
      '7) 若用户指定了某天住酒店，该天必须 needed=true,type=hotel，并写洗衣洗烘/洗澡补给等理由；其余天继续车宿/露营。',
    ]
    : []

  return [
    `住宿模式：${mode}`,
    `常住地/回家地址：${home || '未填写'}`,
    `可接受单程回家距离：${maxKm}km`,
    `可接受单程回家时长：${p.maxReturnDuration || '1.5小时'}`,
    `补充说明：${p.note || '无'}`,
    hotelDayText,
    '住宿硬性规则：',
    '1) 若当天最后一个景点距离常住地/出发地小于 50 公里，不要推荐酒店，文案写“建议当天返回家中休息”。',
    '2) 本地游、近郊游默认当天返回家中休息，不要在用户居住区附近推荐酒店。',
    '3) 用户住在无锡滨湖区时，不要推荐滨湖区或无锡市区酒店，除非用户明确选择“想住一晚/需要酒店”或指定了住酒店天数。',
    '4) 只有跨市较远、返程超过 100 公里、或用户主动选择需要住宿时，才推荐酒店。',
    '5) 多出发地场景下，只给距离较远、当天无法合理回家的人推荐住宿。',
    ...campingRules,
  ].join('；')
}

function buildCustomEventsPrefs(params: RoutePlanningParams): string {
  const events = (params.customDailyEvents || []).filter((e) => e.enabled && e.title.trim())
  if (!events.length) return '无'
  const freqLabel: Record<string, string> = {
    daily: '每天必须安排',
    everyOtherDay: '最多间隔1天安排一次',
    hotelLaundryDays: '仅在指定住酒店那天安排',
    once: '行程中至少安排一次',
  }
  return events.map((e, i) => {
    const parts = [
      `${i + 1}. ${e.title}`,
      `频率：${freqLabel[e.frequency] || e.frequency}`,
      e.description ? `要求：${e.description}` : '',
      e.searchHint ? `搜索线索：${e.searchHint}` : '',
    ].filter(Boolean)
    return parts.join('，')
  }).join('\n')
}

function buildPlanModeConstraint(planMode?: RoutePlanningParams['planMode']): string {
  if (planMode === 'detailed') {
    return `【生成模式：详细版】
- 每天按完整时间线展开
- 包含交通方式、餐饮建议、预算估算、避坑提醒
- 包含每个景点的推荐理由与游玩时长
- 如有恶劣天气，必须写 badWeatherAlternative 字段说明室内备选路线`
  }
  return `【生成模式：精简版】
- 每天只保留核心安排，timeline 最多 3-4 个主要节点
- 不写冗长背景介绍，description 保持简短
- 重点展示时间、地点、交通、注意事项
- tips 每天 2-3 条即可`
}

function buildWeatherContextForDay(params: RoutePlanningParams, day: number): string {
  const weather = params.weatherList?.[day - 1]
  if (!weather) return '【当日天气】暂无预报数据，请按季节合理安排室内外活动。'
  const bad = isBadWeather(weather)
  return `【当日天气】${weather.date} ${weather.city}
天气：${weather.weather}，${weather.tempMin}-${weather.tempMax}℃${weather.wind ? `，${weather.wind}` : ''}${weather.precipitationProbability != null ? `，降雨概率 ${weather.precipitationProbability}%` : ''}
出行建议：${weather.travelAdvice}
${bad ? `⚠️ 恶劣天气：禁止安排爬山、露营、漂流、海边长时间游玩等高风险户外活动；优先博物馆、美术馆、商场、室内展馆；必须说明调整原因并填写 badWeatherAlternative。` : '天气适宜时可安排户外景点，但仍需兼顾防晒/保暖/雨具提醒。'}`
}

function buildWeatherListContext(params: RoutePlanningParams): string {
  if (!params.weatherList?.length) return ''
  return `【全程天气预报】
${params.weatherList.map((w, i) => `第${i + 1}天 ${w.date}：${w.weather} ${w.tempMin}-${w.tempMax}℃ · ${w.travelAdvice}`).join('\n')}`
}

function buildPaceConstraint(pace: RoutePlanningParams['pace']): string {
  if (pace === 'relaxed') return '每天不超过2-3个主要地点'
  if (pace === 'compact') return '可安排更多点位，说明疲劳风险'
  return '每天2-4个地点'
}

function checkAbort(signal?: AbortSignal) {
  if (signal?.aborted) throw new Error('已停止生成')
}

function throwStepError(e: unknown, step: PlanStep, day?: number): never {
  if (e instanceof AiJsonParseError) {
    throw new PlanStepError(e.message, step, day, e.rawText)
  }
  if (e instanceof PlanStepError) throw e
  if (e instanceof Error && e.message === '已停止生成') throw e
  throw new PlanStepError(e instanceof Error ? e.message : '生成失败', step, day)
}

function transportLabel(t: string, car?: string) {
  const map: Record<string, string> = { selfDriving: '自驾', train: '高铁', flight: '飞机', bus: '大巴' }
  let s = map[t] || t
  if (t === 'selfDriving') s += car === 'electric' ? '（电车）' : car === 'fuel' ? '（油车）' : ''
  return s
}

const DEST_TYPE_LABEL: Record<string, string> = {
  city: '城市', region: '区域方向', scenic: '景区', direction: '大致方向',
}

function buildParamsContext(params: RoutePlanningParams): string {
  const deps = params.departurePoints.map((d, i) => {
    const parts = [
      `id=${d.id}`,
      d.address,
      transportLabel(d.transportType, d.carType),
      `${d.peopleCount}人`,
    ]
    if (d.departureStation) parts.push(`出发站：${d.departureStation}`)
    if (d.departureAirport) parts.push(`出发机场：${d.departureAirport}`)
    if (d.startTime) parts.push(`出发时间：${d.startTime}`)
    if (d.remark) parts.push(`备注：${d.remark}`)
    return `${i + 1}. ${parts.join('，')}`
  }).join('\n')

  const di = params.destinationIntent
  const prefs = [
    params.withChildren && '带孩子',
    params.withElderly && '带老人',
    params.avoidCrowded && '避开拥挤',
    params.preferNaturalScenery && '自然风光',
    params.preferFood && '美食优先',
    params.preferPhotoSpot && '摄影出片',
  ].filter(Boolean).join('、') || '无'

  const budget = params.budgetLevel === 'low' ? '经济实惠' : params.budgetLevel === 'high' ? '品质轻奢' : '标准舒适'
  const pace = params.pace === 'relaxed' ? '轻松慢游' : params.pace === 'compact' ? '特种兵' : '正常安排'
  const multiDep = needMeetingPlan(params.departurePoints)

  return `【出发地数量】${params.departurePoints.length} 个${multiDep ? '（需推荐集合点）' : '（单出发地，不要生成集合点，只生成出发方案）'}

【出发地】
${deps}

【目标终点】
${di.destinationText}（${DEST_TYPE_LABEL[di.destinationType] || di.destinationType}）
必须到达：${di.mustArrive ? '是' : '否'}
需要返程：${di.returnTripNeeded ? '是' : '否'}${di.returnTo ? `，返程至 ${di.returnTo}` : ''}
补充：${di.extraNote || '无'}

【游玩天数】${params.travelDays} 天
【出发日期】${params.startDate || '未指定'}
${buildPlanModeConstraint(params.planMode)}
${buildWeatherListContext(params)}
【预算】${budget}
【节奏】${pace}（${buildPaceConstraint(params.pace)}）
【主题】${params.travelThemes.join('、')}
【同行偏好】${prefs}
【户外/免费偏好】${buildOutdoorPrefs(params)}
【车辆可达偏好】${buildDrivePrefs(params)}
【少走路范围】${params.maxWalkDistance || '0-500米'}
【特殊点位线索】${params.specialPlaceHint || '无'}
【自定义每日事件（必须写入 timeline）】
${buildCustomEventsPrefs(params)}
【住宿偏好】${buildAccommodationPrefs(params)}
${buildHardTravelConstraints(params)}`
}

async function callStep<T>(params: {
  config: AiModelConfig
  systemPrompt: string
  userPrompt: string
  maxTokens?: number
  expectedSchemaHint: string
  signal?: AbortSignal
}): Promise<T> {
  return callAiChatJson<T>({
    config: params.config,
    systemPrompt: params.systemPrompt,
    userPrompt: params.userPrompt,
    maxTokens: params.maxTokens,
    temperature: 0.2,
    retry: 2,
    repairOnFail: true,
    expectedSchemaHint: params.expectedSchemaHint,
    signal: params.signal,
  })
}

function isInvalidTimelineItem(item: DetailedDailyPlan['timeline'][number]): boolean {
  const title = item.title || ''
  const desc = item.description || ''
  return !title
    || /^行程\s*\d+$/i.test(title)
    || title.includes('行程')
    || (title.includes('自由活动') && !desc)
    || !desc
}

function hasValidTimeline(plan: DetailedDailyPlan, minItems = 4): boolean {
  return Array.isArray(plan.timeline)
    && plan.timeline.length >= minItems
    && plan.timeline.every((item) => !isInvalidTimelineItem(item))
}

function buildFallbackTimeline(plan: DetailedDailyPlan): DetailedDailyPlan['timeline'] {
  const spots = plan.scenicSpots.slice(0, 4)
  const slots = ['09:00', '12:00', '14:30', '18:30']
  if (!spots.length) {
    return [
      { time: '09:00', type: 'transport', title: `${plan.startCity} 出发`, description: '按路线前往首个目的地，注意路况。' },
      { time: '12:00', type: 'food', title: `${plan.endCity || plan.overnightCity} 午餐`, description: '建议在当地主城区或景区周边用餐。' },
      { time: '14:30', type: 'scenic', title: `${plan.endCity || plan.overnightCity} 城市漫游`, description: '选择开放式步道或公园进行轻松游览。' },
      { time: '18:30', type: 'hotel', title: `${plan.overnightCity} 入住`, description: '办理入住并整理第二天行程。' },
    ]
  }
  return slots.map((time, idx) => {
    const s = spots[idx] || spots[spots.length - 1]
    return {
      time,
      type: idx === 1 ? 'food' : 'scenic',
      title: idx === 1 ? `${s.city} 午餐补给` : s.name,
      city: s.city,
      location: s.address || s.city,
      description: idx === 1
        ? `在${s.city}补给休息，随后继续前往 ${s.name}。`
        : `游玩 ${s.name}，建议停留${s.suggestedDuration || '1-2小时'}。`,
      duration: s.suggestedDuration || undefined,
      cost: s.isFree ? '免费（停车/补给以实际为准）' : s.ticketPrice,
      transportDetail: s.parkingInfo || '',
      tips: s.avoidPitfalls?.slice(0, 2) || [],
    }
  })
}

export async function generateGuideOutlineByAi(
  params: RoutePlanningParams,
  config: AiModelConfig,
  signal?: AbortSignal,
): Promise<GuideOutline> {
  const revision = params.outlineRevisionNote?.trim()
  const raw = await callStep<Partial<GuideOutline>>({
    config,
    systemPrompt: `${BASE_SYSTEM} 你现在只需要生成 GuideOutline JSON（含按天大纲 dailyOutlines），不要返回每日细行程 timeline、集合点详情或预算。`,
    userPrompt: `请生成路线大纲 GuideOutline JSON，供用户确认后再写细行程。

${buildParamsContext(params)}
${revision ? `\n【用户修改意见（必须遵守）】\n${revision}\n` : ''}

硬性约束（非常重要）：
1. 必须返回 dailyOutlines 数组，长度 = travelDays，每天一条。
2. 每天字段：day, from, to, distance（如「530km」）, driveTime（如「约6小时」）, attractions[]（真实景点名）, overnight（过夜城市或「车宿」）, overnightType（car|hotel|home|camping）, note。
3. 单日自驾里程一般 ≤ 600–700km，极限不超过 800km；严禁出现一天开 1000km+/1400km 的安排，返程必须拆成多天。
4. 环线/长途必须把去程与返程都合理拆天，不要把返程硬塞进最后一天；禁止「返程示意 / 0公里 / 休整结束」占位天。
5. ${buildReturnDayBudgetHint(params) || '合理分配去程与游玩天数。'}
6. routeSummary 用连贯段落概括全程（可按天简述），类似「总路线说明」。
7. 另给：accommodationStrategy、foodHighlights[]、photoHighlights[]、dailyArrangementNote、routeHighlights[]、coreCities[]。

字段：title, subtitle, summary, destination, routeName, routeType(direct|loop|oneWay|multiCity), coreCities[], totalPeople, travelDays, routeSummary, routeHighlights[], dailyOutlines[], accommodationStrategy, foodHighlights[], photoHighlights[], dailyArrangementNote`,
    maxTokens: 4096,
    expectedSchemaHint: 'GuideOutline 对象，必须含 dailyOutlines[] 与 routeSummary',
    signal,
  })
  return normalizeGuideOutline(raw, params)
}

export async function generateStartPlanByAi(
  params: RoutePlanningParams,
  outline: GuideOutline,
  config: AiModelConfig,
  signal?: AbortSignal,
): Promise<StartPlan> {
  const dep = params.departurePoints[0]
  const raw = await callStep<Partial<StartPlan>>({
    config,
    systemPrompt: `${BASE_SYSTEM} 只有一个出发地，不要生成集合点。只生成 StartPlan JSON。`,
    userPrompt: `请生成单出发地出发方案 StartPlan JSON。

${buildParamsContext(params)}

【路线总览】${outline.routeSummary}
【交通方式】${transportLabel(dep.transportType, dep.carType)}

必须包含且字段不要为空：fromAddress（出发地址）, firstStopCity（第一站城市或景区名，必填字符串）, suggestedStartTime（如「08:30」必填）, routeDescription（必填）, duration, distance, costEstimate, transportTips[]。
不要把 firstStopCity / suggestedStartTime 写成对象，必须是字符串。
电车写 chargingTips[]，油车写 fuelHighwayTips[]，高铁/飞机写 stationTransferTips[]。`,
    maxTokens: 4096,
    expectedSchemaHint: 'StartPlan 对象',
    signal,
  })
  return normalizeStartPlan(raw, dep.address)
}

export async function generateMeetingPlanByAi(
  params: RoutePlanningParams,
  outline: GuideOutline,
  config: AiModelConfig,
  signal?: AbortSignal,
): Promise<DetailedMeetingPlan> {
  const raw = await callStep<Partial<DetailedMeetingPlan>>({
    config,
    systemPrompt: `${BASE_SYSTEM} 你现在只需要生成 DetailedMeetingPlan JSON，不要返回每日行程或预算。departureRoutes 中 departureId 必须与用户出发地 id 一致。`,
    userPrompt: `请生成集合点方案 DetailedMeetingPlan JSON。

${buildParamsContext(params)}

【路线总览】
目的地：${outline.destination}
路线：${outline.routeName}
核心城市：${outline.coreCities.join('、')}
概要：${outline.routeSummary}

必须包含：meetingCity, meetingPlaceName, meetingPlaceAddress, suggestedMeetingTime, reason, whyNotOtherCities[], nearbyFacilities[], departureRoutes[]（含 suggestedStartTime, estimatedArrivalTime, duration, distance, costDetail, routeSteps, chargingPlan, drivingTips）, meetingTips[]`,
    maxTokens: 6144,
    expectedSchemaHint: 'DetailedMeetingPlan 对象，含 meetingCity/meetingPlaceName/departureRoutes 等',
    signal,
  })
  return normalizeMeetingPlan(raw)
}

export async function generateDailyPlanByAi(
  params: RoutePlanningParams,
  day: number,
  context: {
    outline: GuideOutline
    outlineDay?: OutlineDayPlan
    startPlan?: StartPlan
    meetingPlan?: DetailedMeetingPlan
    previousDays: DetailedDailyPlan[]
  },
  config: AiModelConfig,
  signal?: AbortSignal,
): Promise<DetailedDailyPlan> {
  const prevSummary = context.previousDays.length
    ? context.previousDays.map((d) => `第${d.day}天：${d.startCity}→${d.endCity}，住${d.overnightCity}`).join('\n')
    : '（尚无）'

  const departCtx = context.startPlan
    ? `【出发方案】从 ${context.startPlan.fromAddress} 出发，第一站 ${context.startPlan.firstStopCity}，${context.startPlan.routeDescription}`
    : `【集合城市】${context.meetingPlan?.meetingCity}，${context.meetingPlan?.meetingPlaceName}`

  const daySkeleton = context.outlineDay
    ? formatOutlineDayHint(context.outlineDay)
    : (context.outline.dailyOutlines || []).find((d) => d.day === day)
      ? formatOutlineDayHint((context.outline.dailyOutlines || []).find((d) => d.day === day)!)
      : ''

  const makePrompt = (retryReason = '') => ({
    config,
    systemPrompt: `${BASE_SYSTEM} 你现在只需要生成第 ${day} 天的 DetailedDailyPlan JSON。不要返回其他天。
${buildPlanModeConstraint(params.planMode)}
每天至少给出2个真实地点（长途赶路日除外）。timeline 和 scenicSpots 必须写具体景区名，禁止笼统描述。
必须结合当日天气调整行程，恶劣天气不得安排高风险户外活动。
自驾单日里程一般不超过 700km，严禁一天安排 1000km 以上。若大纲中该天已给出 from/to/景点，请严格按大纲展开，不要擅自改路线骨架。
禁止写成 0 公里占位、示意返程、同城休整结束；必须给出真实里程与起终点。`,
    userPrompt: `请只生成第 ${day} 天（共 ${params.travelDays} 天）的 DetailedDailyPlan JSON。
${retryReason ? `\n${retryReason}\n` : ''}
${buildParamsContext(params)}
${buildWeatherContextForDay(params, day)}

【本天大纲骨架（必须严格按此 from/to/过夜展开）】
${daySkeleton || '（大纲未提供该天骨架，请按总览合理安排，仍须真实里程）'}

【路线总览】${context.outline.routeSummary}
${departCtx}
【已完成天数】
${prevSummary}

禁止输出：行程1/行程2/自由活动占位/周边景点/当地美食/视情况安排。
timeline 每项必须含：time、title、location、description、duration、cost、transportDetail、tips[]。
必须为 timeline 中每个时间节点生成 reminders[]（含 title、date、startTime、endTime、location、description）。
如果为自驾，必须写清楚停车点、是否可开到附近、步行距离、电车补能或油费高速说明。
住宿安排必须结合用户出发地和常住地判断。如果当天可合理回家，不要安排酒店。多日本地短途可每天“回家过夜”。
若不住酒店，hotelSuggestion 使用：needed=false,type=home,area=回家过夜,priceRange=0元。
若住宿模式为露营/车宿：默认 needed=false,type=car 或 camping；若当天属于用户指定住酒店天数，则必须 needed=true,type=hotel，并在 reason 中写明洗衣洗烘等原因。
自定义每日事件必须落到 timeline：例如“洗澡/健身房淋浴”，请在当天城市推荐具体可执行点位（如24小时健身房带淋浴、团购单次卡），写清时间与费用。
${params.planMode === 'simple' ? '精简版：timeline 控制在 3-4 个节点，description 简短，scenicSpots 最多 3 个；meals 至少 2 条（午/晚）。' : '详细版：timeline 完整展开，meals 与 dayBudget 必须填写，恶劣天气必须写 badWeatherAlternative。'}
scenicSpots 每项必须含：name, city, province, spotType, isFree, ticketPrice, costTips[], suggestedDuration, suitableFor[], playRoute[], mustSeePoints[], photoSpots[], avoidPitfalls[], parkingInfo, imageKeyword, carAccess{canDriveNear,parkingDistance,parkingInfo,roadCondition,walkingDistance,safetyNote}。
meals[] 每项必须是真实可吃的店名/菜名，字段：mealType(breakfast|lunch|dinner|snack), city, recommendation（店名或招牌菜，禁止写「当地美食」「视情况」等空话）, reason（一句话为什么推荐）, estimatedCost（如「人均 40-60 元」）, nearbyArea。
还必须含：day=${day}, title, dateText, startCity, endCity, overnightCity, daySummary, transportSummary, timeline[], scenicSpots[], meals[], hotelSuggestion, dayBudget, tips[], reminders[], badWeatherAlternative?`,
    maxTokens: 6144,
    expectedSchemaHint: `第 ${day} 天的 DetailedDailyPlan 对象`,
    signal,
  })

  for (let i = 0; i < 3; i++) {
    const retryReason = i === 0 ? '' : '上一版时间线无效，请生成真实地点与真实时间安排，且至少包含上午/中午/下午/晚上。'
    const raw = await callStep<Partial<DetailedDailyPlan>>(makePrompt(retryReason))
    const plan = attachWeatherAndRemindersToDailyPlan(normalizeDailyPlan(raw, day), params)
    const minItems = params.planMode === 'simple' ? 3 : 4
    if (hasValidTimeline(plan, minItems)) return plan
  }

  const raw = await callStep<Partial<DetailedDailyPlan>>(makePrompt('请优先保证 timeline 可用。'))
  const fallback = attachWeatherAndRemindersToDailyPlan(normalizeDailyPlan(raw, day), params)
  fallback.timeline = buildFallbackTimeline(fallback)
  return fallback
}

export async function generateBudgetByAi(
  params: RoutePlanningParams,
  dailyPlans: DetailedDailyPlan[],
  config: AiModelConfig,
  signal?: AbortSignal,
): Promise<DetailedBudget> {
  const daysSummary = dailyPlans.map((d) =>
    `第${d.day}天 ${d.startCity}→${d.endCity} 里程${d.transportSummary?.totalDistance || '—'} 预算约${d.dayBudget?.dayTotal || '—'}`,
  ).join('\n')
  const hasSelfDrive = params.departurePoints.some((d) => d.transportType === 'selfDriving')

  const raw = await callStep<Partial<DetailedBudget>>({
    config,
    systemPrompt: `${BASE_SYSTEM} 你现在只需要生成 DetailedBudget JSON，不要返回每日行程。`,
    userPrompt: `请生成总预算 DetailedBudget JSON。

${buildParamsContext(params)}

【每日概要】
${daysSummary}

预算约束：
- low：住宿150-250/间夜，餐饮60-100/人天，门票0-100/人总计，停车0-40/天
- medium：住宿250-450/间夜，餐饮100-180/人天，门票50-250/人总计，停车20-80/天
- high：住宿500-900/间夜，餐饮180-350/人天，门票150-500/人总计，停车50-150/天
如果用户偏好免费景区/低成本/避开高门票，门票预算必须明显降低，不要高估。
无锡周边2日电车自驾且低成本场景，总预算通常应在600-1200附近（以实际为准）。
如果每日行程为回家过夜、车宿/露营或不住酒店，住宿预算应为0元，不得再计入酒店费用。
若用户指定了某天住酒店（如洗衣洗烘），仅该天计入酒店费用。
${hasSelfDrive ? `- 自驾必须单独列出 category=highway 的高速费项：按每日里程粗估（约 0.5 元/km×约70%高速占比），description 写清各天区间；另用 fuel 或 charging 写能源费，不要把高速费混进 oil/充电里。` : ''}
必须包含：currency, perPersonEstimate, totalEstimate, items[]（category: transport/hotel/ticket/food/parking/charging/fuel/highway/other）, notes[]。perPersonEstimate 与 totalEstimate 必须是字符串（如「约 600-900 元/人」），不要返回对象。价格写区间并注明“以实际为准”。`,
    maxTokens: 3072,
    expectedSchemaHint: 'DetailedBudget 对象，含 currency/perPersonEstimate/totalEstimate/items/notes',
    signal,
  })
  return normalizeBudget(raw)
}

export async function generateTipsByAi(
  params: RoutePlanningParams,
  dailyPlans: DetailedDailyPlan[],
  config: AiModelConfig,
  signal?: AbortSignal,
): Promise<GuideTipsResult> {
  const cities = [...new Set(dailyPlans.flatMap((d) => [d.startCity, d.endCity, d.overnightCity].filter(Boolean)))].join('、')

  const raw = await callStep<Partial<GuideTipsResult>>({
    config,
    systemPrompt: `${BASE_SYSTEM} 你现在只需要生成 GuideTipsResult JSON。`,
    userPrompt: `请生成出行注意事项 GuideTipsResult JSON。

${buildParamsContext(params)}

【途经城市】${cities}

必须包含：transportTips[], riskTips[], packingList[], finalSuggestions[]。
若用户有自定义每日事件（如洗澡/健身房淋浴/洗衣），请在 finalSuggestions 或 packingList 中给出可执行提醒。
若为车宿并指定了住酒店天数，请提醒那天提前订有洗衣洗烘的酒店。`,
    maxTokens: 3072,
    expectedSchemaHint: 'GuideTipsResult 对象，含 transportTips/riskTips/packingList/finalSuggestions',
    signal,
  })
  return normalizeGuideTips(raw)
}

function collectAllSpots(guide: DetailedTravelGuide): DetailedScenicSpot[] {
  const seen = new Set<string>()
  const spots: DetailedScenicSpot[] = []
  const add = (s: DetailedScenicSpot) => {
    const key = `${s.city}-${s.name}`
    if (seen.has(key)) return
    seen.add(key)
    spots.push(s)
  }
  for (const s of guide.scenicSpotSummary) add(s)
  for (const day of guide.dailyPlans) {
    for (const s of day.scenicSpots) add(s)
  }
  for (const s of guide.selectedScenicSpots || []) add(s)
  return spots
}

function normalizeImageUrl(url?: string): string {
  if (!url) return ''
  const text = String(url).trim()
  if (!/^https?:\/\//.test(text) && !text.startsWith('/')) return ''
  if (text.includes('undefined') || text.includes('null')) return ''
  return text
}

function attachSpotImage(s: DetailedScenicSpot, imageMap: Map<string, import('@/services/travelImageApi').ScenicImageResult>): DetailedScenicSpot {
  const kw = s.imageKeyword || buildScenicImageKeyword(s)
  const hit = imageMap.get(kw) || imageMap.get(`${s.city}-${s.name}`)
  const normalized = normalizeImageUrl(hit?.url)
  if (!hit || !normalized) {
    return { ...s, image: '', imageSource: undefined, imageStatus: 'noReliableImage' }
  }
  return {
    ...s,
    image: normalized,
    imageSource: hit.source,
    imageStatus: hit.status,
  }
}

export async function hydrateGuideImages(
  guide: DetailedTravelGuide,
  onProgress?: (s: string) => void,
): Promise<DetailedTravelGuide> {
  const spots = collectAllSpots(guide)
  const total = spots.length
  onProgress?.(total ? `正在获取景区图片 0/${total}` : '正在获取景区图片')

  let done = 0
  const imageMap = await batchGetScenicImages(spots, {
    concurrency: 3,
    onProgress: (finished, all, spot) => {
      done = finished
      onProgress?.(`正在获取景区图片 ${finished}/${all}：${spot?.name || ''}`)
    },
  }).catch(async () => {
    // batch 失败时退回串行
    const map = new Map<string, import('@/services/travelImageApi').ScenicImageResult>()
    for (const spot of spots) {
      const kw = spot.imageKeyword || buildScenicImageKeyword(spot)
      const result = await getScenicImage({ ...spot, imageKeyword: kw })
      map.set(kw, result)
      map.set(`${spot.city}-${spot.name}`, result)
      done += 1
      onProgress?.(`正在获取景区图片 ${done}/${total}：${spot.name}`)
    }
    return map
  })

  // 确保 keyword 与 city-name 双索引
  for (const spot of spots) {
    const kw = spot.imageKeyword || buildScenicImageKeyword(spot)
    const hit = imageMap.get(kw) || imageMap.get(`${spot.city}-${spot.name}`)
    if (hit) {
      imageMap.set(kw, hit)
      imageMap.set(`${spot.city}-${spot.name}`, hit)
    }
  }

  const attach = (s: DetailedScenicSpot) => attachSpotImage(s, imageMap)
  const firstCover = spots[0] ? attach(spots[0]).image : ''
  return {
    ...guide,
    scenicSpotSummary: guide.scenicSpotSummary.map(attach),
    dailyPlans: guide.dailyPlans.map((day) => ({
      ...day,
      scenicSpots: day.scenicSpots.map(attach),
    })),
    selectedScenicSpots: (guide.selectedScenicSpots || []).map(attach),
    coverImage: guide.coverImage || firstCover,
    routeOverview: {
      ...guide.routeOverview,
      coverImage: (guide.routeOverview as { coverImage?: string }).coverImage || firstCover,
    },
  }
}

const STEP_ORDER: PlanStep[] = ['outline', 'meeting', 'daily', 'budget', 'tips', 'compose', 'images']

function shouldRunStep(step: PlanStep, fromStep?: PlanStep, retryDay?: number): boolean {
  if (retryDay) return step === 'daily' || step === 'compose' || step === 'images'
  if (!fromStep) return true
  return STEP_ORDER.indexOf(step) >= STEP_ORDER.indexOf(fromStep)
}

async function runStep<T>(
  step: PlanStep,
  day: number | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    throwStepError(e, step, day)
  }
}

export async function planRouteByAi(
  params: RoutePlanningParams,
  config: AiModelConfig,
  options: PlanRouteOptions = {},
): Promise<DetailedTravelGuide | null> {
  const { onProgress, onStateUpdate, signal, existing, fromStep, retryDay, stopAfterStep } = options

  const state: PlanGenerationState = {
    outline: existing?.outline ?? null,
    startPlan: existing?.startPlan ?? null,
    meetingPlan: existing?.meetingPlan ?? null,
    dailyPlans: existing?.dailyPlans ? [...existing.dailyPlans] : [],
    budget: existing?.budget ?? null,
    tips: existing?.tips ?? null,
  }

  const multiDep = needMeetingPlan(params.departurePoints)

  const emitState = () => onStateUpdate?.({ ...state, dailyPlans: [...state.dailyPlans] })
  const shouldStopAfter = (step: PlanStep) => stopAfterStep === step

  try {
    if (shouldRunStep('outline', fromStep, retryDay) && !retryDay) {
      checkAbort(signal)
      onProgress?.('正在生成路线大纲')
      state.outline = await runStep('outline', undefined, () =>
        generateGuideOutlineByAi(params, config, signal),
      )
      emitState()
      onProgress?.('路线大纲生成完成')
      if (shouldStopAfter('outline')) return null
    }

    if (!state.outline) {
      state.outline = await runStep('outline', undefined, () =>
        generateGuideOutlineByAi(params, config, signal),
      )
      emitState()
      if (shouldStopAfter('outline')) return null
    }

    if (shouldRunStep('meeting', fromStep, retryDay) && !retryDay) {
      checkAbort(signal)
      if (multiDep) {
        onProgress?.('正在生成集合点方案')
        state.meetingPlan = await runStep('meeting', undefined, () =>
          generateMeetingPlanByAi(params, state.outline!, config, signal),
        )
        state.startPlan = null
      } else {
        onProgress?.('正在生成出发方案')
        state.startPlan = await runStep('meeting', undefined, () =>
          generateStartPlanByAi(params, state.outline!, config, signal),
        )
        state.meetingPlan = null
      }
      emitState()
      onProgress?.(multiDep ? '集合点方案生成完成' : '出发方案生成完成')
      if (shouldStopAfter('meeting')) return null
    }

    if (multiDep && !state.meetingPlan) {
      state.meetingPlan = await runStep('meeting', undefined, () =>
        generateMeetingPlanByAi(params, state.outline!, config, signal),
      )
      emitState()
    } else if (!multiDep && !state.startPlan) {
      state.startPlan = await runStep('meeting', undefined, () =>
        generateStartPlanByAi(params, state.outline!, config, signal),
      )
      emitState()
    }

    if (shouldRunStep('daily', fromStep, retryDay)) {
      let daysToRun: number[]
      if (retryDay) {
        daysToRun = [retryDay]
      } else {
        const allDays = Array.from({ length: params.travelDays }, (_, i) => i + 1)
        const missing = allDays.filter((d) => !state.dailyPlans.some((p) => p.day === d))
        // fromStep 在 daily 之后（如 budget/tips）时不再重跑每日；在 outline/meeting/daily 时要补齐或重生成
        const fromIdx = fromStep ? STEP_ORDER.indexOf(fromStep) : -1
        const dailyIdx = STEP_ORDER.indexOf('daily')
        if (fromIdx > dailyIdx) {
          daysToRun = []
        } else if (fromStep === 'daily' && missing.length === 0) {
          daysToRun = allDays
        } else {
          daysToRun = missing.length ? missing : allDays
        }
      }

      // 把大纲按天骨架写进每日生成上下文，避免偏离用户确认的大纲
      const outlineDaysHint = (state.outline.dailyOutlines || [])
        .map((d) => `第${d.day}天 ${d.from}→${d.to} ${d.distance || ''} ${d.driveTime || ''} 景点:${(d.attractions || []).join('、')} 过夜:${d.overnight}`)
        .join('\n')

      for (const day of daysToRun) {
        checkAbort(signal)
        onProgress?.(`正在生成第 ${day} 天详细行程`)
        const previousDays = state.dailyPlans
          .filter((p) => p.day < day)
          .sort((a, b) => a.day - b.day)
        const outlineDay = (state.outline!.dailyOutlines || []).find((d) => d.day === day)
        const dailyPlan = await runStep('daily', day, () =>
          generateDailyPlanByAi(
            params,
            day,
            {
              outline: {
                ...state.outline!,
                routeSummary: outlineDaysHint
                  ? `${state.outline!.routeSummary}\n【用户已确认的按天大纲】\n${outlineDaysHint}`
                  : state.outline!.routeSummary,
              },
              outlineDay,
              startPlan: state.startPlan ?? undefined,
              meetingPlan: state.meetingPlan ?? undefined,
              previousDays,
            },
            config,
            signal,
          ),
        )
        const idx = state.dailyPlans.findIndex((p) => p.day === day)
        if (idx >= 0) state.dailyPlans[idx] = dailyPlan
        else state.dailyPlans.push(dailyPlan)
        state.dailyPlans.sort((a, b) => a.day - b.day)
        emitState()
        onProgress?.(`第 ${day} 天行程生成完成`)
      }
      if (shouldStopAfter('daily')) return null
    }

    if (shouldRunStep('budget', fromStep, retryDay) && !retryDay) {
      checkAbort(signal)
      onProgress?.('正在整理预算明细')
      let budget = await runStep('budget', undefined, () =>
        generateBudgetByAi(params, state.dailyPlans, config, signal),
      )
      const tolls = estimateHighwayTollsFromDailyPlans(state.dailyPlans)
      budget = mergeHighwayIntoBudget(budget, tolls, params)
      state.budget = budget
      emitState()
      onProgress?.('预算明细生成完成')
      if (shouldStopAfter('budget')) return null
    }

    if (!state.budget && !retryDay) {
      let budget = await runStep('budget', undefined, () =>
        generateBudgetByAi(params, state.dailyPlans, config, signal),
      )
      budget = mergeHighwayIntoBudget(budget, estimateHighwayTollsFromDailyPlans(state.dailyPlans), params)
      state.budget = budget
      emitState()
    }

    if (shouldRunStep('tips', fromStep, retryDay) && !retryDay) {
      checkAbort(signal)
      onProgress?.('正在整理注意事项')
      state.tips = await runStep('tips', undefined, () =>
        generateTipsByAi(params, state.dailyPlans, config, signal),
      )
      emitState()
      onProgress?.('注意事项生成完成')
      if (shouldStopAfter('tips')) return null
    }

    if (!state.tips && !retryDay) {
      state.tips = await runStep('tips', undefined, () =>
        generateTipsByAi(params, state.dailyPlans, config, signal),
      )
      emitState()
    }

    checkAbort(signal)
    onProgress?.('正在合成图文攻略')
    const guide = composeDetailedGuide({
      outline: state.outline!,
      startPlan: state.startPlan ?? undefined,
      meetingPlan: state.meetingPlan ?? undefined,
      dailyPlans: state.dailyPlans,
      budget: state.budget!,
      tips: state.tips!,
      params,
    })
    onProgress?.('图文攻略合成完成')
    if (shouldStopAfter('compose')) return guide

    checkAbort(signal)
    if (!params.fetchScenicImages) {
      onProgress?.('已跳过景区图片抓取')
      return guide
    }
    return await runStep('images', undefined, () => hydrateGuideImages(guide, onProgress))
  } catch (e) {
    if (e instanceof PlanStepError) throw e
    if (e instanceof AiJsonParseError) {
      throw new PlanStepError(e.message, fromStep || 'outline', retryDay, e.rawText)
    }
    if (e instanceof Error && e.message === '已停止生成') throw e
    throw new PlanStepError(e instanceof Error ? e.message : '生成失败', fromStep || 'outline', retryDay)
  }
}

export async function regenerateBudgetOnly(
  params: RoutePlanningParams,
  guide: DetailedTravelGuide,
  config: AiModelConfig,
  signal?: AbortSignal,
): Promise<DetailedTravelGuide> {
  let budget = await generateBudgetByAi(params, guide.dailyPlans, config, signal)
  budget = mergeHighwayIntoBudget(budget, estimateHighwayTollsFromDailyPlans(guide.dailyPlans), params)
  return {
    ...guide,
    budgetDetail: budget,
  }
}
