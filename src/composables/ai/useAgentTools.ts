import { ref } from 'vue'
import type { AgentStep, AiReport, ToolCall } from '@/types/aiTypes'
import {
  buildSmsFormFromWeather,
  extractRegionFromQuery,
  mockGenerateInternalReport,
  mockGenerateWarningSms,
  mockGetServiceTemplate,
  mockGetWeatherData,
} from '@/composables/ai/agentMock'

const TOOL_DEFS = [
  { name: 'getWeatherData', title: '查询天气数据', description: '正在查询天气数据…' },
  { name: 'getServiceTemplate', title: '读取短信模板', description: '正在读取短信模板…' },
  { name: 'generateWarningSms', title: '生成服务短信', description: '正在生成服务短信…' },
  { name: 'generateInternalReport', title: '生成内参报告', description: '正在生成内参报告…' },
] as const

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function createStep(toolName: typeof TOOL_DEFS[number]['name'], index: number): AgentStep {
  const def = TOOL_DEFS.find((t) => t.name === toolName)!
  return {
    id: `step-${toolName}-${index}`,
    title: def.title,
    description: def.description,
    status: 'pending',
    toolCall: {
      id: `tool-${toolName}`,
      name: toolName,
      args: {},
      status: 'pending',
    },
  }
}

export function useAgentTools() {
  const steps = ref<AgentStep[]>([])
  const generatedSms = ref('')
  const generatedReport = ref<AiReport | null>(null)
  const running = ref(false)

  function resetSteps() {
    steps.value = TOOL_DEFS.map((t, i) => createStep(t.name, i))
    generatedSms.value = ''
    generatedReport.value = null
  }

  function clearResults() {
    steps.value = []
    generatedSms.value = ''
    generatedReport.value = null
  }

  function updateStep(name: string, patch: Partial<AgentStep>, toolPatch?: Partial<ToolCall>) {
    const step = steps.value.find((s) => s.toolCall?.name === name)
    if (!step || !step.toolCall) return
    Object.assign(step, patch)
    Object.assign(step.toolCall, toolPatch)
  }

  async function runToolChain(userInput: string) {
    running.value = true
    resetSteps()

    const region = extractRegionFromQuery(userInput)
    let weather = mockGetWeatherData(region, userInput)

    try {
      updateStep('getWeatherData', { status: 'running', description: '正在查询天气数据…' }, { status: 'running', args: { region } })
      await sleep(600)
      weather = mockGetWeatherData(region, userInput)
      updateStep('getWeatherData', { status: 'success', description: '天气数据查询完成' }, { status: 'success', result: weather })

      updateStep('getServiceTemplate', { status: 'running' }, { status: 'running', args: { target: '行业用户' } })
      await sleep(500)
      const template = mockGetServiceTemplate('行业用户')
      updateStep('getServiceTemplate', { status: 'success', description: '短信模板读取完成' }, { status: 'success', result: template })

      updateStep('generateWarningSms', { status: 'running' }, { status: 'running', args: { weather, template } })
      await sleep(700)
      generatedSms.value = mockGenerateWarningSms(weather, template)
      updateStep('generateWarningSms', { status: 'success', description: '服务短信已生成' }, { status: 'success', result: generatedSms.value })

      updateStep('generateInternalReport', { status: 'running' }, { status: 'running', args: { weather } })
      await sleep(800)
      generatedReport.value = mockGenerateInternalReport(weather)
      updateStep('generateInternalReport', { status: 'success', description: '内参报告已生成' }, { status: 'success', result: generatedReport.value })
    } catch (e) {
      const failed = steps.value.find((s) => s.status === 'running')
      if (failed?.toolCall) {
        failed.status = 'error'
        failed.toolCall.status = 'error'
        failed.toolCall.error = e instanceof Error ? e.message : '工具调用失败'
      }
      throw e
    } finally {
      running.value = false
    }

    return {
      sms: generatedSms.value,
      report: generatedReport.value,
      smsForm: buildSmsFormFromWeather(weather),
    }
  }

  async function retryTool(name: string, userInput: string) {
    await runToolChain(userInput || `帮我生成${name}`)
  }

  return {
    steps,
    generatedSms,
    generatedReport,
    running,
    resetSteps,
    clearResults,
    runToolChain,
    retryTool,
  }
}
