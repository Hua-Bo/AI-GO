<script setup lang="ts">
const fetchScenicImages = defineModel<boolean>('fetchScenicImages', { default: false })

defineProps<{
  isGenerating: boolean
  hasApiKey: boolean
  canGenerate: boolean
  outlineReady?: boolean
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
    <div class="mobile-image-row">
      <span>景区图片</span>
      <div class="mobile-image-btns">
        <button
          type="button"
          class="img-chip"
          :class="{ active: !fetchScenicImages }"
          :disabled="isGenerating"
          @click="fetchScenicImages = false"
        >
          不要图·快
        </button>
        <button
          type="button"
          class="img-chip"
          :class="{ active: fetchScenicImages }"
          :disabled="isGenerating"
          @click="fetchScenicImages = true"
        >
          要图·慢
        </button>
      </div>
    </div>
    <div class="mobile-action-row">
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
        {{ hasApiKey ? (outlineReady ? '重生成大纲' : '生成大纲') : '配置 Key 后生成' }}
      </button>
    </div>
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
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.98);
  border-top: 1px solid #e5eef7;
  box-shadow: 0 -8px 24px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(12px);
}
.mobile-image-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  font-weight: 800;
  color: #b45309;
}
.mobile-image-btns {
  display: flex;
  gap: 6px;
}
.img-chip {
  border: 1px solid #fcd34d;
  background: #fffbeb;
  color: #92400e;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.img-chip.active {
  background: #f59e0b;
  border-color: #d97706;
  color: #fff;
}
.img-chip:disabled {
  opacity: 0.55;
}
.mobile-action-row {
  display: flex;
  gap: 12px;
}
.mobile-action-row button {
  flex: 1;
  height: 48px;
  border-radius: 14px;
  font-size: 17px;
  font-weight: 800;
  border: none;
  cursor: pointer;
}
.mobile-action-row button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.secondary-btn {
  flex: 0 0 88px;
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
