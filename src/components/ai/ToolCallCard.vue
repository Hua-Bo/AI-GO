<script setup lang="ts">
import type { ToolCall } from '@/types/aiTypes'

defineProps<{
  toolCall: ToolCall
}>()

const emit = defineEmits<{
  retry: []
}>()

const showArgs = ref(false)
const showResult = ref(false)

const statusLabel: Record<string, string> = {
  pending: '等待中',
  running: '执行中',
  success: '已完成',
  error: '失败',
}
</script>

<template>
  <div class="tool-card" :class="`status-${toolCall.status}`">
    <div class="tool-head">
      <code class="tool-name">{{ toolCall.name }}</code>
      <span class="tool-status">{{ statusLabel[toolCall.status] }}</span>
    </div>
    <div class="tool-actions">
      <button type="button" @click="showArgs = !showArgs">入参 {{ showArgs ? '▲' : '▼' }}</button>
      <button type="button" @click="showResult = !showResult">结果 {{ showResult ? '▲' : '▼' }}</button>
      <button v-if="toolCall.status === 'error'" type="button" class="retry" @click="emit('retry')">重试</button>
    </div>
    <pre v-if="showArgs" class="tool-pre">{{ JSON.stringify(toolCall.args, null, 2) }}</pre>
    <pre v-if="showResult && toolCall.result" class="tool-pre">{{ JSON.stringify(toolCall.result, null, 2) }}</pre>
    <p v-if="toolCall.error" class="tool-error">{{ toolCall.error }}</p>
  </div>
</template>

<style scoped>
.tool-card {
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid var(--agent-border);
  background: var(--agent-card-light);
}

.tool-card.status-running {
  border-color: rgba(59, 130, 246, 0.3);
}

.tool-card.status-success {
  border-color: rgba(34, 197, 94, 0.25);
}

.tool-card.status-error {
  border-color: rgba(239, 68, 68, 0.35);
}

.tool-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.tool-name {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: #93c5fd;
  background: rgba(0, 0, 0, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
}

.tool-status {
  font-size: 10px;
  color: var(--agent-text-secondary);
}

.tool-actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.tool-actions button {
  padding: 2px 8px;
  font-size: 10px;
  border: 1px solid var(--agent-border);
  border-radius: 4px;
  background: transparent;
  color: var(--agent-text-secondary);
  cursor: pointer;
}

.tool-actions button:hover {
  color: var(--agent-text);
  border-color: rgba(59, 130, 246, 0.35);
}

.tool-actions .retry {
  color: #fca5a5;
  border-color: rgba(239, 68, 68, 0.4);
}

.tool-pre {
  margin-top: 8px;
  padding: 8px;
  font-size: 10px;
  line-height: 1.45;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 4px;
  overflow-x: auto;
  color: #cbd5e1;
}

.tool-error {
  margin-top: 6px;
  font-size: 11px;
  color: #fca5a5;
}
</style>
