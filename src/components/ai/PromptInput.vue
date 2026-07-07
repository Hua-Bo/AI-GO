<script setup lang="ts">
const text = defineModel<string>({ required: true })

const emit = defineEmits<{
  send: []
  stop: []
}>()

defineProps<{
  generating: boolean
}>()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    emit('send')
  }
}
</script>

<template>
  <div class="prompt-input">
    <div class="input-card">
      <el-input
        v-model="text"
        type="textarea"
        :rows="3"
        placeholder="输入问题，Enter 发送，Shift+Enter 换行"
        resize="none"
        @keydown="onKeydown"
      />
      <div class="actions">
        <button
          v-if="generating"
          type="button"
          class="btn stop"
          @click="emit('stop')"
        >
          停止生成
        </button>
        <button
          v-else
          type="button"
          class="btn send"
          :disabled="!text.trim()"
          @click="emit('send')"
        >
          发送
        </button>
      </div>
    </div>
    <p class="hint">示例：帮我生成无锡今天强对流服务短信和内参报告</p>
  </div>
</template>

<style scoped>
.prompt-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-card {
  position: relative;
  padding: 10px 12px 44px;
  border-radius: var(--agent-radius);
  background: var(--agent-card);
  border: 1px solid var(--agent-border);
}

.input-card :deep(.el-textarea__inner) {
  background: transparent !important;
  box-shadow: none !important;
  padding: 0;
  min-height: 72px !important;
}

.actions {
  position: absolute;
  right: 10px;
  bottom: 10px;
}

.btn {
  padding: 6px 18px;
  border: none;
  border-radius: var(--agent-radius-sm);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn.send {
  background: var(--agent-primary);
  color: #fff;
}

.btn.send:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn.stop {
  background: var(--agent-danger);
  color: #fff;
}

.hint {
  margin: 0;
  font-size: 11px;
  color: var(--agent-text-secondary);
  padding-left: 4px;
}
</style>
