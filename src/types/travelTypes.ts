export type TransportType = 'selfDriving' | 'train' | 'flight' | 'bus'
export type CarType = 'fuel' | 'electric'
export type BudgetLevel = 'low' | 'medium' | 'high'
export type PaceLevel = 'relaxed' | 'normal' | 'compact'
export type AiProvider = 'deepseek' | 'qwen' | 'zhipu' | 'openai' | 'longcat'

export type PlannerStage =
  | 'input'
  | 'needApiKey'
  | 'planning'
  | 'planned'
  | 'error'

export type DestinationType = 'city' | 'region' | 'scenic' | 'direction'

export interface DestinationIntent {
  destinationText: string
  destinationType: DestinationType
  mustArrive: boolean
  returnTripNeeded: boolean
  returnTo?: string
  extraNote?: string
}

export function defaultDestinationIntent(): DestinationIntent {
  return {
    destinationText: '',
    destinationType: 'city',
    mustArrive: true,
    returnTripNeeded: false,
    returnTo: '',
    extraNote: '',
  }
}

/** @deprecated use DestinationIntent */
export interface RouteIntent {
  mode: 'aiRecommend' | 'directionOrDestination'
  directionText: string
  mustPassPlaces: string[]
  avoidPlaces: string[]
  extraNote: string
}

/** @deprecated */
export function defaultRouteIntent(): RouteIntent {
  return {
    mode: 'directionOrDestination',
    directionText: '',
    mustPassPlaces: [],
    avoidPlaces: [],
    extraNote: '',
  }
}

export function parseCommaSeparatedPlaces(text: string): string[] {
  return text
    .split(/[、,，|/]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export interface MeetingPlan {
  meetingCity: string
  province?: string
  reason: string
  suggestedMeetingTime: string
  meetingLocationSuggestion: string
  departureRoutes: DepartureToMeetingRoute[]
  tips: string[]
}

export interface DepartureToMeetingRoute {
  departureId: string
  fromAddress: string
  fromCity?: string
  toMeetingCity: string
  transportType: TransportType
  carType?: CarType
  duration: string
  distance?: string
  costEstimate: string
  routeDescription: string
  transferSuggestion?: string
  chargingSuggestion?: string
  drivingTips?: string[]
}

export interface DailyScenicSpot {
  name: string
  city: string
  province?: string
  imageKeyword: string
  image?: string
  reason: string
  suggestedDuration: string
  ticketPrice?: string
  bestTime?: string
  tags: string[]
}

export interface DailyTimelineItem {
  time: string
  type: 'meeting' | 'transport' | 'scenic' | 'food' | 'hotel' | 'rest' | 'free'
  title: string
  description: string
  city?: string
  duration?: string
  cost?: string
  tips?: string
}

export interface DailyRoutePlan {
  day: number
  title: string
  startCity: string
  endCity: string
  overnightCity: string
  routeSummary: string
  totalDistance?: string
  totalTransportTime?: string
  scenicSpots: DailyScenicSpot[]
  timeline: DailyTimelineItem[]
  mealSuggestions: string[]
  hotelAreaSuggestion: string
  drivingOrTransportTips: string[]
  budgetEstimate: string
}

export interface RoutePlanningBudget {
  transport: string
  hotel: string
  tickets: string
  food: string
  other: string
  total: string
}

export interface DeparturePoint {
  id: string
  address: string
  city?: string
  province?: string
  transportType: TransportType
  carType?: CarType
  peopleCount: number
  departureStation?: string
  departureAirport?: string
  startTime?: string
  remark?: string
}

export interface RoutePlanningParams {
  departurePoints: DeparturePoint[]
  destinationIntent: DestinationIntent
  travelDays: number
  budgetLevel: BudgetLevel
  pace: PaceLevel
  travelThemes: string[]
  withChildren: boolean
  withElderly: boolean
  avoidCrowded: boolean
  preferNaturalScenery: boolean
  preferFood: boolean
  preferPhotoSpot: boolean
  preferFreeSpots: boolean
  preferParks: boolean
  preferCamping: boolean
  preferLakeside: boolean
  preferForest: boolean
  preferCityWalk: boolean
  preferLowCost: boolean
  avoidTicketsExpensive: boolean
  preferDriveToSpot: boolean
  preferRiverside: boolean
  preferWaterPlay: boolean
  preferWildSpot: boolean
  preferEasyParking: boolean
  maxWalkDistance?: string
  specialPlaceHint?: string
  accommodationPreference: {
    mode: 'auto' | 'homeEveryDay' | 'hotelNeeded' | 'campingOrCar' | 'noHotelPreferred'
    homeBaseAddress?: string
    maxReturnDistanceKm?: number
    maxReturnDuration?: string
    note?: string
  }
}

export function needMeetingPlan(departurePoints: DeparturePoint[]): boolean {
  return departurePoints.length > 1
}

export interface StartPlan {
  fromAddress: string
  firstStopCity: string
  suggestedStartTime: string
  routeDescription: string
  duration?: string
  distance?: string
  costEstimate: string
  transportTips: string[]
  chargingTips?: string[]
  fuelHighwayTips?: string[]
  stationTransferTips?: string[]
}

// ── Detailed graphic guide types ──

export interface DepartureOverview {
  id: string
  fromAddress: string
  peopleCount: number
  transportType: TransportType
  carType?: CarType
  roleInTrip: string
  suggestedStartTime: string
  notes: string[]
}

export interface RouteCostDetail {
  fuelCost?: string
  chargingCost?: string
  highwayCost?: string
  trainTicket?: string
  flightTicket?: string
  taxiCost?: string
  total: string
}

export interface ChargingPlan {
  needCharge: boolean
  suggestedChargingCities: string[]
  chargingTips: string[]
}

export interface DetailedDepartureRoute {
  departureId: string
  fromAddress: string
  fromCity?: string
  toMeetingCity: string
  toMeetingPlace: string
  transportType: TransportType
  carType?: CarType
  suggestedStartTime: string
  estimatedArrivalTime: string
  duration: string
  distance?: string
  routeDescription: string
  costDetail: RouteCostDetail
  routeSteps: string[]
  chargingPlan?: ChargingPlan
  transferSuggestion?: string
  drivingTips: string[]
}

export interface DetailedMeetingPlan {
  meetingCity: string
  province?: string
  meetingPlaceName: string
  meetingPlaceAddress: string
  suggestedMeetingTime: string
  reason: string
  whyNotOtherCities: string[]
  nearbyFacilities: string[]
  parkingInfo?: string
  publicTransportInfo?: string
  departureRoutes: DetailedDepartureRoute[]
  meetingTips: string[]
}

export type SpotType =
  | 'scenic' | 'park' | 'museum' | 'oldStreet' | 'beach' | 'mountain'
  | 'lake' | 'camping' | 'cityWalk' | 'foodArea' | 'other'

export type ImageStatus = 'ok' | 'uncertain' | 'noReliableImage'

export interface DetailedScenicSpot {
  id: string
  name: string
  city: string
  province?: string
  address?: string
  spotType: SpotType
  isFree: boolean
  imageKeyword: string
  image?: string
  imageSource?: string
  imageStatus?: ImageStatus
  reason: string
  description: string
  suggestedDuration: string
  bestVisitTime: string
  ticketPrice: string
  costTips: string[]
  carAccess?: {
    canDriveNear: boolean
    parkingDistance: string
    parkingInfo: string
    roadCondition: string
    walkingDistance: string
    safetyNote: string
  }
  parkingInfo?: string
  openingHours?: string
  playRoute: string[]
  mustSeePoints: string[]
  photoSpots: string[]
  avoidPitfalls: string[]
  suitableFor: string[]
  tags: string[]
}

export interface DetailedTimelineItem {
  time: string
  type: 'meeting' | 'transport' | 'scenic' | 'food' | 'hotel' | 'rest' | 'free'
  title: string
  city?: string
  location?: string
  description: string
  duration?: string
  cost?: string
  transportDetail?: string
  tips?: string[]
}

export interface DailyMealPlan {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  city: string
  recommendation: string
  reason: string
  estimatedCost: string
  nearbyArea?: string
}

export interface DailyHotelSuggestion {
  needed: boolean
  type: 'home' | 'hotel' | 'camping' | 'car' | 'none'
  city: string
  area: string
  reason: string
  priceRange: string
  parkingConvenience?: string
  transportConvenience?: string
  bookingTips: string[]
}

export interface DailyBudget {
  transport: string
  tickets: string
  food: string
  hotel: string
  other: string
  dayTotal: string
}

export interface DetailedDailyPlan {
  day: number
  title: string
  dateText?: string
  startCity: string
  endCity: string
  overnightCity: string
  daySummary: string
  transportSummary: {
    totalDistance?: string
    totalTransportTime?: string
    transportMode: string
    routeDescription: string
  }
  timeline: DetailedTimelineItem[]
  scenicSpots: DetailedScenicSpot[]
  meals: DailyMealPlan[]
  hotelSuggestion: DailyHotelSuggestion
  dayBudget: DailyBudget
  tips: string[]
}

export interface DetailedFoodRecommendation {
  name: string
  city: string
  type: string
  description: string
  avgCost: string
  area?: string
  avoidTip?: string
}

export interface DetailedHotelSuggestion {
  city: string
  area: string
  reason: string
  priceRange: string
  suitableFor: string
  parkingInfo?: string
  bookingTips: string[]
}

export interface BudgetItem {
  category: 'transport' | 'hotel' | 'ticket' | 'food' | 'parking' | 'charging' | 'fuel' | 'other'
  name: string
  amount: string
  description: string
}

export interface DetailedBudget {
  currency: string
  perPersonEstimate: string
  totalEstimate: string
  items: BudgetItem[]
  notes: string[]
}

export interface GuideOutline {
  title: string
  subtitle: string
  summary: string
  destination: string
  routeName: string
  routeType: 'direct' | 'loop' | 'oneWay' | 'multiCity'
  coreCities: string[]
  totalPeople: number
  travelDays: number
  routeSummary: string
  routeHighlights: string[]
}

export interface GuideTipsResult {
  transportTips: string[]
  riskTips: string[]
  packingList: string[]
  finalSuggestions: string[]
}

export type PlanStep = 'outline' | 'meeting' | 'daily' | 'budget' | 'tips' | 'compose' | 'images'

export interface PlanGenerationState {
  outline: GuideOutline | null
  startPlan: StartPlan | null
  meetingPlan: DetailedMeetingPlan | null
  dailyPlans: DetailedDailyPlan[]
  budget: DetailedBudget | null
  tips: GuideTipsResult | null
}

export interface DetailedTravelGuide {
  title: string
  subtitle: string
  summary: string
  basicInfo: {
    destination: string
    travelDays: number
    totalPeople: number
    travelDates?: string
    budgetLevel: string
    pace: string
    themes: string[]
  }
  departureOverview: DepartureOverview[]
  startPlan?: StartPlan
  meetingPlan?: DetailedMeetingPlan
  routeOverview: {
    routeName: string
    routeType: 'direct' | 'loop' | 'oneWay' | 'multiCity'
    coreCities: string[]
    totalDistance?: string
    totalTransportTime?: string
    coverImage?: string
    routeSummary: string
    routeHighlights: string[]
  }
  dailyPlans: DetailedDailyPlan[]
  scenicSpotSummary: DetailedScenicSpot[]
  selectedScenicSpots?: DetailedScenicSpot[]
  coverImage?: string
  coverImageSource?: string
  foodRecommendations: DetailedFoodRecommendation[]
  hotelSuggestions: DetailedHotelSuggestion[]
  budgetDetail: DetailedBudget
  transportTips: string[]
  riskTips: string[]
  packingList: string[]
  finalSuggestions: string[]
  budgetReference?: {
    aiEstimate: string
    referenceEstimate: string
    reason: string
  }
  localTripHint?: string
  destinationIntent?: DestinationIntent
}

/** @deprecated alias */
export type AiRoutePlanningResult = DetailedTravelGuide

export interface TravelRecommendParams {
  departurePoints: DeparturePoint[]
  travelDays: number
  budgetLevel: BudgetLevel
  pace: PaceLevel
  travelThemes: string[]
  withChildren: boolean
  withElderly: boolean
  avoidCrowded: boolean
  preferNaturalScenery: boolean
  preferFood: boolean
  preferPhotoSpot: boolean
  destinationIntent: DestinationIntent
}

export interface ScenicSpot {
  id: string
  name: string
  cityName: string
  province: string
  address?: string
  image: string
  imageKeyword?: string
  imageSource?: string
  tags: string[]
  rating?: number
  recommendedDuration: string
  bestTime: string
  ticketPrice: string
  description: string
  highlights: string[]
  suitableFor: string[]
  reason: string
  themes?: string[]
  free?: boolean
}

export interface RecommendedCity {
  id: string
  cityName: string
  province: string
  reason: string
  suitableDays: string
  bestTransportSummary: string
  distanceSummary: string
  estimatedCost: string
  tags: string[]
  coverImage: string
  coverImageKeyword?: string
  imageSource?: string
  scenicSpots: ScenicSpot[]
  cityRole?: 'stopover' | 'destination'
}

export interface RouteCity {
  id: string
  cityName: string
  province: string
  staySuggestion: string
  reason: string
  coverImageKeyword: string
  coverImage?: string
  tags: string[]
  scenicSpots: ScenicSpot[]
}

export interface RouteSegment {
  day?: number
  from: string
  to: string
  distanceText: string
  durationText: string
  transportSuggestion: string
  sceneryLevel: 'normal' | 'good' | 'excellent'
  tips: string[]
  scenicPoints?: string[]
}

export interface AiRoutePlanResult {
  title: string
  summary: string
  targetDestination: string
  recommendedRouteCities: RouteCity[]
  routeSegments: RouteSegment[]
  scenicSpots: ScenicSpot[]
  dailyPlans: DailyPlan[]
  routeReasons: string[]
}

export interface CustomRouteParams extends TravelRecommendParams {}

export interface AiRecommendResult {
  cities: RecommendedCity[]
}

export interface SpotDetail {
  spotName: string
  recommendedReason: string
  duration: string
  bestTime: string
  ticketTip: string
  parkingTip: string
  photoTips: string[]
  avoidPitfalls: string[]
}

export interface AiModelConfig {
  provider: 'deepseek' | 'qwen' | 'zhipu' | 'openai' | 'longcat'
  baseURL: string
  apiKey: string
  model: string
  endpointMode?: 'openai' | 'anthropic'
  requestMode?: 'direct' | 'proxy'
  proxyURL?: string
  temperature?: number
  maxTokens?: number
  thinkingEnabled?: boolean
}

export interface RoutePlan {
  fromAddress: string
  fromCity?: string
  toCity: string
  transportType: TransportType
  carType?: CarType
  distance: string
  duration: string
  costRange: string
  routeTips: string[]
}

export interface DailyPlanItem {
  time: string
  title: string
  type: 'transport' | 'scenic' | 'food' | 'hotel' | 'free'
  description: string
  cost?: string
  duration?: string
  tips?: string
}

export interface DailyPlan {
  day: number
  title: string
  dateText?: string
  items: DailyPlanItem[]
}

export interface FoodRecommendation {
  name: string
  city: string
  type: string
  description: string
  avgCost: string
  avoidTip?: string
}

export interface HotelSuggestion {
  area: string
  reason: string
  priceRange: string
  suitableFor: string
}

export interface BudgetEstimate {
  transport: string
  hotel: string
  tickets: string
  food: string
  parkingCharging?: string
  total: string
}

export interface TravelGuide {
  title: string
  summary: string
  destination: string
  days: number
  peopleTotal: number
  routeOverview?: string
  arrangementReason?: string
  meetingPlan?: string
  departurePoints: DeparturePoint[]
  routePlans: RoutePlan[]
  selectedSpots: ScenicSpot[]
  dailyPlans: DailyPlan[]
  spotDetails?: SpotDetail[]
  foodRecommendations: FoodRecommendation[]
  hotelSuggestions: HotelSuggestion[]
  packingList: string[]
  budgetEstimate: BudgetEstimate
  weatherTips?: string[]
  backupPlans?: string[]
  drivingDetails?: string[]
  publicTransportDetails?: string[]
  tips: string[]
  routeSegments?: RouteSegment[]
  routeReasons?: string[]
  meetupAdvice?: {
    city: string
    time: string
    earlyArrival: string
    lateArrival: string
  }
}

export interface GenerateTravelGuideParams {
  departurePoints: DeparturePoint[]
  targetCity: RecommendedCity
  selectedSpots: ScenicSpot[]
  routePlans: RoutePlan[]
  travelDays: number
  budgetLevel: BudgetLevel
  pace: PaceLevel
  travelThemes: string[]
  withChildren: boolean
  withElderly: boolean
  routeIntent?: RouteIntent
  destinationIntent?: DestinationIntent
  planResult?: AiRoutePlanningResult
}

export interface AiProviderConfig {
  provider: AiProvider
  baseURL: string
  apiKey: string
  model: string
}

export const TRANSPORT_OPTIONS = [
  { label: '自驾', value: 'selfDriving' as const, icon: '🚗' },
  { label: '高铁', value: 'train' as const, icon: '🚄' },
  { label: '飞机', value: 'flight' as const, icon: '✈️' },
  { label: '大巴', value: 'bus' as const, icon: '🚌' },
]

export const CAR_TYPE_OPTIONS = [
  { label: '油车', value: 'fuel' as const },
  { label: '电车', value: 'electric' as const },
]

export const THEME_OPTIONS = [
  '山水风景', '海边度假', '古镇人文', '美食打卡', '亲子游', '情侣游',
  '摄影出片', '小众景点', '避暑', '温泉', '漂流', '城市漫游',
]

export const OUTDOOR_PREF_OPTIONS = [
  { key: 'preferFreeSpots' as const, label: '免费景区' },
  { key: 'preferParks' as const, label: '公园' },
  { key: 'preferCamping' as const, label: '露营' },
  { key: 'preferLakeside' as const, label: '湖边' },
  { key: 'preferForest' as const, label: '森林' },
  { key: 'preferCityWalk' as const, label: '城市散步' },
  { key: 'preferLowCost' as const, label: '低成本' },
  { key: 'avoidTicketsExpensive' as const, label: '避开高门票' },
  { key: 'preferDriveToSpot' as const, label: '车能开到附近' },
  { key: 'preferRiverside' as const, label: '河边玩水' },
  { key: 'preferWaterPlay' as const, label: '湖边 / 溪流' },
  { key: 'preferWildSpot' as const, label: '小众野点' },
  { key: 'preferEasyParking' as const, label: '停车方便' },
]

export const SPOT_TYPE_LABELS: Record<SpotType, string> = {
  scenic: '景区',
  park: '公园',
  museum: '博物馆',
  oldStreet: '古街',
  beach: '海滩',
  mountain: '山地',
  lake: '湖泊',
  camping: '露营',
  cityWalk: '城市散步',
  foodArea: '美食区',
  other: '其他',
}

export const BUDGET_OPTIONS = [
  { label: '经济实惠', value: 'low' as const },
  { label: '标准舒适', value: 'medium' as const },
  { label: '品质轻奢', value: 'high' as const },
]

export const PACE_OPTIONS = [
  { label: '轻松慢游', value: 'relaxed' as const },
  { label: '正常安排', value: 'normal' as const },
  { label: '特种兵行程', value: 'compact' as const },
]

export const DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7] as const

export const PLAN_ROUTE_LOADING_STEPS = [
  '正在分析多个出发地',
  '正在推荐最佳集合点',
  '正在规划各出发地到集合点路线',
  '正在拆分每日详细行程',
  '正在细化景区与预算',
  '正在生成详细图文攻略',
  '正在获取景区图片',
]

export const CUSTOM_ROUTE_LOADING_STEPS = [
  '正在分析出发地与方向约束',
  '正在规划沿途城市顺序',
  '正在匹配每日偏好安排',
  '正在生成路线段建议',
  '正在整理景区清单',
  '正在获取真实图片',
]

export const GUIDE_LOADING_STEPS = [
  '正在规划多出发地汇合方案',
  '正在安排每日行程',
  '正在优化景区顺序',
  '正在整理美食和住宿建议',
  '正在估算费用',
  '正在生成可下载攻略',
]
