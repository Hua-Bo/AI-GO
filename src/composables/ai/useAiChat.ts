import { computed, ref } from 'vue'
import { streamChat, getDefaultProviderConfig, mockStreamChat } from '@/api/aiApi'
import { MOCK_REFERENCES, buildMockAgentReply, buildAgentToolContext, mockChatReply } from '@/composables/ai/agentMock'
import { useSseStream } from '@/composables/ai/useSseStream'
import { useAgentTools } from '@/composables/ai/useAgentTools'
import type {
  AiProvider,
  ChatMessage,
  ProviderConfig,
  SmsForm,
} from '@/types/aiTypes'
import { MAX_CONTEXT_MESSAGES } from '@/types/aiTypes'
import { buildSystemPrompt } from '@/utils/datetime'

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** 仅「生成服务材料」类问题才走 Agent 工具链 */
function isAgentIntent(text: string) {
  if (/生成|出具|编制|起草/.test(text) && /短信|内参|报告/.test(text)) return true
  if (/服务短信|内参报告|服务材料/.test(text)) return true
  if (/强对流/.test(text) && /短信|报告|服务|内参/.test(text)) return true
  if (/查询.*风险|风险提示|风险预警/.test(text)) return true
  return false
}

function buildApiMessages(messages: ChatMessage[], injectedContext?: string) {
  const nonSystem = messages.filter(
    (m) =>
      m.role !== 'system'
      && !(m.role === 'assistant' && !m.content.trim() && m.status !== 'done'),
  )
  const recent = nonSystem.slice(-MAX_CONTEXT_MESSAGES)
  const api = [
    { role: 'system' as const, content: buildSystemPrompt() },
    ...recent.map((m) => ({ role: m.role, content: m.content })),
  ]
  if (injectedContext) {
    api.push({ role: 'user' as const, content: injectedContext })
  }
  return api
}

export function useAiChat() {
  const messages = ref<ChatMessage[]>([
    {
      id: uid(),
      role: 'system',
      content: buildSystemPrompt(),
      createdAt: Date.now(),
      status: 'done',
    },
  ])
  const sessionTitle = ref('新会话')
  const providerConfig = ref<ProviderConfig>(getDefaultProviderConfig('mock'))
  const inputText = ref('')

  const sse = useSseStream()
  const agent = useAgentTools()

  const smsForm = ref<SmsForm>({
    region: '无锡市',
    target: '行业用户',
    weatherType: '强对流天气',
    timeRange: '今日 14:00—20:00',
    riskLevel: '橙色',
    remark: '',
  })
  const smsContent = ref('')
  const smsAuditStatus = ref<'empty' | 'pending' | 'modified' | 'confirmed'>('empty')
  const resultLinkedQuery = ref('')
  const resultMode = ref<'empty' | 'agent' | 'chat'>('empty')

  const visibleMessages = computed(() =>
    messages.value.filter((m) => m.role !== 'system'),
  )

  const contextMessages = computed(() => {
    const nonSystem = messages.value.filter((m) => m.role !== 'system')
    const recent = nonSystem.slice(-MAX_CONTEXT_MESSAGES)
    const system = messages.value.find((m) => m.role === 'system')
    return system ? [system, ...recent] : recent
  })

  function setProvider(provider: AiProvider) {
    providerConfig.value = getDefaultProviderConfig(provider)
  }

  function updateProviderConfig(patch: Partial<ProviderConfig>) {
    providerConfig.value = { ...providerConfig.value, ...patch }
  }

  function clearResultWorkspace() {
    agent.clearResults()
    smsContent.value = ''
    smsAuditStatus.value = 'empty'
    resultLinkedQuery.value = ''
    resultMode.value = 'empty'
  }

  function clearContext() {
    messages.value = messages.value.filter((m) => m.role === 'system')
    sessionTitle.value = '新会话'
    clearResultWorkspace()
  }

  async function sendMessage(text?: string) {
    const content = (text ?? inputText.value).trim()
    if (!content || sse.streamState.value === 'generating') return

    if (sessionTitle.value === '新会话') {
      sessionTitle.value = content.slice(0, 24)
    }

    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      content,
      createdAt: Date.now(),
      status: 'done',
    }
    messages.value.push(userMsg)
    inputText.value = ''

    const assistantMsg: ChatMessage = {
      id: uid(),
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      status: 'loading',
      references: [],
    }
    messages.value.push(assistantMsg)
    const assistantId = assistantMsg.id

    const controller = sse.startStream()

    const appendDelta = (delta: string) => {
      const msg = messages.value.find((m) => m.id === assistantId)
      if (!msg) return
      msg.content += delta
      if (msg.status === 'loading') msg.status = 'generating'
    }

    try {
      const runAgent = isAgentIntent(content)
      const isMock = providerConfig.value.provider === 'mock'

      if (runAgent) {
        sse.markGenerating()
        assistantMsg.status = 'generating'
        resultLinkedQuery.value = content
        resultMode.value = 'agent'
        const result = await agent.runToolChain(content)
        if (result) {
          smsForm.value = result.smsForm
          smsContent.value = result.sms
          smsAuditStatus.value = 'pending'
          agent.generatedReport.value = result.report
        }
        const msg = messages.value.find((m) => m.id === assistantId)
        if (msg) msg.references = MOCK_REFERENCES

        if (isMock && result) {
          const replyText = buildMockAgentReply(content, result.smsForm)
          await mockStreamChat(appendDelta, controller.signal, replyText)
        } else if (!isMock && result) {
          const toolContext = buildAgentToolContext(
            content,
            result.smsForm,
            result.sms,
            result.report?.title,
          )
          await streamChat(
            providerConfig.value,
            {
              messages: buildApiMessages(messages.value, toolContext),
              model: providerConfig.value.modelName,
            },
            controller.signal,
            (delta) => {
              sse.markGenerating()
              appendDelta(delta)
            },
          )
          const msgAfter = messages.value.find((m) => m.id === assistantId)
          if (msgAfter) msgAfter.references = MOCK_REFERENCES
        }
      } else {
        clearResultWorkspace()
        resultLinkedQuery.value = content
        resultMode.value = 'chat'
        sse.markGenerating()
        const msg = messages.value.find((m) => m.id === assistantId)
        if (msg) msg.status = 'generating'
        if (isMock) {
          await mockStreamChat(appendDelta, controller.signal, mockChatReply(content))
        } else {
          await streamChat(
            providerConfig.value,
            {
              messages: buildApiMessages(messages.value),
              model: providerConfig.value.modelName,
            },
            controller.signal,
            appendDelta,
          )
        }
      }
      const finalMsg = messages.value.find((m) => m.id === assistantId)
      if (finalMsg) {
        if (!finalMsg.content.trim()) {
          finalMsg.content = '模型未返回内容，请检查模型名称或 API 配置后重试。'
        }
        finalMsg.status = 'done'
      }
      sse.finishStream()
    } catch (e) {
      const errMsg = messages.value.find((m) => m.id === assistantId)
      if (e instanceof DOMException && e.name === 'AbortError') {
        if (errMsg) {
          errMsg.status = 'done'
          errMsg.content += '\n\n*[已停止生成]*'
        }
        sse.stopStream()
        return
      }
      if (errMsg) {
        errMsg.status = 'error'
        errMsg.content = e instanceof Error ? e.message : '生成失败，请稍后重试'
      }
      sse.failStream(errMsg?.content || '生成失败')
    }
  }

  function stopGenerate() {
    sse.stopStream()
  }

  async function regenerate() {
    const lastUser = [...messages.value].reverse().find((m) => m.role === 'user')
    if (!lastUser) return
    const lastAssistant = [...messages.value].reverse().find((m) => m.role === 'assistant')
    if (lastAssistant) {
      const idx = messages.value.findIndex((m) => m.id === lastAssistant.id)
      if (idx >= 0) messages.value.splice(idx, 1)
    }
    await sendMessage(lastUser.content)
  }

  async function generateSmsFromForm() {
    const template = `【气象服务提醒】${smsForm.value.region}${smsForm.value.timeRange}将出现${smsForm.value.weatherType}，风险等级${smsForm.value.riskLevel}。${smsForm.value.remark}`.trim()
    smsContent.value = template
    smsAuditStatus.value = 'pending'
  }

  return {
    messages,
    visibleMessages,
    sessionTitle,
    providerConfig,
    inputText,
    sse,
    agent,
    smsForm,
    smsContent,
    smsAuditStatus,
    resultLinkedQuery,
    resultMode,
    setProvider,
    updateProviderConfig,
    clearContext,
    sendMessage,
    stopGenerate,
    regenerate,
    generateSmsFromForm,
  }
}
