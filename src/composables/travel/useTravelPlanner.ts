import { computed, ref } from 'vue'
import { PlanStepError, planRouteByAi, regenerateBudgetOnly } from '@/services/travelAiApi'
import { getTravelWeather } from '@/api/travelWeather'
import { defaultTravelStartDate } from '@/services/travelWeatherCore'
import { AiRequestError } from '@/services/travelAiChat'
import { useAiModelConfig } from '@/composables/travel/useAiModelConfig'
import type {
  DeparturePoint,
  DestinationIntent,
  DetailedTravelGuide,
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
  const accommodationMode = ref<'auto' | 'homeEveryDay' | 'hotelNeeded' | 'campingOrCar' | 'noHotelPreferred'>('auto')
  const homeBaseAddress = ref('')
  const maxReturnDistanceKm = ref(80)
  const maxReturnDuration = ref('1.5小时')
  const accommodationNote = ref('')

  const destinationIntent = ref<DestinationIntent>(defaultDestinationIntent())
  const planResult = ref<DetailedTravelGuide | null>(null)
  const startDate = ref(defaultTravelStartDate())
  const planMode = ref<PlanMode>('simple')
  const remindBeforeMinutes = ref(15)

  const effectiveDays = computed(() => (useCustomDays.value ? customDays.value : travelDays.value))
  const peopleTotal = computed(() =>
    departurePoints.value.reduce((s, d) => s + d.peopleCount, 0),
  )
  const isPlanning = computed(() => stage.value === 'planning')
  const isPlanParseError = computed(() => !!failedStep.value)
  const guideReady = computed(() => !!planResult.value)
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

  function buildPlanParams() {
    return {
      departurePoints: departurePoints.value,
      destinationIntent: destinationIntent.value,
      travelDays: effectiveDays.value,
      startDate: startDate.value,
      planMode: planMode.value,
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
      accommodationPreference: {
        mode: accommodationMode.value,
        homeBaseAddress: homeBaseAddress.value || departurePoints.value[0]?.address || '',
        maxReturnDistanceKm: maxReturnDistanceKm.value,
        maxReturnDuration: maxReturnDuration.value,
        note: accommodationNote.value,
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
    stage.value = generationState.value.outline ? 'error' : 'input'
    error.value = '已停止生成'
    errorDetail.value = ''
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
      const weatherList = await getTravelWeather({
        city: destinationIntent.value.destinationText,
        startDate: startDate.value,
        days: effectiveDays.value,
      })

      planResult.value = await planRouteByAi(
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
      stage.value = 'planned'
      lastFailedAction.value = null
      failedStep.value = null
      failedDay.value = null
      rawResponse.value = ''
    } catch (e) {
      if (e instanceof Error && e.message === '已停止生成') {
        error.value = '已停止生成'
        stage.value = generationState.value.outline ? 'error' : 'input'
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
      stage.value = 'error'
    } finally {
      loadingStep.value = ''
      abortController.value = null
    }
  }

  async function planRoute() {
    await runPlan({ fromStart: true })
  }

  async function retryCurrentStep() {
    await runPlan({ retryStep: true })
  }

  async function retryFromStart() {
    await runPlan({ fromStart: true })
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

  async function regenerateBudget() {
    if (!planResult.value) return
    if (!ensureApiKey()) return
    abortController.value?.abort()
    const controller = new AbortController()
    abortController.value = controller
    stage.value = 'planning'
    loadingStep.value = '正在重新估算费用'
    try {
      planResult.value = await regenerateBudgetOnly(buildPlanParams(), planResult.value, aiConfig.value, controller.signal)
      stage.value = 'planned'
    } catch (e) {
      error.value = e instanceof Error ? e.message : '重新估算失败'
      stage.value = 'error'
    } finally {
      loadingStep.value = ''
      abortController.value = null
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
    accommodationMode.value = 'auto'
    homeBaseAddress.value = ''
    maxReturnDistanceKm.value = 80
    maxReturnDuration.value = '1.5小时'
    accommodationNote.value = ''
    destinationIntent.value = defaultDestinationIntent()
    startDate.value = defaultTravelStartDate()
    planMode.value = 'simple'
    remindBeforeMinutes.value = 15
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
    accommodationMode,
    homeBaseAddress,
    maxReturnDistanceKm,
    maxReturnDuration,
    accommodationNote,
    destinationIntent,
    startDate,
    planMode,
    remindBeforeMinutes,
    planResult,
    planRoute,
    stopGeneration,
    retryCurrentStep,
    retryFromStart,
    retryFailedDay,
    addDeparture,
    removeDeparture,
    resetAll,
    retryLastRequest,
    regenerateBudget,
  }
}
