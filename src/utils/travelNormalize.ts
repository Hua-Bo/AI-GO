import type {
  BudgetItem,
  DailyBudget,
  DailyHotelSuggestion,
  DailyMealPlan,
  DailyWeather,
  DepartureOverview,
  DepartureToMeetingRoute,
  DeparturePoint,
  DestinationIntent,
  DetailedBudget,
  DetailedDailyPlan,
  DetailedDepartureRoute,
  DetailedFoodRecommendation,
  DetailedHotelSuggestion,
  DetailedMeetingPlan,
  DetailedScenicSpot,
  DetailedTimelineItem,
  DetailedTravelGuide,
  GuideOutline,
  GuideTipsResult,
  RecommendedCity,
  RoutePlanningParams,
  ScenicSpot,
  SpotType,
  StartPlan,
  TravelGuide,
  TravelReminder,
} from '@/types/travelTypes'
import { addDaysToDate } from '@/services/travelWeatherCore'
import { buildRemindersFromDay, normalizeTravelReminder } from '@/utils/travelReminders'

export function normalizeArray<T>(value: unknown, normalizer: (item: unknown, index: number) => T): T[] {
  if (!Array.isArray(value)) return []
  return value.map(normalizer)
}

function normalizeDailyWeather(raw: unknown, fallback?: DailyWeather): DailyWeather | undefined {
  if (!raw && !fallback) return fallback
  const item = (raw || fallback) as Partial<DailyWeather>
  if (!item.date && !fallback?.date) return fallback
  return {
    date: String(item.date || fallback?.date || ''),
    city: String(item.city || fallback?.city || ''),
    weather: String(item.weather || fallback?.weather || ''),
    tempMin: typeof item.tempMin === 'number' ? item.tempMin : (fallback?.tempMin ?? 18),
    tempMax: typeof item.tempMax === 'number' ? item.tempMax : (fallback?.tempMax ?? 26),
    wind: item.wind ? String(item.wind) : fallback?.wind,
    humidity: item.humidity ? String(item.humidity) : fallback?.humidity,
    precipitationProbability: typeof item.precipitationProbability === 'number'
      ? item.precipitationProbability
      : fallback?.precipitationProbability,
    warning: item.warning ? String(item.warning) : fallback?.warning,
    travelAdvice: String(item.travelAdvice || fallback?.travelAdvice || ''),
  }
}

function normalizeTravelReminders(raw: unknown, fallbackDate: string, remindBeforeMinutes: number): TravelReminder[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item, i) => normalizeTravelReminder(item, i, fallbackDate, remindBeforeMinutes))
}

export function attachWeatherAndRemindersToDailyPlan(
  plan: DetailedDailyPlan,
  params: RoutePlanningParams,
): DetailedDailyPlan {
  const weatherFromList = params.weatherList?.[plan.day - 1]
  const dateText = plan.dateText || weatherFromList?.date || (
    params.startDate ? addDaysToDate(params.startDate, plan.day - 1) : undefined
  )
  const weather = normalizeDailyWeather(plan.weather, weatherFromList ? { ...weatherFromList, travelAdvice: weatherFromList.travelAdvice } : undefined)
  const reminders = normalizeTravelReminders(
    plan.reminders,
    dateText || '',
    params.remindBeforeMinutes ?? 15,
  )
  const finalReminders = reminders.length
    ? reminders
    : buildRemindersFromDay({ ...plan, dateText, weather }, params.remindBeforeMinutes ?? 15)
  return {
    ...plan,
    dateText,
    weather,
    reminders: finalReminders,
    badWeatherAlternative: plan.badWeatherAlternative ? String(plan.badWeatherAlternative) : undefined,
  }
}

export function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item) => typeof item === 'string' && item.trim())
      .map((item) => (item as string).trim())
  }
  if (typeof value === 'string') {
    return value
      .split(/[、,，|/;\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

export function buildImageKeyword(name: string, city?: string, province?: string): string {
  return [province, city, name].filter(Boolean).join(' ')
}

const DEST_TYPES = new Set(['city', 'region', 'scenic', 'direction'])
const ROUTE_TYPES = new Set(['direct', 'loop', 'oneWay', 'multiCity'])
const TIMELINE_TYPES = new Set(['meeting', 'transport', 'scenic', 'food', 'hotel', 'rest', 'free'])
const MEAL_TYPES = new Set(['breakfast', 'lunch', 'dinner', 'snack'])
const BUDGET_CATS = new Set(['transport', 'hotel', 'ticket', 'food', 'parking', 'charging', 'fuel', 'other'])
const SPOT_TYPES = new Set<SpotType>(['scenic', 'park', 'museum', 'oldStreet', 'beach', 'mountain', 'lake', 'camping', 'cityWalk', 'foodArea', 'other'])

export function normalizeScenicSpot(raw: unknown, index: number, city?: Partial<RecommendedCity>): ScenicSpot {
  const item = raw as Partial<ScenicSpot> & { name?: string }
  const cityName = String(item.cityName || city?.cityName || '')
  const province = String(item.province || city?.province || '')
  const name = String(item.name || '未知景区')
  return {
    id: String(item.id || `spot-${Date.now()}-${index}`),
    name,
    cityName,
    province,
    address: String(item.address || ''),
    imageKeyword: String(item.imageKeyword || buildImageKeyword(name, cityName, province)),
    image: typeof item.image === 'string' ? item.image : '',
    imageSource: item.imageSource,
    tags: normalizeStringArray(item.tags),
    rating: typeof item.rating === 'number' ? item.rating : undefined,
    recommendedDuration: String(item.recommendedDuration || '2—3 小时'),
    bestTime: String(item.bestTime || '四季皆宜'),
    ticketPrice: String(item.ticketPrice || '以景区为准'),
    description: String(item.description || ''),
    highlights: normalizeStringArray(item.highlights),
    suitableFor: normalizeStringArray(item.suitableFor),
    reason: String(item.reason || ''),
    themes: normalizeStringArray(item.themes),
    free: typeof item.free === 'boolean' ? item.free : undefined,
  }
}

export function normalizeRecommendedCity(raw: unknown, index: number): RecommendedCity {
  const item = raw as Partial<RecommendedCity> & { name?: string; coverImageKeyword?: string }
  const cityName = String(item.cityName || item.name || '未知城市')
  const province = String(item.province || '')
  const city: RecommendedCity = {
    id: String(item.id || `city-${Date.now()}-${index}`),
    cityName,
    province,
    reason: String(item.reason || 'AI 推荐该目的地适合本次出行。'),
    suitableDays: String(item.suitableDays || ''),
    bestTransportSummary: String(item.bestTransportSummary || ''),
    distanceSummary: String(item.distanceSummary || ''),
    estimatedCost: String(item.estimatedCost || ''),
    tags: normalizeStringArray(item.tags),
    coverImageKeyword: String(item.coverImageKeyword || buildImageKeyword(cityName, cityName, province)),
    coverImage: typeof item.coverImage === 'string' ? item.coverImage : '',
    imageSource: item.imageSource,
    scenicSpots: [],
    cityRole: item.cityRole,
  }
  const spots = item.scenicSpots
  city.scenicSpots = Array.isArray(spots) ? spots.map((s, i) => normalizeScenicSpot(s, i, city)) : []
  return city
}

export function normalizeTravelGuide(raw: Partial<TravelGuide>, fallback: Partial<TravelGuide>): TravelGuide {
  const g = { ...fallback, ...raw }
  return {
    title: String(g.title || fallback.title || '旅游攻略'),
    summary: String(g.summary || ''),
    destination: String(g.destination || fallback.destination || ''),
    days: typeof g.days === 'number' ? g.days : (fallback.days || 1),
    peopleTotal: typeof g.peopleTotal === 'number' ? g.peopleTotal : (fallback.peopleTotal || 1),
    routeOverview: String(g.routeOverview || ''),
    arrangementReason: String(g.arrangementReason || ''),
    meetingPlan: String(g.meetingPlan || ''),
    departurePoints: Array.isArray(g.departurePoints) ? g.departurePoints : (fallback.departurePoints || []),
    routePlans: Array.isArray(g.routePlans) ? g.routePlans : (fallback.routePlans || []),
    selectedSpots: Array.isArray(g.selectedSpots) ? g.selectedSpots : (fallback.selectedSpots || []),
    dailyPlans: Array.isArray(g.dailyPlans) ? g.dailyPlans : [],
    spotDetails: Array.isArray(g.spotDetails) ? g.spotDetails : [],
    foodRecommendations: Array.isArray(g.foodRecommendations) ? g.foodRecommendations : [],
    hotelSuggestions: Array.isArray(g.hotelSuggestions) ? g.hotelSuggestions : [],
    packingList: normalizeStringArray(g.packingList),
    budgetEstimate: g.budgetEstimate || fallback.budgetEstimate || {
      transport: '—', hotel: '—', tickets: '—', food: '—', total: '—',
    },
    weatherTips: normalizeStringArray(g.weatherTips),
    backupPlans: normalizeStringArray(g.backupPlans),
    drivingDetails: normalizeStringArray(g.drivingDetails),
    publicTransportDetails: normalizeStringArray(g.publicTransportDetails),
    tips: normalizeStringArray(g.tips),
    routeSegments: Array.isArray(g.routeSegments) ? g.routeSegments : undefined,
    routeReasons: normalizeStringArray(g.routeReasons),
    meetupAdvice: g.meetupAdvice,
  }
}

export function parsePlacesInput(text: string): string[] {
  return normalizeStringArray(text)
}

export function normalizeDestinationIntent(raw: unknown, fallback?: DestinationIntent): DestinationIntent {
  const item = raw as Partial<DestinationIntent>
  const type = item.destinationType && DEST_TYPES.has(item.destinationType)
    ? item.destinationType : (fallback?.destinationType || 'city')
  return {
    destinationText: String(item.destinationText || fallback?.destinationText || ''),
    destinationType: type,
    mustArrive: typeof item.mustArrive === 'boolean' ? item.mustArrive : (fallback?.mustArrive ?? true),
    returnTripNeeded: typeof item.returnTripNeeded === 'boolean' ? item.returnTripNeeded : (fallback?.returnTripNeeded ?? false),
    returnTo: String(item.returnTo || fallback?.returnTo || ''),
    extraNote: String(item.extraNote || fallback?.extraNote || ''),
  }
}

function normalizeCostDetail(raw: unknown, fallbackTotal = ''): DetailedDepartureRoute['costDetail'] {
  const item = raw as Record<string, unknown>
  if (typeof raw === 'string') {
    return { total: raw }
  }
  return {
    fuelCost: item.fuelCost ? String(item.fuelCost) : undefined,
    chargingCost: item.chargingCost ? String(item.chargingCost) : undefined,
    highwayCost: item.highwayCost ? String(item.highwayCost) : undefined,
    trainTicket: item.trainTicket ? String(item.trainTicket) : undefined,
    flightTicket: item.flightTicket ? String(item.flightTicket) : undefined,
    taxiCost: item.taxiCost ? String(item.taxiCost) : undefined,
    total: String(item.total || fallbackTotal || '以实际为准'),
  }
}

function normalizeChargingPlan(raw: unknown): DetailedDepartureRoute['chargingPlan'] {
  if (!raw || typeof raw !== 'object') return undefined
  const item = raw as Record<string, unknown>
  return {
    needCharge: Boolean(item.needCharge),
    suggestedChargingCities: normalizeStringArray(item.suggestedChargingCities),
    chargingTips: normalizeStringArray(item.chargingTips),
  }
}

export function normalizeDetailedDepartureRoute(raw: unknown, index: number): DetailedDepartureRoute {
  const item = raw as Partial<DetailedDepartureRoute> & DepartureToMeetingRoute
  const costRaw = item.costDetail ?? (item.costEstimate ? { total: item.costEstimate } : {})
  return {
    departureId: String(item.departureId || `dep-${index}`),
    fromAddress: String(item.fromAddress || ''),
    fromCity: item.fromCity ? String(item.fromCity) : undefined,
    toMeetingCity: String(item.toMeetingCity || ''),
    toMeetingPlace: String(item.toMeetingPlace || item.toMeetingCity || ''),
    transportType: item.transportType || 'selfDriving',
    carType: item.carType,
    suggestedStartTime: String(item.suggestedStartTime || ''),
    estimatedArrivalTime: String(item.estimatedArrivalTime || ''),
    duration: String(item.duration || ''),
    distance: item.distance ? String(item.distance) : undefined,
    routeDescription: String(item.routeDescription || ''),
    costDetail: normalizeCostDetail(costRaw, item.costEstimate),
    routeSteps: normalizeStringArray(item.routeSteps),
    chargingPlan: normalizeChargingPlan(item.chargingPlan)
      || (item.chargingSuggestion ? { needCharge: true, suggestedChargingCities: [], chargingTips: [item.chargingSuggestion] } : undefined),
    transferSuggestion: item.transferSuggestion ? String(item.transferSuggestion) : undefined,
    drivingTips: normalizeStringArray(item.drivingTips),
  }
}

export function normalizeMeetingPlan(raw: unknown): DetailedMeetingPlan {
  const item = raw as Partial<DetailedMeetingPlan> & {
    meetingLocationSuggestion?: string
    tips?: string[]
    departureRoutes?: unknown[]
  }
  const routes = item.departureRoutes
  return {
    meetingCity: String(item.meetingCity || ''),
    province: item.province ? String(item.province) : undefined,
    meetingPlaceName: String(item.meetingPlaceName || item.meetingLocationSuggestion || ''),
    meetingPlaceAddress: String(item.meetingPlaceAddress || ''),
    suggestedMeetingTime: String(item.suggestedMeetingTime || ''),
    reason: String(item.reason || ''),
    whyNotOtherCities: normalizeStringArray(item.whyNotOtherCities),
    nearbyFacilities: normalizeStringArray(item.nearbyFacilities),
    parkingInfo: item.parkingInfo ? String(item.parkingInfo) : undefined,
    publicTransportInfo: item.publicTransportInfo ? String(item.publicTransportInfo) : undefined,
    departureRoutes: Array.isArray(routes)
      ? routes.map((r, i) => normalizeDetailedDepartureRoute(r, i))
      : [],
    meetingTips: normalizeStringArray(item.meetingTips ?? item.tips),
  }
}

export function normalizeStartPlan(raw: unknown, fallbackAddress = ''): StartPlan {
  const item = raw as Partial<StartPlan>
  return {
    fromAddress: String(item.fromAddress || fallbackAddress),
    firstStopCity: String(item.firstStopCity || ''),
    suggestedStartTime: String(item.suggestedStartTime || ''),
    routeDescription: String(item.routeDescription || ''),
    duration: item.duration ? String(item.duration) : undefined,
    distance: item.distance ? String(item.distance) : undefined,
    costEstimate: String(item.costEstimate || '以实际为准'),
    transportTips: normalizeStringArray(item.transportTips),
    chargingTips: normalizeStringArray(item.chargingTips),
    fuelHighwayTips: normalizeStringArray(item.fuelHighwayTips),
    stationTransferTips: normalizeStringArray(item.stationTransferTips),
  }
}

export function normalizeDetailedScenicSpot(raw: unknown, index: number): DetailedScenicSpot {
  const item = raw as Partial<DetailedScenicSpot> & { cityName?: string; bestTime?: string; free?: boolean }
  const city = String(item.city || item.cityName || '')
  const province = item.province ? String(item.province) : undefined
  const name = String(item.name || '未知景区')
  const spotType = item.spotType && SPOT_TYPES.has(item.spotType) ? item.spotType : 'scenic'
  const ticketPrice = String(item.ticketPrice || '以景区公告为准')
  const isFree = typeof item.isFree === 'boolean'
    ? item.isFree
    : /免费|0元|不需门票|无需门票/i.test(ticketPrice)
  return {
    id: String(item.id || `spot-${Date.now()}-${index}`),
    name,
    city,
    province,
    address: item.address ? String(item.address) : undefined,
    spotType,
    isFree,
    imageKeyword: String(item.imageKeyword || buildImageKeyword(name, city, province)),
    image: typeof item.image === 'string' ? item.image : '',
    imageSource: item.imageSource,
    imageStatus: item.imageStatus,
    reason: String(item.reason || ''),
    description: String(item.description || item.reason || ''),
    suggestedDuration: String(item.suggestedDuration || ''),
    bestVisitTime: String(item.bestVisitTime || item.bestTime || ''),
    ticketPrice,
    costTips: normalizeStringArray(item.costTips),
    carAccess: item.carAccess && typeof item.carAccess === 'object'
      ? {
          canDriveNear: Boolean((item.carAccess as { canDriveNear?: boolean }).canDriveNear),
          parkingDistance: String((item.carAccess as { parkingDistance?: string }).parkingDistance || ''),
          parkingInfo: String((item.carAccess as { parkingInfo?: string }).parkingInfo || item.parkingInfo || ''),
          roadCondition: String((item.carAccess as { roadCondition?: string }).roadCondition || ''),
          walkingDistance: String((item.carAccess as { walkingDistance?: string }).walkingDistance || ''),
          safetyNote: String((item.carAccess as { safetyNote?: string }).safetyNote || ''),
        }
      : undefined,
    parkingInfo: item.parkingInfo ? String(item.parkingInfo) : undefined,
    openingHours: item.openingHours ? String(item.openingHours) : undefined,
    playRoute: normalizeStringArray(item.playRoute),
    mustSeePoints: normalizeStringArray(item.mustSeePoints),
    photoSpots: normalizeStringArray(item.photoSpots),
    avoidPitfalls: normalizeStringArray(item.avoidPitfalls),
    suitableFor: normalizeStringArray(item.suitableFor),
    tags: normalizeStringArray(item.tags),
  }
}

export function normalizeDetailedTimelineItem(raw: unknown, index: number): DetailedTimelineItem {
  const item = raw as Partial<DetailedTimelineItem>
  const type = item.type && TIMELINE_TYPES.has(item.type) ? item.type : 'free'
  const tips = Array.isArray(item.tips) ? normalizeStringArray(item.tips) : (item.tips ? [String(item.tips)] : [])
  return {
    time: String(item.time || ''),
    type,
    title: String(item.title || `时段安排 ${index + 1}`),
    city: item.city ? String(item.city) : undefined,
    location: item.location ? String(item.location) : undefined,
    description: String(item.description || ''),
    duration: item.duration ? String(item.duration) : undefined,
    cost: item.cost ? String(item.cost) : undefined,
    transportDetail: item.transportDetail ? String(item.transportDetail) : undefined,
    tips,
  }
}

function normalizeDailyMeal(raw: unknown, index: number): DailyMealPlan {
  const item = raw as Partial<DailyMealPlan> & { meal?: string }
  const mealType = item.mealType && MEAL_TYPES.has(item.mealType) ? item.mealType : 'lunch'
  return {
    mealType,
    city: String(item.city || ''),
    recommendation: String(item.recommendation || item.meal || ''),
    reason: String(item.reason || ''),
    estimatedCost: String(item.estimatedCost || ''),
    nearbyArea: item.nearbyArea ? String(item.nearbyArea) : undefined,
  }
}

function normalizeDailyHotel(raw: unknown): DailyHotelSuggestion {
  const item = raw as Partial<DailyHotelSuggestion> & { hotelAreaSuggestion?: string; priceRange?: string }
  const type = item.type || (/回家|家/.test(String(item.area || '')) ? 'home' : 'hotel')
  const needed = typeof item.needed === 'boolean' ? item.needed : type !== 'home'
  return {
    needed,
    type,
    city: String(item.city || ''),
    area: String(item.area || item.hotelAreaSuggestion || ''),
    reason: String(item.reason || ''),
    priceRange: String(item.priceRange || ''),
    parkingConvenience: item.parkingConvenience ? String(item.parkingConvenience) : undefined,
    transportConvenience: item.transportConvenience ? String(item.transportConvenience) : undefined,
    bookingTips: normalizeStringArray(item.bookingTips),
  }
}

function isLocalShortTrip(params: RoutePlanningParams): boolean {
  if (params.departurePoints.length !== 1) return false
  if (params.accommodationPreference.mode === 'hotelNeeded') return false
  const departure = params.departurePoints[0]?.address || ''
  const destination = params.destinationIntent.destinationText || ''
  const text = `${departure} ${destination} ${params.specialPlaceHint || ''} ${params.accommodationPreference.note || ''}`
  const localKeywords = ['周边', '附近', '本地', '滨湖', '太湖', '蠡湖', '长广溪', '鼋头渚', '雪浪山', '惠山', '宜兴', '锡山', '惠山区']
  const sameCityWuxi = departure.includes('无锡') && destination.includes('无锡')
  return sameCityWuxi || localKeywords.some((k) => text.includes(k))
}

function forceHomeHotel(day: DetailedDailyPlan, homeBase: string): DetailedDailyPlan {
  return {
    ...day,
    overnightCity: homeBase || day.overnightCity || '家',
    hotelSuggestion: {
      needed: false,
      type: 'home',
      city: homeBase || '家',
      area: '回家过夜',
      reason: '本地/周边短途行程，距离常住地较近，无需额外住宿。',
      priceRange: '0元',
      bookingTips: ['无需预订酒店', '建议提前确认第二天出发时间'],
    },
    dayBudget: {
      ...day.dayBudget,
      hotel: '0元',
    },
  }
}

function normalizeHotelByContext(day: DetailedDailyPlan, params: RoutePlanningParams, localShortTrip: boolean): DetailedDailyPlan {
  if (!localShortTrip && params.accommodationPreference.mode !== 'homeEveryDay') return day
  if (params.accommodationPreference.mode === 'hotelNeeded') return day
  const homeBase = params.accommodationPreference.homeBaseAddress || params.departurePoints[0]?.address || '家'
  return forceHomeHotel(day, homeBase)
}

export function normalizeDailyBudget(raw: unknown): DailyBudget {
  const item = raw as Partial<DailyBudget> & { budgetEstimate?: string }
  if (typeof raw === 'string') {
    return { transport: '', tickets: '', food: '', hotel: '', other: '', dayTotal: raw }
  }
  return {
    transport: String(item.transport || ''),
    tickets: String(item.tickets || ''),
    food: String(item.food || ''),
    hotel: String(item.hotel || ''),
    other: String(item.other || ''),
    dayTotal: String(item.dayTotal || item.budgetEstimate || ''),
  }
}

export function normalizeDailyPlans(raw: unknown): DetailedDailyPlan[] {
  if (!Array.isArray(raw)) return []
  return raw.map((d, i) => {
    const item = d as Partial<DetailedDailyPlan> & {
      routeSummary?: string
      mealSuggestions?: string[]
      hotelAreaSuggestion?: string
      drivingOrTransportTips?: string[]
      budgetEstimate?: string
      scenicSpots?: unknown[]
      timeline?: unknown[]
    }
    const ts = item.transportSummary as Partial<DetailedDailyPlan['transportSummary']> | undefined
    const mealsRaw = item.meals
    const meals = Array.isArray(mealsRaw)
      ? mealsRaw.map((m, j) => normalizeDailyMeal(m, j))
      : normalizeStringArray(item.mealSuggestions).map((m, j) => normalizeDailyMeal({
        mealType: j === 0 ? 'lunch' : 'dinner',
        recommendation: m,
        city: item.overnightCity || item.endCity || '',
        estimatedCost: '',
        reason: '',
      }, j))

    return {
      day: typeof item.day === 'number' ? item.day : i + 1,
      title: String(item.title || `第 ${i + 1} 天`),
      dateText: item.dateText ? String(item.dateText) : undefined,
      startCity: String(item.startCity || ''),
      endCity: String(item.endCity || ''),
      overnightCity: String(item.overnightCity || ''),
      daySummary: String(item.daySummary || item.routeSummary || ''),
      transportSummary: {
        totalDistance: ts?.totalDistance ? String(ts.totalDistance) : (item.totalDistance ? String(item.totalDistance) : undefined),
        totalTransportTime: ts?.totalTransportTime ? String(ts.totalTransportTime) : (item.totalTransportTime ? String(item.totalTransportTime) : undefined),
        transportMode: String(ts?.transportMode || ''),
        routeDescription: String(ts?.routeDescription || ''),
      },
      timeline: Array.isArray(item.timeline)
        ? item.timeline.map((t, j) => normalizeDetailedTimelineItem(t, j))
        : [],
      scenicSpots: Array.isArray(item.scenicSpots)
        ? item.scenicSpots.map((s, j) => normalizeDetailedScenicSpot(s, j))
        : [],
      meals,
      hotelSuggestion: item.hotelSuggestion
        ? normalizeDailyHotel(item.hotelSuggestion)
        : normalizeDailyHotel({ area: item.hotelAreaSuggestion, city: item.overnightCity }),
      dayBudget: normalizeDailyBudget(item.dayBudget ?? item.budgetEstimate),
      tips: normalizeStringArray(item.tips ?? item.drivingOrTransportTips),
      weather: normalizeDailyWeather((item as { weather?: unknown }).weather),
      reminders: normalizeTravelReminders(
        (item as { reminders?: unknown }).reminders,
        item.dateText ? String(item.dateText) : '',
        15,
      ),
      badWeatherAlternative: (item as { badWeatherAlternative?: string }).badWeatherAlternative
        ? String((item as { badWeatherAlternative?: string }).badWeatherAlternative)
        : undefined,
    }
  })
}

function normalizeBudgetItem(raw: unknown, index: number): BudgetItem {
  const item = raw as Partial<BudgetItem>
  const cat = item.category && BUDGET_CATS.has(item.category) ? item.category : 'other'
  return {
    category: cat,
    name: String(item.name || `项目 ${index + 1}`),
    amount: String(item.amount || ''),
    description: String(item.description || ''),
  }
}

export function normalizeDailyPlan(raw: unknown, day: number): DetailedDailyPlan {
  const item = typeof raw === 'object' && raw ? { ...(raw as object), day } : { day }
  const plans = normalizeDailyPlans([item])
  const plan = plans[0]
  if (plan) plan.day = day
  return plan || {
    day,
    title: `第 ${day} 天`,
    startCity: '',
    endCity: '',
    overnightCity: '',
    daySummary: '',
    transportSummary: { transportMode: '', routeDescription: '' },
    timeline: [],
    scenicSpots: [],
    meals: [],
    hotelSuggestion: { needed: true, type: 'hotel', city: '', area: '', reason: '', priceRange: '', bookingTips: [] },
    dayBudget: { transport: '', tickets: '', food: '', hotel: '', other: '', dayTotal: '' },
    tips: [],
  }
}

export function normalizeGuideOutline(raw: unknown, params: RoutePlanningParams): GuideOutline {
  const item = raw as Partial<GuideOutline>
  const routeType = item.routeType && ROUTE_TYPES.has(item.routeType)
    ? item.routeType : 'multiCity'
  const people = params.departurePoints.reduce((s, d) => s + d.peopleCount, 0)
  return {
    title: String(item.title || `${params.destinationIntent.destinationText} ${params.travelDays}日攻略`),
    subtitle: String(item.subtitle || ''),
    summary: String(item.summary || ''),
    destination: String(item.destination || params.destinationIntent.destinationText),
    routeName: String(item.routeName || ''),
    routeType,
    coreCities: normalizeStringArray(item.coreCities),
    totalPeople: typeof item.totalPeople === 'number' ? item.totalPeople : people,
    travelDays: typeof item.travelDays === 'number' ? item.travelDays : params.travelDays,
    routeSummary: String(item.routeSummary || ''),
    routeHighlights: normalizeStringArray(item.routeHighlights),
  }
}

export function normalizeGuideTips(raw: unknown): GuideTipsResult {
  const item = raw as Partial<GuideTipsResult>
  return {
    transportTips: normalizeStringArray(item.transportTips),
    riskTips: normalizeStringArray(item.riskTips),
    packingList: normalizeStringArray(item.packingList),
    finalSuggestions: normalizeStringArray(item.finalSuggestions),
  }
}

function extractFoodFromDailyPlans(dailyPlans: DetailedDailyPlan[]): DetailedFoodRecommendation[] {
  const seen = new Set<string>()
  const result: DetailedFoodRecommendation[] = []
  const mealLabel: Record<string, string> = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '小吃' }
  for (const day of dailyPlans) {
    for (const meal of day.meals) {
      if (!meal.recommendation) continue
      const key = `${meal.city}-${meal.recommendation}`
      if (seen.has(key)) continue
      seen.add(key)
      result.push({
        name: meal.recommendation,
        city: meal.city,
        type: mealLabel[meal.mealType] || '餐饮',
        description: meal.reason,
        avgCost: meal.estimatedCost,
        area: meal.nearbyArea,
      })
    }
  }
  return result
}

function extractHotelsFromDailyPlans(dailyPlans: DetailedDailyPlan[]): DetailedHotelSuggestion[] {
  const seen = new Set<string>()
  const result: DetailedHotelSuggestion[] = []
  for (const day of dailyPlans) {
    const h = day.hotelSuggestion
    if (!h.city && !h.area) continue
    const key = `${h.city}-${h.area}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push({
      city: h.city,
      area: h.area,
      reason: h.reason,
      priceRange: h.priceRange,
      suitableFor: h.transportConvenience || '',
      parkingInfo: h.parkingConvenience,
      bookingTips: h.bookingTips,
    })
  }
  return result
}

function collectScenicSpotSummary(dailyPlans: DetailedDailyPlan[]): DetailedScenicSpot[] {
  const seen = new Set<string>()
  const result: DetailedScenicSpot[] = []
  for (const day of dailyPlans) {
    for (const spot of day.scenicSpots) {
      const key = `${spot.city}-${spot.name}`
      if (seen.has(key)) continue
      seen.add(key)
      result.push(spot)
    }
  }
  return result
}

function validateBudgetReasonable(params: RoutePlanningParams, budget: DetailedBudget): DetailedTravelGuide['budgetReference'] | undefined {
  const lowCostMode = params.budgetLevel === 'low' || params.preferLowCost || params.preferFreeSpots || params.avoidTicketsExpensive
  if (!lowCostMode) return undefined
  const people = Math.max(1, params.departurePoints.reduce((sum, d) => sum + d.peopleCount, 0))
  const days = Math.max(1, params.travelDays)
  const hotelDays = params.accommodationPreference.mode === 'homeEveryDay' || params.accommodationPreference.mode === 'noHotelPreferred' ? 0 : Math.max(days - 1, 1)
  const hotel = hotelDays === 0 ? [0, 0] : (params.budgetLevel === 'low' ? [250, 450] : [400, 700])
  const food = [100 * people * days, 200 * people * days]
  const traffic = params.departurePoints.some((d) => d.transportType === 'selfDriving') ? [80, 260] : [120, 380]
  const tickets = params.preferFreeSpots ? [0, 120] : [80, 300]
  const total = [hotel[0] * hotelDays + food[0] + traffic[0] + tickets[0], hotel[1] * hotelDays + food[1] + traffic[1] + tickets[1]]
  return {
    aiEstimate: budget.totalEstimate || '见AI估算',
    referenceEstimate: `¥${total[0]}-${total[1]}`,
    reason: '你选择了低成本/免费景区偏好，实际费用通常会低于常规景区路线。',
  }
}

export function composeDetailedGuide(parts: {
  outline: GuideOutline
  startPlan?: StartPlan
  meetingPlan?: DetailedMeetingPlan
  dailyPlans: DetailedDailyPlan[]
  budget: DetailedBudget
  tips: GuideTipsResult
  params: RoutePlanningParams
}): DetailedTravelGuide {
  const { outline, startPlan, meetingPlan, dailyPlans, budget, tips, params } = parts
  const deps = params.departurePoints
  const budgetLevelLabel = params.budgetLevel === 'low' ? '经济实惠'
    : params.budgetLevel === 'high' ? '品质轻奢' : '标准舒适'
  const paceLabel = params.pace === 'relaxed' ? '轻松慢游'
    : params.pace === 'compact' ? '特种兵' : '正常安排'
  const planModeLabel = params.planMode === 'detailed' ? '详细版' : '精简版'
  const travelDates = params.startDate
    ? `${params.startDate} 起 ${outline.travelDays} 天`
    : undefined
  const localShortTrip = isLocalShortTrip(params)
  const normalizedDays = dailyPlans
    .map((day) => normalizeHotelByContext(day, params, localShortTrip))
    .map((day) => attachWeatherAndRemindersToDailyPlan(day, params))
  const scenicSummary = collectScenicSpotSummary(normalizedDays)
  const hasHotel = normalizedDays.some((d) => d.hotelSuggestion?.needed)
  const budgetItems = (budget.items || []).map((item) => {
    if (item.category !== 'hotel') return item
    return hasHotel ? item : { ...item, amount: '0元', description: '本次行程安排回家过夜，无需酒店费用' }
  })
  if (!budgetItems.some((i) => i.category === 'hotel')) {
    budgetItems.push({ category: 'hotel', name: '住宿', amount: hasHotel ? '以实际为准' : '0元', description: hasHotel ? '' : '本次行程安排回家过夜，无需酒店费用' })
  }

  return {
    title: outline.title,
    subtitle: outline.subtitle,
    summary: outline.summary,
    planMode: params.planMode || 'simple',
    weatherList: params.weatherList,
    basicInfo: {
      destination: outline.destination,
      travelDays: outline.travelDays,
      totalPeople: outline.totalPeople,
      travelDates,
      startDate: params.startDate,
      planMode: planModeLabel,
      budgetLevel: budgetLevelLabel,
      pace: paceLabel,
      themes: params.travelThemes,
    },
    departureOverview: buildDepartureOverviewFromPoints(deps),
    startPlan,
    meetingPlan,
    routeOverview: {
      routeName: outline.routeName,
      routeType: outline.routeType,
      coreCities: outline.coreCities,
      routeSummary: outline.routeSummary,
      routeHighlights: outline.routeHighlights,
    },
    dailyPlans: normalizedDays,
    scenicSpotSummary: scenicSummary,
    selectedScenicSpots: scenicSummary,
    foodRecommendations: extractFoodFromDailyPlans(normalizedDays),
    hotelSuggestions: extractHotelsFromDailyPlans(normalizedDays),
    budgetDetail: {
      ...budget,
      items: budgetItems,
    },
    transportTips: tips.transportTips,
    riskTips: tips.riskTips,
    packingList: tips.packingList,
    finalSuggestions: tips.finalSuggestions,
    budgetReference: validateBudgetReasonable(params, budget),
    localTripHint: localShortTrip
      ? '检测到本地/周边短途路线，AI 将优先安排回家过夜，不默认推荐酒店。'
      : undefined,
    destinationIntent: params.destinationIntent,
  }
}

export function normalizeBudget(raw: unknown): DetailedBudget {
  const item = raw as Partial<DetailedBudget> & {
    transport?: string; hotel?: string; tickets?: string; food?: string; other?: string; total?: string
  }
  if (item.items && Array.isArray(item.items)) {
    return {
      currency: String(item.currency || 'CNY'),
      perPersonEstimate: String(item.perPersonEstimate || ''),
      totalEstimate: String(item.totalEstimate || ''),
      items: item.items.map((b, i) => normalizeBudgetItem(b, i)),
      notes: normalizeStringArray(item.notes),
    }
  }
  const items: BudgetItem[] = []
  if (item.transport) items.push({ category: 'transport', name: '交通', amount: String(item.transport), description: '' })
  if (item.hotel) items.push({ category: 'hotel', name: '住宿', amount: String(item.hotel), description: '' })
  if (item.tickets) items.push({ category: 'ticket', name: '门票', amount: String(item.tickets), description: '' })
  if (item.food) items.push({ category: 'food', name: '餐饮', amount: String(item.food), description: '' })
  if (item.other) items.push({ category: 'other', name: '其他', amount: String(item.other), description: '' })
  return {
    currency: 'CNY',
    perPersonEstimate: String(item.perPersonEstimate || '见明细'),
    totalEstimate: String(item.totalEstimate || item.total || '—'),
    items,
    notes: normalizeStringArray(item.notes),
  }
}

function normalizeDepartureOverview(raw: unknown, index: number, deps?: DeparturePoint[]): DepartureOverview {
  const item = raw as Partial<DepartureOverview>
  const dep = deps?.find((d) => d.id === item.id) || deps?.[index]
  return {
    id: String(item.id || dep?.id || `dep-${index}`),
    fromAddress: String(item.fromAddress || dep?.address || ''),
    peopleCount: typeof item.peopleCount === 'number' ? item.peopleCount : (dep?.peopleCount || 1),
    transportType: item.transportType || dep?.transportType || 'selfDriving',
    carType: item.carType || dep?.carType,
    roleInTrip: String(item.roleInTrip || ''),
    suggestedStartTime: String(item.suggestedStartTime || dep?.startTime || ''),
    notes: normalizeStringArray(item.notes),
  }
}

function buildDepartureOverviewFromPoints(deps: DeparturePoint[]): DepartureOverview[] {
  return deps.map((d, i) => ({
    id: d.id,
    fromAddress: d.address,
    peopleCount: d.peopleCount,
    transportType: d.transportType,
    carType: d.carType,
    roleInTrip: '',
    suggestedStartTime: d.startTime || '',
    notes: d.remark ? [d.remark] : [],
  }))
}

export function normalizeDetailedTravelGuide(
  raw: unknown,
  fallback: Partial<DetailedTravelGuide> & { params?: RoutePlanningParams },
): DetailedTravelGuide {
  const item = raw as Record<string, unknown>
  const params = fallback.params
  const deps = params?.departurePoints || []

  const routeRaw = (item.routeOverview || item.recommendedRoute) as Record<string, unknown> | undefined
  const routeType = routeRaw?.routeType && ROUTE_TYPES.has(routeRaw.routeType as string)
    ? routeRaw.routeType as DetailedTravelGuide['routeOverview']['routeType']
    : 'multiCity'

  const scenicRaw = item.scenicSpotSummary ?? item.selectedScenicSpots
  const di = normalizeDestinationIntent(item.destinationIntent, fallback.destinationIntent || params?.destinationIntent)

  const budgetLevelLabel = params?.budgetLevel === 'low' ? '经济实惠'
    : params?.budgetLevel === 'high' ? '品质轻奢' : '标准舒适'
  const paceLabel = params?.pace === 'relaxed' ? '轻松慢游'
    : params?.pace === 'compact' ? '特种兵' : '正常安排'

  const departureOverview = Array.isArray(item.departureOverview)
    ? (item.departureOverview as unknown[]).map((d, i) => normalizeDepartureOverview(d, i, deps))
    : buildDepartureOverviewFromPoints(deps)

  const peopleTotal = departureOverview.reduce((s, d) => s + d.peopleCount, 0)

  return {
    title: String(item.title || fallback.title || `${di.destinationText} 旅游攻略`),
    subtitle: String(item.subtitle || ''),
    summary: String(item.summary || fallback.summary || ''),
    basicInfo: {
      destination: String((item.basicInfo as Record<string, unknown>)?.destination || di.destinationText),
      travelDays: typeof (item.basicInfo as Record<string, unknown>)?.travelDays === 'number'
        ? (item.basicInfo as { travelDays: number }).travelDays
        : (params?.travelDays || 1),
      totalPeople: typeof (item.basicInfo as Record<string, unknown>)?.totalPeople === 'number'
        ? (item.basicInfo as { totalPeople: number }).totalPeople
        : peopleTotal,
      travelDates: (item.basicInfo as Record<string, unknown>)?.travelDates
        ? String((item.basicInfo as { travelDates: string }).travelDates) : undefined,
      budgetLevel: String((item.basicInfo as Record<string, unknown>)?.budgetLevel || budgetLevelLabel),
      pace: String((item.basicInfo as Record<string, unknown>)?.pace || paceLabel),
      themes: normalizeStringArray((item.basicInfo as Record<string, unknown>)?.themes || params?.travelThemes),
    },
    departureOverview,
    meetingPlan: item.meetingPlan ? normalizeMeetingPlan(item.meetingPlan) : undefined,
    startPlan: item.startPlan ? normalizeStartPlan(item.startPlan) : undefined,
    routeOverview: {
      routeName: String(routeRaw?.routeName || ''),
      routeType,
      coreCities: normalizeStringArray(routeRaw?.coreCities),
      totalDistance: routeRaw?.totalDistance ? String(routeRaw.totalDistance) : undefined,
      totalTransportTime: routeRaw?.totalTransportTime ? String(routeRaw.totalTransportTime) : undefined,
      coverImage: routeRaw?.coverImage ? String(routeRaw.coverImage) : undefined,
      routeSummary: String(routeRaw?.routeSummary || routeRaw?.reason || ''),
      routeHighlights: normalizeStringArray(routeRaw?.routeHighlights),
    },
    dailyPlans: normalizeDailyPlans(item.dailyPlans),
    scenicSpotSummary: Array.isArray(scenicRaw)
      ? scenicRaw.map((s, i) => normalizeDetailedScenicSpot(s, i))
      : [],
    selectedScenicSpots: Array.isArray(item.selectedScenicSpots)
      ? (item.selectedScenicSpots as unknown[]).map((s, i) => normalizeDetailedScenicSpot(s, i))
      : [],
    coverImage: item.coverImage ? String(item.coverImage) : undefined,
    coverImageSource: item.coverImageSource ? String(item.coverImageSource) : undefined,
    foodRecommendations: Array.isArray(item.foodRecommendations)
      ? (item.foodRecommendations as unknown[]).map((f, i) => {
        const fr = f as Partial<DetailedFoodRecommendation>
        return {
          name: String(fr.name || `美食 ${i + 1}`),
          city: String(fr.city || ''),
          type: String(fr.type || ''),
          description: String(fr.description || ''),
          avgCost: String(fr.avgCost || ''),
          area: fr.area ? String(fr.area) : undefined,
          avoidTip: fr.avoidTip ? String(fr.avoidTip) : undefined,
        }
      })
      : [],
    hotelSuggestions: Array.isArray(item.hotelSuggestions)
      ? (item.hotelSuggestions as unknown[]).map((h) => {
        const hr = h as Partial<DetailedHotelSuggestion>
        return {
          city: String(hr.city || ''),
          area: String(hr.area || ''),
          reason: String(hr.reason || ''),
          priceRange: String(hr.priceRange || ''),
          suitableFor: String(hr.suitableFor || ''),
          parkingInfo: hr.parkingInfo ? String(hr.parkingInfo) : undefined,
          bookingTips: normalizeStringArray(hr.bookingTips),
        }
      })
      : [],
    budgetDetail: normalizeBudget(item.budgetDetail ?? item.budgetEstimate),
    budgetReference: item.budgetReference && typeof item.budgetReference === 'object'
      ? {
          aiEstimate: String((item.budgetReference as { aiEstimate?: string }).aiEstimate || ''),
          referenceEstimate: String((item.budgetReference as { referenceEstimate?: string }).referenceEstimate || ''),
          reason: String((item.budgetReference as { reason?: string }).reason || ''),
        }
      : undefined,
    localTripHint: item.localTripHint ? String(item.localTripHint) : undefined,
    transportTips: normalizeStringArray(item.transportTips),
    riskTips: normalizeStringArray(item.riskTips),
    packingList: normalizeStringArray(item.packingList),
    finalSuggestions: normalizeStringArray(item.finalSuggestions ?? item.editableSuggestions),
    destinationIntent: di,
  }
}

/** @deprecated use normalizeDetailedTravelGuide */
export const normalizeAiRoutePlanningResult = normalizeDetailedTravelGuide

// Legacy aliases
export function normalizeDepartureToMeetingRoute(raw: unknown, index: number) {
  return normalizeDetailedDepartureRoute(raw, index)
}
export function normalizeDailyScenicSpot(raw: unknown, index: number) {
  return normalizeDetailedScenicSpot(raw, index)
}
export function normalizeDailyTimelineItem(raw: unknown, index: number) {
  return normalizeDetailedTimelineItem(raw, index)
}
export function normalizeDailyRoutePlan(raw: unknown, index: number) {
  const plans = normalizeDailyPlans([raw])
  return plans[index] || plans[0]
}
export function normalizeRoutePlanningBudget(raw: unknown) {
  const b = normalizeBudget(raw)
  return { transport: '—', hotel: '—', tickets: '—', food: '—', other: '—', total: b.totalEstimate }
}
