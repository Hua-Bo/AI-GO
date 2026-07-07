<script setup lang="ts">
import type { ChatMessage } from '@/types/aiTypes'
import MarkdownRenderer from './MarkdownRenderer.vue'
import RagReferenceList from './RagReferenceList.vue'
import { copyText } from '@/utils/exportReport'

defineProps<{
  message: ChatMessage
}>()

const emit = defineEmits<{
  regenerate: []
}>()

async function onCopy(content: string) {
  await copyText(content)
}
</script>

<template>
  <div class="msg-row" :class="`role-${message.role}`">
    <div class="avatar">{{ message.role === 'user' ? '我' : 'AI' }}</div>
    <div class="bubble-wrap">
      <div
        class="bubble"
        :class="[`status-${message.status}`]"
      >
        <div class="bubble-meta">
          <span class="time">{{ new Date(message.createdAt).toLocaleTimeString() }}</span>
        </div>

        <div v-if="message.role === 'assistant'" class="bubble-body">
          <div v-if="message.status === 'loading'" class="loading">
            <span class="dot-pulse" />
            正在思考…
          </div>
          <MarkdownRenderer v-else :content="message.content" />
          <RagReferenceList v-if="message.references?.length" :references="message.references" />
        </div>
        <div v-else class="bubble-body user-text">{{ message.content }}</div>

        <div v-if="message.role === 'assistant' && message.status === 'done'" class="bubble-actions">
          <button type="button" @click="onCopy(message.content)">复制</button>
          <button type="button" @click="emit('regenerate')">重新生成</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.msg-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.msg-row.role-user {
  flex-direction: row-reverse;
}

.avatar {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  background: var(--agent-card-light);
  color: var(--agent-text-secondary);
  border: 1px solid var(--agent-border);
}

.msg-row.role-user .avatar {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
  border-color: rgba(59, 130, 246, 0.3);
}

.msg-row.role-assistant .avatar {
  background: rgba(34, 197, 94, 0.12);
  color: #86efac;
  border-color: rgba(34, 197, 94, 0.25);
}

.bubble-wrap {
  max-width: 88%;
  min-width: 0;
}

.bubble {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--agent-border);
  background: var(--agent-card);
}

.msg-row.role-user .bubble {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.25);
  border-top-right-radius: 4px;
}

.msg-row.role-assistant .bubble {
  border-top-left-radius: 4px;
}

.bubble-meta {
  margin-bottom: 6px;
}

.time {
  font-size: 11px;
  color: var(--agent-text-secondary);
}

.bubble-body.user-text {
  white-space: pre-wrap;
  line-height: 1.65;
  color: var(--agent-text);
  font-size: 14px;
}

.loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--agent-text-secondary);
  font-size: 13px;
}

.dot-pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--agent-primary);
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.1); }
}

.bubble-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--agent-border);
}

.bubble-actions button {
  padding: 3px 10px;
  font-size: 11px;
  border: 1px solid var(--agent-border);
  border-radius: 6px;
  background: transparent;
  color: var(--agent-text-secondary);
  cursor: pointer;
}

.bubble-actions button:hover {
  color: var(--agent-text);
  border-color: rgba(59, 130, 246, 0.4);
}
</style>
