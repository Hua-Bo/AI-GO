<script setup lang="ts">
import type { ChatMessage } from '@/types/aiTypes'
import ChatMessageItem from './ChatMessageItem.vue'
import PromptInput from './PromptInput.vue'

defineProps<{
  messages: ChatMessage[]
  sessionTitle: string
  generating: boolean
}>()

const inputText = defineModel<string>('inputText', { required: true })

const emit = defineEmits<{
  send: []
  stop: []
  regenerate: []
  quickAsk: [text: string]
}>()

const quickPrompts = [
  '生成无锡强对流服务短信',
  '生成今天行业服务内参',
  '查询滨湖区风险提示',
]
</script>

<template>
  <div class="chat-panel">
    <div class="chat-subhead">
      <h2>{{ sessionTitle }}</h2>
      <span class="badge">AI 对话</span>
    </div>

    <div class="message-list">
      <div v-if="!messages.length" class="welcome-card">
        <div class="welcome-icon">◇</div>
        <h3>欢迎使用行业服务智能体</h3>
        <p>可生成强对流服务短信、内参报告，并展示 Agent 工具调用过程。</p>
        <div class="quick-list">
          <button
            v-for="q in quickPrompts"
            :key="q"
            type="button"
            class="quick-btn"
            @click="emit('quickAsk', q)"
          >
            {{ q }}
          </button>
        </div>
      </div>

      <ChatMessageItem
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
        @regenerate="emit('regenerate')"
      />
    </div>

    <div class="input-area">
      <PromptInput
        v-model="inputText"
        :generating="generating"
        @send="emit('send')"
        @stop="emit('stop')"
      />
    </div>
  </div>
</template>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px 18px 14px;
  gap: 12px;
}

.chat-subhead {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.chat-subhead h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--agent-text);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.12);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.25);
  flex-shrink: 0;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-right: 2px;
  min-height: 0;
}

.welcome-card {
  margin: auto 0;
  padding: 28px 24px;
  border-radius: var(--agent-radius);
  background: var(--agent-card);
  border: 1px solid var(--agent-border);
  text-align: center;
}

.welcome-icon {
  width: 44px;
  height: 44px;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: var(--agent-card-light);
  color: var(--agent-primary);
  font-size: 20px;
}

.welcome-card h3 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--agent-text);
}

.welcome-card p {
  margin: 0 0 18px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--agent-text-secondary);
}

.quick-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-btn {
  padding: 10px 14px;
  border-radius: var(--agent-radius-sm);
  border: 1px solid var(--agent-border);
  background: var(--agent-card-light);
  color: var(--agent-text);
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, background 0.15s;
}

.quick-btn:hover {
  border-color: rgba(59, 130, 246, 0.45);
  background: rgba(59, 130, 246, 0.08);
}

.input-area {
  flex-shrink: 0;
  padding-top: 4px;
}
</style>
