<script setup lang="ts">
import { computed } from 'vue'
import { useAiChat } from '@/composables/ai/useAiChat'
import ChatPanel from '@/components/ai/ChatPanel.vue'
import AgentStepPanel from '@/components/ai/AgentStepPanel.vue'
import ResultWorkspacePanel from '@/components/ai/ResultWorkspacePanel.vue'
import ProviderSelector from '@/components/ai/ProviderSelector.vue'
import '@/styles/agent-theme.css'

const {
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
  clearContext,
  sendMessage,
  stopGenerate,
  regenerate,
  generateSmsFromForm,
} = useAiChat()

const agentSteps = agent.steps
const report = agent.generatedReport

const generating = computed(() =>
  sse.streamState.value === 'loading' || sse.streamState.value === 'generating',
)

const pageStatus = computed(() => {
  if (sse.streamState.value === 'error') return { text: '异常', type: 'danger' as const }
  if (generating.value) return { text: '生成中', type: 'warning' as const }
  if (agent.steps.value.some((s) => s.status === 'success')) return { text: '已完成', type: 'success' as const }
  return { text: '待命', type: 'info' as const }
})

const modeLabel = computed(() =>
  providerConfig.value.provider === 'mock' ? 'Mock' : 'API',
)

async function onRetryTool(name: string) {
  const lastUser = [...visibleMessages.value].reverse().find((m) => m.role === 'user')
  await agent.retryTool(name, lastUser?.content || '')
  if (agent.generatedSms.value) {
    smsContent.value = agent.generatedSms.value
    smsAuditStatus.value = 'pending'
  }
}

function onQuickAsk(text: string) {
  inputText.value = text
  sendMessage(text)
}
</script>

<template>
  <div class="ai-agent-page">
    <header class="workbench-header">
      <div class="header-left">
        <h1>行业服务智能体</h1>
        <p class="subtitle">强对流短信生成 · 内参报告 · Agent 工具调用 · RAG 引用</p>
      </div>
      <div class="header-right">
        <ProviderSelector v-model="providerConfig" compact />
        <el-tag size="small" type="info" effect="plain">模式 {{ modeLabel }}</el-tag>
        <el-tag size="small" :type="pageStatus.type" effect="dark">{{ pageStatus.text }}</el-tag>
        <el-button size="small" @click="clearContext()">清空上下文</el-button>
      </div>
    </header>

    <div class="workbench-body">
      <aside class="col col-chat">
        <ChatPanel
          v-model:input-text="inputText"
          :messages="visibleMessages"
          :session-title="sessionTitle"
          :generating="generating"
          @send="sendMessage()"
          @stop="stopGenerate()"
          @regenerate="regenerate()"
          @quick-ask="onQuickAsk"
        />
      </aside>

      <aside class="col col-agent">
        <AgentStepPanel
          :steps="agentSteps"
          :linked-query="resultLinkedQuery"
          :result-mode="resultMode"
          @retry-tool="onRetryTool"
        />
      </aside>

      <aside class="col col-result">
        <ResultWorkspacePanel
          v-model:form="smsForm"
          v-model:content="smsContent"
          v-model:audit-status="smsAuditStatus"
          v-model="report"
          :linked-query="resultLinkedQuery"
          :result-mode="resultMode"
          @generate-sms="generateSmsFromForm()"
          @regenerate-sms="generateSmsFromForm()"
        />
      </aside>
    </div>

    <div v-if="sse.streamError.value" class="error-bar">
      {{ sse.streamError.value }}
    </div>
  </div>
</template>

<style scoped>
.ai-agent-page {
  min-height: 100vh;
  background: var(--agent-bg);
  color: var(--agent-text);
  display: flex;
  flex-direction: column;
}

.workbench-header {
  height: var(--agent-header-h);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: var(--agent-panel);
  border-bottom: 1px solid var(--agent-border);
  gap: 16px;
}

.header-left h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.subtitle {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--agent-text-secondary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.workbench-body {
  flex: 1;
  display: grid;
  grid-template-columns: 34fr 28fr 38fr;
  min-height: 0;
  height: calc(100vh - var(--agent-header-h));
}

.col {
  min-height: 0;
  overflow: hidden;
  background: var(--agent-panel);
}

.col-chat {
  border-right: 1px solid var(--agent-border);
}

.col-agent {
  border-right: 1px solid var(--agent-border);
}

.error-bar {
  padding: 8px 20px;
  background: rgba(239, 68, 68, 0.15);
  border-top: 1px solid rgba(239, 68, 68, 0.3);
  color: #fecaca;
  font-size: 13px;
}

@media (max-width: 1280px) {
  .workbench-body {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    height: auto;
    min-height: calc(100vh - var(--agent-header-h));
  }

  .col-chat {
    grid-column: 1 / 2;
    grid-row: 1 / 3;
    min-height: 70vh;
  }

  .col-agent {
    grid-column: 2;
    grid-row: 1;
    max-height: 45vh;
  }

  .col-result {
    grid-column: 2;
    grid-row: 2;
    max-height: 45vh;
  }
}

@media (max-width: 900px) {
  .workbench-body {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }

  .col-chat,
  .col-agent,
  .col-result {
    grid-column: 1;
    grid-row: auto;
    max-height: none;
    min-height: 50vh;
    border-right: none;
    border-bottom: 1px solid var(--agent-border);
  }
}
</style>
