<script setup lang="ts">
defineProps<{
  isGenerating: boolean
  hasApiKey: boolean
  canGenerate: boolean
}>()

const emit = defineEmits<{
  reset: []
  plan: []
  stop: []
  openConfig: []
}>()
</script>

<template>
  <div class="mobile-bottom-bar no-print">
    <button type="button" class="secondary-btn" :disabled="isGenerating" @click="emit('reset')">
      重置
    </button>
    <button
      v-if="isGenerating"
      type="button"
      class="danger-btn"
      @click="emit('stop')"
    >
      停止
    </button>
    <button
      v-else
      type="button"
      class="primary-btn"
      :disabled="!canGenerate && hasApiKey"
      @click="hasApiKey ? emit('plan') : emit('openConfig')"
    >
      {{ hasApiKey ? '生成攻略' : '配置 Key 后生成' }}
    </button>
  </div>
</template>

<style scoped>
.mobile-bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  display: flex;
  gap: 12px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.98);
  border-top: 1px solid #e5eef7;
  box-shadow: 0 -8px 24px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(12px);
}
.mobile-bottom-bar button {
  flex: 1;
  height: 52px;
  border-radius: 14px;
  font-size: 18px;
  font-weight: 800;
  border: none;
  cursor: pointer;
}
.mobile-bottom-bar button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.secondary-btn {
  flex: 0 0 104px;
  background: #f1f5f9;
  color: #334155;
}
.primary-btn {
  flex: 1;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #06b6d4);
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.22);
}
.danger-btn {
  flex: 1;
  color: #fff;
  background: #ef4444;
}
</style>
