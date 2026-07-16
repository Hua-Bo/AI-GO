import type { AnalysisResult, AgriRecord, AnalyzeRequest, ApiResponse, CropProfile, TodayTask } from '@/types/agri'
import {
  defaultCropProfile,
  mockAnalysisResult,
  mockRecords,
  mockTodayTasks,
} from '@/mock/agri'
import { callAiChatJson } from '@/services/travelAiChat'
import { loadAiConfig } from '@/utils/travelAiConfigStorage'

const USE_MOCK = String(import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false'
const API_BASE = String(import.meta.env.VITE_API_BASE_URL || '/api')

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function clip(text: string, max = 24) {
  const t = String(text || '').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

export function normalizeAnalysisResult(raw: Partial<AnalysisResult> | null | undefined): AnalysisResult {
  const status = raw?.status === 'normal' || raw?.status === 'danger' ? raw.status : 'attention'
  const statusMap = { normal: '正常', attention: '需要注意', danger: '风险较高' } as const
  return {
    status,
    statusText: clip(raw?.statusText || statusMap[status], 8),
    summary: (raw?.summary || []).map((s) => clip(s, 28)).filter(Boolean).slice(0, 2),
    todayActions: (raw?.todayActions || []).map((s) => clip(s, 20)).filter(Boolean).slice(0, 3),
    nextCheck: clip(raw?.nextCheck || '明天再看一次', 24),
    riskWarning: raw?.riskWarning ? clip(raw.riskWarning, 40) : '',
    needMorePhotos: Boolean(raw?.needMorePhotos),
    photoTips: (raw?.photoTips || []).map((s) => clip(s, 16)).filter(Boolean).slice(0, 3),
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`, init)
  if (!res.ok) throw new Error(`请求失败 ${res.status}`)
  return await res.json() as ApiResponse<T>
}

/** 语音转文字：优先 Web Speech / Mock，保留统一接口形态 */
export async function transcribeAudio(_audio?: Blob): Promise<string> {
  if (USE_MOCK) {
    await sleep(800)
    return '甜瓜叶子发黄，前两天下过雨，现在有些叶子边缘发干。'
  }
  const form = new FormData()
  if (_audio) form.append('audio', _audio, 'voice.webm')
  const res = await request<{ text: string }>('/speech/transcribe', { method: 'POST', body: form })
  if (res.code !== 0) throw new Error(res.message || '语音识别失败')
  return res.data.text
}

/** 图片转本地可预览 dataURL（演示阶段代替上传） */
export async function uploadImageFile(file: File): Promise<string> {
  if (USE_MOCK) {
    await sleep(300)
    return await fileToDataUrl(file)
  }
  const form = new FormData()
  form.append('file', file)
  const res = await request<{ url: string }>('/files/upload', { method: 'POST', body: form })
  if (res.code !== 0) throw new Error(res.message || '上传失败')
  return res.data.url
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('图片读取失败'))
    reader.readAsDataURL(file)
  })
}

/** 压缩图片，降低体积 */
export async function compressImage(file: File, maxEdge = 1280, quality = 0.72): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
  if (!blob) return file
  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
}

export async function analyzeCrop(payload: AnalyzeRequest): Promise<AnalysisResult> {
  if (!USE_MOCK) {
    const res = await request<AnalysisResult>('/agriculture/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.code !== 0) throw new Error(res.message || '分析失败')
    return normalizeAnalysisResult(res.data)
  }

  // Mock 环境：若用户已配置旅游页同款 Key，可直连模型；否则返回 mock
  const cfg = loadAiConfig()
  if (cfg.apiKey?.trim()) {
    try {
      const raw = await callAiChatJson<AnalysisResult>({
        config: cfg,
        systemPrompt: `你是农业种植助手，面向中老年农户。只返回 JSON，不要 Markdown。
字段：status(normal|attention|danger), statusText, summary(最多2句), todayActions(最多3条且每条<=20字), nextCheck, riskWarning, needMorePhotos, photoTips。
禁止给出农药配比。涉及农药只说：建议先确认病害，再按农药标签或农技人员指导使用。
语言简单直接。`,
        userPrompt: `作物描述：${payload.description || '未说明'}
图片数量：${payload.images.length}
请给出分析结果 JSON。`,
      })
      return normalizeAnalysisResult(raw)
    } catch {
      // 失败时回落 mock，保证可演示
    }
  }

  await sleep(1800)
  const base = { ...mockAnalysisResult }
  if (!payload.description && payload.images.length === 0) {
    base.summary = ['还看不太清问题。', '请再说一次或再拍一张。']
    base.todayActions = ['重新说一次问题', '靠近拍一张叶子']
    base.needMorePhotos = true
  } else if (payload.images.length === 0) {
    base.needMorePhotos = true
    base.photoTips = ['拍叶片正面', '拍叶片背面']
  }
  return normalizeAnalysisResult(base)
}

export async function fetchTodayTasks(): Promise<TodayTask[]> {
  if (USE_MOCK) {
    await sleep(200)
    return mockTodayTasks.map((t) => ({ ...t }))
  }
  const res = await request<TodayTask[]>('/tasks/today')
  if (res.code !== 0) throw new Error(res.message || '获取任务失败')
  return res.data
}

export async function fetchRecords(): Promise<AgriRecord[]> {
  if (USE_MOCK) {
    await sleep(200)
    return mockRecords.map((r) => ({ ...r }))
  }
  const res = await request<AgriRecord[]>('/records')
  if (res.code !== 0) throw new Error(res.message || '获取记录失败')
  return res.data
}

export async function fetchRecordDetail(id: string): Promise<AgriRecord | null> {
  if (USE_MOCK) {
    await sleep(150)
    return mockRecords.find((r) => r.id === id) || null
  }
  const res = await request<AgriRecord>(`/records/${id}`)
  if (res.code !== 0) throw new Error(res.message || '获取详情失败')
  return res.data
}

export async function saveCropProfile(profile: CropProfile): Promise<CropProfile> {
  if (USE_MOCK) {
    await sleep(200)
    return { ...profile, updatedAt: new Date().toISOString() }
  }
  const res = await request<CropProfile>('/crop/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })
  if (res.code !== 0) throw new Error(res.message || '保存失败')
  return res.data
}

export function emptyCropProfile(): CropProfile {
  return { ...defaultCropProfile, id: `crop_${Date.now()}` }
}
