<script setup lang="ts">
import type { AgentStep } from '@/types/aiTypes'
import ToolCallCard from './ToolCallCard.vue'

defineProps<{
  steps: AgentStep[]
  linkedQuery?: string
  resultMode?: 'empty' | 'agent' | 'chat'
}>()

const emit = defineEmits<{
  retryTool: [name: string]
}>()

const statusDotClass: Record<string, string> = {
  pending: 'dot-pending',
  running: 'dot-running',
  success: 'dot-success',
  error: 'dot-error',
}
</script>

<template>
  <div class="agent-panel">
    <div class="panel-head">
      <h2>Agent 执行过程</h2>
      <p v-if="resultMode === 'agent' && linkedQuery">
        关联问题：<span class="linked">{{ linkedQuery }}</span>
      </p>
      <p v-else-if="resultMode === 'chat'">当前为对话问答，未触发工具调用</p>
      <p v-else>工具调用步骤与时间线</p>
    </div>

    <div v-if="!steps.length" class="empty-state">
      <div class="empty-icon">◎</div>
      <p v-if="resultMode === 'chat'">普通问答不会执行 Agent 工具链</p>
      <p v-else>发送服务类问题后，Agent 工具调用步骤将在此展示</p>
    </div>

    <div v-else class="timeline">
      <div
        v-for="(step, index) in steps"
        :key="step.id"
        class="timeline-item"
        :class="[`status-${step.status}`, statusDotClass[step.status]]"
      >
        <div class="timeline-rail">
          <span class="dot" />
          <span v-if="index < steps.length - 1" class="line" />
        </div>
        <div class="timeline-content">
          <div class="step-card" :class="`status-${step.status}`">
            <div class="step-head">
              <span class="step-title">{{ step.title }}</span>
              <span class="step-status">{{ step.status }}</span>
            </div>
            <p class="step-desc">{{ step.description }}</p>
            <ToolCallCard
              v-if="step.toolCall"
              :tool-call="step.toolCall"
              @retry="emit('retryTool', step.toolCall!.name)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.agent-panel {
  height: 100%;
  overflow-y: auto;
  padding: 16px 18px;
}

.panel-head h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--agent-text);
}

.panel-head p {
  margin: 4px 0 16px;
  font-size: 12px;
  color: var(--agent-text-secondary);
}

.linked {
  color: #93c5fd;
}

.empty-state {
  text-align: center;
  padding: 48px 20px;
  color: var(--agent-text-secondary);
}

.empty-icon {
  font-size: 28px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 13px;
}

.timeline {
  display: flex;
  flex-direction: column;
}

.timeline-item {
  display: flex;
  gap: 12px;
  min-height: 0;
}

.timeline-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 16px;
  flex-shrink: 0;
  padding-top: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #64748b;
  border: 2px solid var(--agent-panel);
  box-shadow: 0 0 0 1px #64748b;
}

.dot-pending .dot {
  background: #64748b;
  box-shadow: 0 0 0 1px #64748b;
}

.dot-running .dot {
  background: var(--agent-primary);
  box-shadow: 0 0 0 1px var(--agent-primary), 0 0 8px rgba(59, 130, 246, 0.5);
  animation: blink 1.2s ease-in-out infinite;
}

.dot-success .dot {
  background: var(--agent-success);
  box-shadow: 0 0 0 1px var(--agent-success);
}

.dot-error .dot {
  background: var(--agent-danger);
  box-shadow: 0 0 0 1px var(--agent-danger);
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.line {
  flex: 1;
  width: 2px;
  min-height: 16px;
  margin: 4px 0;
  background: var(--agent-border);
}

.timeline-content {
  flex: 1;
  padding-bottom: 14px;
  min-width: 0;
}

.step-card {
  padding: 12px 14px;
  border-radius: var(--agent-radius-sm);
  border: 1px solid var(--agent-border);
  background: var(--agent-card);
}

.step-card.status-running {
  border-color: rgba(59, 130, 246, 0.35);
  background: rgba(59, 130, 246, 0.05);
}

.step-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.step-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--agent-text);
}

.step-status {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--agent-text-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--agent-card-light);
}

.status-success .step-status { color: var(--agent-success); }
.status-error .step-status { color: var(--agent-danger); }
.status-running .step-status { color: var(--agent-primary); }

.step-desc {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--agent-text-secondary);
}
</style>
