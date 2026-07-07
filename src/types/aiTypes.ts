export type MessageRole = 'system' | 'user' | 'assistant' | 'tool'
export type MessageStatus = 'idle' | 'loading' | 'generating' | 'done' | 'error'
export type AgentStepStatus = 'pending' | 'running' | 'success' | 'error'
export type SmsAuditStatus = 'empty' | 'pending' | 'modified' | 'confirmed'
export type AiProvider = 'openai' | 'qwen' | 'zhipu' | 'deepseek' | 'mock'

export interface RagReference {
  id: string
  title: string
  fileName: string
  content: string
  score: number
  sourceType: string
}

export interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown>
  result?: unknown
  status: AgentStepStatus
  error?: string
}

export interface AgentStep {
  id: string
  title: string
  description: string
  status: AgentStepStatus
  toolCall?: ToolCall
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  createdAt: number
  status: MessageStatus
  references?: RagReference[]
}

export interface ChatRequest {
  messages: Array<{ role: MessageRole; content: string }>
  model: string
  stream?: boolean
  tools?: Array<{ type: 'function'; function: { name: string; description: string } }>
}

export interface ChatResponse {
  content: string
  references?: RagReference[]
}

export interface AiReportTableRow {
  area: string
  weatherType: string
  riskLevel: string
  timeRange: string
  suggestion: string
}

export interface AiReportChartItem {
  name: string
  value: number
}

export interface AiReport {
  title: string
  summary: string
  riskLevel: string
  affectedAreas: string[]
  timeRange: string
  table: AiReportTableRow[]
  chartData: AiReportChartItem[]
  suggestion: string
}

export interface SmsForm {
  region: string
  target: string
  weatherType: string
  timeRange: string
  riskLevel: string
  remark: string
}

export interface ProviderConfig {
  provider: AiProvider
  baseURL: string
  apiKey: string
  modelName: string
}

export interface WeatherData {
  region: string
  weatherType: string
  riskLevel: string
  timeRange: string
  wind: string
  precipitation: string
  radar: string
  /** 数据查询时间 */
  dataTime: string
  /** 预报/产品发布时间 */
  issueTime: string
}

export interface ServiceTemplate {
  target: string
  template: string
}

export const MAX_CONTEXT_MESSAGES = 10
