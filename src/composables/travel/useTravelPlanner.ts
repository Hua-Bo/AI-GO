import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { PlanStepError, hydrateGuideImages, planRouteByAi, regenerateBudgetOnly } from '@/services/travelAiApi'
import { getTravelWeather } from '@/api/travelWeather'
import { defaultTravelStartDate } from '@/services/travelWeatherCore'
import { AiRequestError } from '@/services/travelAiChat'
import { useAiModelConfig } from '@/composables/travel/useAiModelConfig'
import type {
  CustomDailyEvent,
  DailyWeather,
  DeparturePoint,
  DestinationIntent,
  DetailedTravelGuide,
  GuideOutline,
  PlanGenerationState,
  PlanMode,
  PlanStep,
  PlannerStage,
} from '@/types/travelTypes'
import { defaultDestinationIntent } from '@/types/travelTypes'

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function emptyDeparture(): DeparturePoint {
  return {
    id: uid(),
    address: '',
    transportType: 'selfDriving',
    carType: 'fuel',
    peopleCount: 2,
  }
}

function emptyGenerationState(): PlanGenerationState {
  return {
    outline: null,
    startPlan: null,
    meetingPlan: null,
    dailyPlans: [],
    budget: null,
    tips: null,
  }
}

export function useTravelPlanner() {
  const { config: aiConfig, hasApiKey, configDialogVisible, saveConfig } = useAiModelConfig()

  const stage = ref<PlannerStage>('input')
  const loadingStep = ref('')
  const error = ref('')
  const errorDetail = ref('')
  const lastFailedAction = ref<'plan' | null>(null)
  const abortController = ref<AbortController | null>(null)
  const generationState = ref<PlanGenerationState>(emptyGenerationState())
  const failedStep = ref<PlanStep | null>(null)
  const failedDay = ref<number | null>(null)
  const rawResponse = ref('')
  const showRawResponse = ref(false)

  const travelDays = ref(3)
  const customDays = ref(3)
  const useCustomDays = ref(false)
  const departurePoints = ref<DeparturePoint[]>([emptyDeparture()])
  const travelThemes = ref(['海边度假', '美食打卡', '摄影出片'])
  const budgetLevel = ref<'low' | 'medium' | 'high'>('medium')
  const pace = ref<'relaxed' | 'normal' | 'compact'>('normal')
  const withChildren = ref(false)
  const withElderly = ref(false)
  const avoidCrowded = ref(false)
  const preferNaturalScenery = ref(true)
  const preferFood = ref(true)
  const preferPhotoSpot = ref(true)
  const preferFreeSpots = ref(false)
  const preferParks = ref(false)
  const preferCamping = ref(false)
  const preferLakeside = ref(false)
  const preferForest = ref(false)
  const preferCityWalk = ref(false)
  const preferLowCost = ref(false)
  const avoidTicketsExpensive = ref(false)
  const preferDriveToSpot = ref(false)
  const preferRiverside = ref(false)
  const preferWaterPlay = ref(false)
  const preferWildSpot = ref(false)
  const preferEasyParking = ref(false)
  const maxWalkDistance = ref('0-500米')
  const specialPlaceHint = ref('')
  const customDailyEvents = ref<CustomDailyEvent[]>([])
  const accommodationMode = ref<'auto' | 'homeEveryDay' | 'hotelNeeded' | 'campingOrCar' | 'noHotelPreferred'>('auto')
  const homeBaseAddress = ref('')
  const maxReturnDistanceKm = ref(80)
  const maxReturnDuration = ref('1.5小时')
  const accommodationNote = ref('')
  const hotelDays = ref<number[]>([])
  const hotelDayReason = ref('洗衣洗烘，补充补给')

  const destinationIntent = ref<DestinationIntent>(defaultDestinationIntent())
  const planResult = ref<DetailedTravelGuide | null>(null)
  const startDate = ref(defaultTravelStartDate())
  const planMode = ref<PlanMode>('simple')
  const remindBeforeMinutes = ref(15)
  /** 默认关闭图片抓取，加快生成；需要时再开或事后补图 */
  const fetchScenicImages = ref(false)
  const outlineRevisionNote = ref('')
  const hydratingImages = ref(false)
  /** 当前正在跑的生成阶段，用于加载面板展示真实步骤 */
  const planningMode = ref<'idle' | 'outline' | 'detail' | 'budget' | 'images'>('idle')
  const weatherFetched = ref(false)

  const effectiveDays = computed(() => (useCustomDays.value ? customDays.value : travelDays.value))
  const peopleTotal = computed(() =>
    departurePoints.value.reduce((s, d) => s + d.peopleCount, 0),
  )
  const isPlanning = computed(() => stage.value === 'planning')
  const isPlanParseError = computed(() => !!failedStep.value)
  const guideReady = computed(() => !!planResult.value)
  const outlineReady = computed(() => stage.value === 'outline_ready' && !!generationState.value.outline)
  const currentOutline = computed<GuideOutline | null>(() => generationState.value.outline)
  const canGenerate = computed(() => {
    if (isPlanning.value || !hasApiKey.value) return false
    return !validateDepartures() && !validateDestination()
  })

  function validateDepartures(): string | null {
    if (!departurePoints.value.length) return '请至少填写一个出发地'
    for (let i = 0; i < departurePoints.value.length; i++) {
      const d = departurePoints.value[i]
      if (!d.address.trim()) return `出发地 ${i + 1}：请填写地址或城市`
      if (d.transportType === 'selfDriving' && !d.carType) return `出发地 ${i + 1}：自驾请选择车辆类型`
    }
    if (effectiveDays.value <= 0) return '请选择游玩天数'
    return null
  }

  function validateDestination(): string | null {
    if (!destinationIntent.value.destinationText.trim()) {
      return '请填写目标终点或方向，例如：青岛、厦门、西藏方向。'
    }
    return null
  }

  function buildPlanParams(extra?: { outlineRevisionNote?: string }) {
    return {
      departurePoints: departurePoints.value,
      destinationIntent: destinationIntent.value,
      travelDays: effectiveDays.value,
      startDate: startDate.value,
      planMode: planMode.value,
      fetchScenicImages: fetchScenicImages.value,
      outlineRevisionNote: extra?.outlineRevisionNote ?? outlineRevisionNote.value,
      remindBeforeMinutes: remindBeforeMinutes.value,
      budgetLevel: budgetLevel.value,
      pace: pace.value,
      travelThemes: travelThemes.value,
      withChildren: withChildren.value,
      withElderly: withElderly.value,
      avoidCrowded: avoidCrowded.value,
      preferNaturalScenery: preferNaturalScenery.value,
      preferFood: preferFood.value,
      preferPhotoSpot: preferPhotoSpot.value,
      preferFreeSpots: preferFreeSpots.value,
      preferParks: preferParks.value,
      preferCamping: preferCamping.value,
      preferLakeside: preferLakeside.value,
      preferForest: preferForest.value,
      preferCityWalk: preferCityWalk.value,
      preferLowCost: preferLowCost.value,
      avoidTicketsExpensive: avoidTicketsExpensive.value,
      preferDriveToSpot: preferDriveToSpot.value,
      preferRiverside: preferRiverside.value,
      preferWaterPlay: preferWaterPlay.value,
      preferWildSpot: preferWildSpot.value,
      preferEasyParking: preferEasyParking.value,
      maxWalkDistance: maxWalkDistance.value,
      specialPlaceHint: specialPlaceHint.value,
      customDailyEvents: customDailyEvents.value.filter((e) => e.enabled && e.title.trim()),
      accommodationPreference: {
        mode: accommodationMode.value,
        homeBaseAddress: homeBaseAddress.value || departurePoints.value[0]?.address || '',
        maxReturnDistanceKm: maxReturnDistanceKm.value,
        maxReturnDuration: maxReturnDuration.value,
        note: accommodationNote.value,
        hotelDays: hotelDays.value,
        hotelDayReason: hotelDayReason.value,
      },
    }
  }

  function ensureApiKey(): boolean {
    if (hasApiKey.value) return true
    error.value = '请先点击「AI 配置」填写你自己的 API Key'
    stage.value = 'needApiKey'
    configDialogVisible.value = true
    return false
  }

  function stopGeneration() {
    abortController.value?.abort()
    loadingStep.value = ''
    if (generationState.value.outline && !planResult.value) {
      stage.value = 'outline_ready'
      error.value = '已停止，可继续确认大纲或重新生成'
    } else {
      stage.value = generationState.value.outline ? 'error' : 'input'
      error.value = '已停止生成'
    }
    errorDetail.value = ''
  }

  function handlePlanError(e: unknown) {
    if (e instanceof Error && e.message === '已停止生成') {
      error.value = '已停止生成'
      stage.value = generationState.value.outline && !planResult.value ? 'outline_ready' : (generationState.value.outline ? 'error' : 'input')
      return
    }
    if (e instanceof PlanStepError) {
      failedStep.value = e.step
      failedDay.value = e.day ?? null
      rawResponse.value = e.rawResponse || ''
      error.value = 'AI 返回格式错误，已停止生成。'
      errorDetail.value = e.message
    } else if (e instanceof AiRequestError) {
      rawResponse.value = typeof e.raw === 'string' ? e.raw : ''
      error.value = e.type === 'missing_key'
        ? '请先点击「AI 配置」填写你自己的 API Key。'
        : e.type === 'cors' || e.type === 'network'
          ? e.message
          : e.type === 'auth'
            ? 'API Key 无效或没有权限，请检查你填写的 Key。'
            : e.message
      errorDetail.value = e.message
    } else {
      error.value = e instanceof Error ? e.message : '路线规划失败'
      errorDetail.value = ''
    }
    stage.value = generationState.value.outline && !planResult.value && failedStep.value === 'outline'
      ? 'error'
      : 'error'
  }

  async function fetchWeatherList(): Promise<DailyWeather[]> {
    try {
      return await getTravelWeather({
        city: destinationIntent.value.destinationText,
        startDate: startDate.value,
        days: effectiveDays.value,
      })
    } catch {
      return []
    }
  }

  /** 第一步：只生成大纲 */
  async function planOutline(options?: { revisionNote?: string; keepOutlineFeedback?: boolean }) {
    const validationError = validateDepartures() || validateDestination()
    if (validationError) {
      error.value = validationError
      errorDetail.value = ''
      stage.value = 'error'
      return
    }
    if (!ensureApiKey()) return

    generationState.value = emptyGenerationState()
    planResult.value = null
    failedStep.value = null
    failedDay.value = null
    rawResponse.value = ''
    if (!options?.keepOutlineFeedback) outlineRevisionNote.value = options?.revisionNote || ''

    error.value = ''
    errorDetail.value = ''
    showRawResponse.value = false
    stage.value = 'planning'
    lastFailedAction.value = 'plan'

    abortController.value?.abort()
    const controller = new AbortController()
    abortController.value = controller

    try {
      loadingStep.value = '正在获取每日天气'
      weatherFetched.value = false
      planningMode.value = 'outline'
      const weatherList = await fetchWeatherList()
      weatherFetched.value = true
      const note = options?.revisionNote ?? outlineRevisionNote.value
      await planRouteByAi(
        { ...buildPlanParams({ outlineRevisionNote: note }), weatherList },
        aiConfig.value,
        {
          onProgress: (s) => { loadingStep.value = s },
          onStateUpdate: (s) => { generationState.value = s },
          signal: controller.signal,
          stopAfterStep: 'outline',
        },
      )
      if (!generationState.value.outline) throw new Error('大纲生成失败')
      outlineRevisionNote.value = ''
      stage.value = 'outline_ready'
      lastFailedAction.value = null
      failedStep.value = null
      failedDay.value = null
    } catch (e) {
      handlePlanError(e)
    } finally {
      loadingStep.value = ''
      planningMode.value = 'idle'
      abortController.value = null
    }
  }

  /** 第二步：基于已确认大纲生成细行程 */
  async function confirmOutlineAndGenerateDetail() {
    if (!generationState.value.outline) {
      error.value = '请先生成行程大纲'
      stage.value = 'error'
      return
    }
    if (!ensureApiKey()) return

    error.value = ''
    errorDetail.value = ''
    stage.value = 'planning'
    lastFailedAction.value = 'plan'
    planResult.value = null
    // 保留大纲，清空后续步骤缓存
    generationState.value = {
      ...generationState.value,
      startPlan: null,
      meetingPlan: null,
      dailyPlans: [],
      budget: null,
      tips: null,
    }

    abortController.value?.abort()
    const controller = new AbortController()
    abortController.value = controller

    try {
      loadingStep.value = '正在获取每日天气'
      weatherFetched.value = false
      planningMode.value = 'detail'
      const weatherList = await fetchWeatherList()
      weatherFetched.value = true
      const guide = await planRouteByAi(
        { ...buildPlanParams({ outlineRevisionNote: '' }), weatherList },
        aiConfig.value,
        {
          onProgress: (s) => { loadingStep.value = s },
          onStateUpdate: (s) => { generationState.value = s },
          signal: controller.signal,
          existing: generationState.value,
          fromStep: 'meeting',
        },
      )
      if (!guide) throw new Error('详细行程生成失败')
      planResult.value = guide
      stage.value = 'planned'
      lastFailedAction.value = null
      failedStep.value = null
      failedDay.value = null
      rawResponse.value = ''
    } catch (e) {
      handlePlanError(e)
    } finally {
      loadingStep.value = ''
      planningMode.value = 'idle'
      abortController.value = null
    }
  }

  async function reviseOutline(note: string) {
    outlineRevisionNote.value = note
    await planOutline({ revisionNote: note, keepOutlineFeedback: true })
  }

  async function runPlan(options?: {
    fromStart?: boolean
    retryStep?: boolean
    retryDay?: number
  }) {
    const validationError = validateDepartures() || validateDestination()
    if (validationError) {
      error.value = validationError
      errorDetail.value = ''
      stage.value = 'error'
      return
    }
    if (!ensureApiKey()) return

    // 默认入口改为两步：先大纲
    if (options?.fromStart && !options.retryStep && !options.retryDay) {
      await planOutline()
      return
    }

    if (options?.fromStart) {
      generationState.value = emptyGenerationState()
      failedStep.value = null
      failedDay.value = null
      rawResponse.value = ''
      planResult.value = null
    }

    error.value = ''
    errorDetail.value = ''
    showRawResponse.value = false
    stage.value = 'planning'
    lastFailedAction.value = 'plan'

    abortController.value?.abort()
    const controller = new AbortController()
    abortController.value = controller

    const fromStep = options?.retryStep ? (failedStep.value || undefined) : undefined
    const retryDay = options?.retryDay ?? (options?.retryStep ? (failedDay.value ?? undefined) : undefined)

    try {
      loadingStep.value = '正在获取每日天气'
      weatherFetched.value = false
      planningMode.value = failedStep.value === 'outline' ? 'outline' : 'detail'
      const weatherList = await fetchWeatherList()
      weatherFetched.value = true

      const guide = await planRouteByAi(
        { ...buildPlanParams(), weatherList },
        aiConfig.value,
        {
          onProgress: (s) => { loadingStep.value = s },
          onStateUpdate: (s) => { generationState.value = s },
          signal: controller.signal,
          existing: options?.fromStart ? undefined : generationState.value,
          fromStep,
          retryDay,
        },
      )
      if (!guide) {
        if (generationState.value.outline) {
          stage.value = 'outline_ready'
          return
        }
        throw new Error('生成失败')
      }
      planResult.value = guide
      stage.value = 'planned'
      lastFailedAction.value = null
      failedStep.value = null
      failedDay.value = null
      rawResponse.value = ''
    } catch (e) {
      handlePlanError(e)
    } finally {
      loadingStep.value = ''
      planningMode.value = 'idle'
      abortController.value = null
    }
  }

  async function planRoute() {
    await planOutline()
  }

  async function retryCurrentStep() {
    if (failedStep.value === 'outline' || stage.value === 'outline_ready') {
      await planOutline({ revisionNote: outlineRevisionNote.value })
      return
    }
    await runPlan({ retryStep: true })
  }

  async function retryFromStart() {
    await planOutline()
  }

  async function retryFailedDay(day: number) {
    failedStep.value = 'daily'
    failedDay.value = day
    await runPlan({ retryStep: true, retryDay: day })
  }

  async function retryLastRequest() {
    if (failedStep.value) await retryCurrentStep()
    else await planRoute()
  }

  async function regenerateDailyDetails() {
    if (!generationState.value.outline && !planResult.value) {
      ElMessage.warning('请先生成并确认行程大纲')
      return
    }
    if (!ensureApiKey()) return

    // 用已有攻略/大纲回填 generationState，从 daily 步重跑
    if (planResult.value) {
      generationState.value = {
        outline: generationState.value.outline || {
          title: planResult.value.title,
          subtitle: planResult.value.subtitle,
          summary: planResult.value.summary,
          destination: planResult.value.basicInfo.destination,
          routeName: planResult.value.routeOverview.routeName,
          routeType: planResult.value.routeOverview.routeType,
          coreCities: planResult.value.routeOverview.coreCities || [],
          totalPeople: planResult.value.basicInfo.totalPeople,
          travelDays: planResult.value.basicInfo.travelDays,
          routeSummary: planResult.value.routeOverview.routeSummary || planResult.value.summary,
          routeHighlights: planResult.value.routeOverview.routeHighlights || [],
        },
        startPlan: planResult.value.startPlan || generationState.value.startPlan,
        meetingPlan: planResult.value.meetingPlan || generationState.value.meetingPlan,
        dailyPlans: [],
        budget: null,
        tips: null,
      }
    } else {
      generationState.value = {
        ...generationState.value,
        dailyPlans: [],
        budget: null,
        tips: null,
      }
    }

    error.value = ''
    errorDetail.value = ''
    stage.value = 'planning'
    planningMode.value = 'detail'
    lastFailedAction.value = 'plan'
    failedStep.value = 'daily'
    failedDay.value = null

    abortController.value?.abort()
    const controller = new AbortController()
    abortController.value = controller

    try {
      loadingStep.value = '正在获取每日天气'
      weatherFetched.value = false
      const weatherList = await fetchWeatherList()
      weatherFetched.value = true
      const guide = await planRouteByAi(
        { ...buildPlanParams({ outlineRevisionNote: '' }), weatherList },
        aiConfig.value,
        {
          onProgress: (s) => { loadingStep.value = s },
          onStateUpdate: (s) => { generationState.value = s },
          signal: controller.signal,
          existing: generationState.value,
          fromStep: 'daily',
        },
      )
      if (!guide) throw new Error('每日细行程生成失败')
      planResult.value = guide
      stage.value = 'planned'
      lastFailedAction.value = null
      failedStep.value = null
      failedDay.value = null
      ElMessage.success('每日详细行程已生成')
    } catch (e) {
      handlePlanError(e)
    } finally {
      loadingStep.value = ''
      planningMode.value = 'idle'
      abortController.value = null
    }
  }

  async function regenerateBudget() {
    if (!planResult.value) return
    if (!ensureApiKey()) return
    abortController.value?.abort()
    const controller = new AbortController()
    abortController.value = controller
    stage.value = 'planning'
    planningMode.value = 'budget'
    loadingStep.value = '正在重新估算费用（含高速费）'
    try {
      planResult.value = await regenerateBudgetOnly(buildPlanParams(), planResult.value, aiConfig.value, controller.signal)
      stage.value = 'planned'
    } catch (e) {
      error.value = e instanceof Error ? e.message : '重新估算失败'
      stage.value = 'error'
    } finally {
      loadingStep.value = ''
      planningMode.value = 'idle'
      abortController.value = null
    }
  }

  async function hydrateImagesNow() {
    if (!planResult.value || hydratingImages.value) return
    const spotCount = [
      ...(planResult.value.scenicSpotSummary || []),
      ...(planResult.value.dailyPlans || []).flatMap((d) => d.scenicSpots || []),
      ...(planResult.value.selectedScenicSpots || []),
    ].filter((s) => s?.name).length
    if (!spotCount) {
      ElMessage.warning('当前攻略几乎没有景区点，无法补全图片。请确认已生成每日细行程。')
      return
    }

    hydratingImages.value = true
    planningMode.value = 'images'
    stage.value = 'planning'
    loadingStep.value = `正在补全景区图片 0/${spotCount}`
    try {
      planResult.value = await hydrateGuideImages(planResult.value, (s) => { loadingStep.value = s })
      stage.value = 'planned'
      ElMessage.success('景区图片已补全（无可靠来源的会显示占位）')
    } catch (e) {
      error.value = e instanceof Error ? e.message : '图片抓取失败'
      stage.value = 'error'
      ElMessage.error(error.value)
    } finally {
      hydratingImages.value = false
      planningMode.value = 'idle'
      loadingStep.value = ''
    }
  }

  function addDeparture() {
    departurePoints.value.push(emptyDeparture())
  }

  function removeDeparture(id: string) {
    if (departurePoints.value.length <= 1) {
      error.value = '至少保留一个出发地'
      return
    }
    departurePoints.value = departurePoints.value.filter((d) => d.id !== id)
  }

  function resetAll() {
    abortController.value?.abort()
    stage.value = hasApiKey.value ? 'input' : 'needApiKey'
    travelDays.value = 3
    customDays.value = 3
    useCustomDays.value = false
    departurePoints.value = [emptyDeparture()]
    travelThemes.value = ['海边度假', '美食打卡', '摄影出片']
    budgetLevel.value = 'medium'
    pace.value = 'normal'
    withChildren.value = false
    withElderly.value = false
    avoidCrowded.value = false
    preferNaturalScenery.value = true
    preferFood.value = true
    preferPhotoSpot.value = true
    preferFreeSpots.value = false
    preferParks.value = false
    preferCamping.value = false
    preferLakeside.value = false
    preferForest.value = false
    preferCityWalk.value = false
    preferLowCost.value = false
    avoidTicketsExpensive.value = false
    preferDriveToSpot.value = false
    preferRiverside.value = false
    preferWaterPlay.value = false
    preferWildSpot.value = false
    preferEasyParking.value = false
    maxWalkDistance.value = '0-500米'
    specialPlaceHint.value = ''
    customDailyEvents.value = []
    accommodationMode.value = 'auto'
    homeBaseAddress.value = ''
    maxReturnDistanceKm.value = 80
    maxReturnDuration.value = '1.5小时'
    accommodationNote.value = ''
    hotelDays.value = []
    hotelDayReason.value = '洗衣洗烘，补充补给'
    destinationIntent.value = defaultDestinationIntent()
    startDate.value = defaultTravelStartDate()
    planMode.value = 'simple'
    remindBeforeMinutes.value = 15
    fetchScenicImages.value = false
    outlineRevisionNote.value = ''
    planningMode.value = 'idle'
    weatherFetched.value = false
    planResult.value = null
    generationState.value = emptyGenerationState()
    error.value = ''
    errorDetail.value = ''
    failedStep.value = null
    failedDay.value = null
    rawResponse.value = ''
    showRawResponse.value = false
    lastFailedAction.value = null
  }

  if (!hasApiKey.value) {
    stage.value = 'needApiKey'
  }

  return {
    stage,
    loadingStep,
    error,
    errorDetail,
    isPlanning,
    isPlanParseError,
    canGenerate,
    guideReady,
    outlineReady,
    currentOutline,
    failedStep,
    failedDay,
    rawResponse,
    showRawResponse,
    aiConfig,
    hasApiKey,
    configDialogVisible,
    saveConfig,
    travelDays,
    customDays,
    useCustomDays,
    effectiveDays,
    peopleTotal,
    departurePoints,
    travelThemes,
    budgetLevel,
    pace,
    withChildren,
    withElderly,
    avoidCrowded,
    preferNaturalScenery,
    preferFood,
    preferPhotoSpot,
    preferFreeSpots,
    preferParks,
    preferCamping,
    preferLakeside,
    preferForest,
    preferCityWalk,
    preferLowCost,
    avoidTicketsExpensive,
    preferDriveToSpot,
    preferRiverside,
    preferWaterPlay,
    preferWildSpot,
    preferEasyParking,
    maxWalkDistance,
    specialPlaceHint,
    customDailyEvents,
    accommodationMode,
    homeBaseAddress,
    maxReturnDistanceKm,
    maxReturnDuration,
    accommodationNote,
    hotelDays,
    hotelDayReason,
    destinationIntent,
    startDate,
    planMode,
    remindBeforeMinutes,
    fetchScenicImages,
    hydratingImages,
    outlineRevisionNote,
    planningMode,
    weatherFetched,
    generationState,
    planResult,
    planRoute,
    planOutline,
    reviseOutline,
    confirmOutlineAndGenerateDetail,
    stopGeneration,
    retryCurrentStep,
    retryFromStart,
    retryFailedDay,
    addDeparture,
    removeDeparture,
    resetAll,
    retryLastRequest,
    regenerateBudget,
    regenerateDailyDetails,
    hydrateImagesNow,
  }
}
