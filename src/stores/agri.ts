import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AnalysisResult, AgriRecord, CropProfile, TodayTask } from '@/types/agri'
import {
  analyzeCrop,
  emptyCropProfile,
  fetchRecordDetail,
  fetchRecords,
  fetchTodayTasks,
  saveCropProfile as saveCropProfileApi,
} from '@/api/agri'

const CROP_KEY = 'agri_crop_profile'
const TASK_KEY = 'agri_today_tasks'
const RECORD_KEY = 'agri_records'

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export const useAgriStore = defineStore('agri', () => {
  const crop = ref<CropProfile>(loadJson(CROP_KEY, emptyCropProfile()))
  const voiceText = ref('')
  const photos = ref<string[]>([])
  const analyzing = ref(false)
  const analyzeError = ref('')
  const result = ref<AnalysisResult | null>(null)
  const tasks = ref<TodayTask[]>(loadJson(TASK_KEY, []))
  const records = ref<AgriRecord[]>(loadJson(RECORD_KEY, []))
  const currentRecordId = ref('')

  const hasCropProfile = computed(() => Boolean(crop.value.name?.trim()))
  const greeting = computed(() => {
    const h = new Date().getHours()
    if (h < 11) return '早上好'
    if (h < 14) return '中午好'
    if (h < 18) return '下午好'
    return '晚上好'
  })

  function persistCrop() {
    localStorage.setItem(CROP_KEY, JSON.stringify(crop.value))
  }
  function persistTasks() {
    localStorage.setItem(TASK_KEY, JSON.stringify(tasks.value))
  }
  function persistRecords() {
    localStorage.setItem(RECORD_KEY, JSON.stringify(records.value))
  }

  function setVoiceText(text: string) {
    voiceText.value = text
  }

  function setPhotos(urls: string[]) {
    photos.value = urls.slice(0, 5)
  }

  function clearInput() {
    voiceText.value = ''
    photos.value = []
    analyzeError.value = ''
  }

  async function runAnalyze() {
    analyzing.value = true
    analyzeError.value = ''
    result.value = null
    try {
      const data = await analyzeCrop({
        cropId: crop.value.id,
        description: voiceText.value,
        images: photos.value,
      })
      result.value = data
      const record: AgriRecord = {
        id: `r_${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        cropName: crop.value.name || '未命名作物',
        title: clipTitle(voiceText.value || '拍照查看作物'),
        status: data.status,
        statusText: data.statusText,
        thumbUrl: photos.value[0] || '',
        description: voiceText.value,
        result: data,
        images: [...photos.value],
      }
      records.value = [record, ...records.value].slice(0, 50)
      currentRecordId.value = record.id
      persistRecords()

      const fromActions = data.todayActions.map((title, i) => ({
        id: `t_${Date.now()}_${i}`,
        title,
        done: false,
        remindLater: false,
        recordId: record.id,
      }))
      tasks.value = fromActions.slice(0, 3)
      persistTasks()
      return data
    } catch (e) {
      analyzeError.value = e instanceof Error ? e.message : '暂时没有分析出来'
      throw e
    } finally {
      analyzing.value = false
    }
  }

  async function loadTasks() {
    if (tasks.value.length) return tasks.value
    tasks.value = await fetchTodayTasks()
    persistTasks()
    return tasks.value
  }

  async function loadRecords() {
    if (records.value.length) return records.value
    records.value = await fetchRecords()
    persistRecords()
    return records.value
  }

  async function loadRecord(id: string) {
    const local = records.value.find((r) => r.id === id)
    if (local) return local
    return await fetchRecordDetail(id)
  }

  function toggleTaskDone(id: string) {
    const t = tasks.value.find((x) => x.id === id)
    if (!t) return
    t.done = !t.done
    persistTasks()
  }

  function remindTaskLater(id: string) {
    const t = tasks.value.find((x) => x.id === id)
    if (!t) return
    t.remindLater = true
    persistTasks()
  }

  async function updateCrop(partial: Partial<CropProfile>) {
    crop.value = {
      ...crop.value,
      ...partial,
      updatedAt: new Date().toISOString(),
    }
    persistCrop()
    await saveCropProfileApi(crop.value)
  }

  return {
    crop,
    voiceText,
    photos,
    analyzing,
    analyzeError,
    result,
    tasks,
    records,
    currentRecordId,
    hasCropProfile,
    greeting,
    setVoiceText,
    setPhotos,
    clearInput,
    runAnalyze,
    loadTasks,
    loadRecords,
    loadRecord,
    toggleTaskDone,
    remindTaskLater,
    updateCrop,
  }
})

function clipTitle(text: string) {
  const t = text.trim() || '种植检查'
  return t.length > 18 ? `${t.slice(0, 18)}…` : t
}
