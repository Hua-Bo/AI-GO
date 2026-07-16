export type AgriStatus = 'normal' | 'attention' | 'danger'

export interface AnalysisResult {
  status: AgriStatus
  statusText: string
  summary: string[]
  todayActions: string[]
  nextCheck: string
  riskWarning?: string
  needMorePhotos: boolean
  photoTips: string[]
}

export interface CropProfile {
  id: string
  name: string
  plantDate: string
  growType: 'greenhouse' | 'open' | ''
  area: string
  region: string
  updatedAt: string
}

export interface TodayTask {
  id: string
  title: string
  done: boolean
  remindLater: boolean
  recordId?: string
}

export interface AgriRecord {
  id: string
  date: string
  cropName: string
  thumbUrl?: string
  title: string
  status: AgriStatus
  statusText: string
  description?: string
  result?: AnalysisResult
  images?: string[]
}

export interface AnalyzeRequest {
  cropId?: string
  description: string
  images: string[]
}

export interface ApiResponse<T> {
  code: number
  message?: string
  data: T
}
