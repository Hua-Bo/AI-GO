<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import VoiceRecorder from '@/components/agri/VoiceRecorder.vue'
import ErrorState from '@/components/agri/ErrorState.vue'
import { useAgriStore } from '@/stores/agri'

const router = useRouter()
const store = useAgriStore()
const text = ref(store.voiceText || '')
const failed = ref(false)

function onResult(value: string) {
  text.value = value
  failed.value = false
}

function onError() {
  failed.value = true
}

function reset() {
  text.value = ''
  failed.value = false
}

function confirmSubmit() {
  if (!text.value.trim()) return
  store.setVoiceText(text.value.trim())
  router.push('/agri-assistant/analyze')
}
</script>

<template>
  <main class="agri-page no-nav">
    <button type="button" class="agri-ghost-btn back" @click="router.back()">返回</button>
    <h1 class="agri-title">按住说话</h1>
    <p class="agri-subtitle">说完松手，确认后再提交</p>

    <div class="block">
      <VoiceRecorder @result="onResult" @error="onError" />
    </div>

    <ErrorState
      v-if="failed && !text"
      title="没听清，请再说一次"
      action-text="重新说"
      @action="reset"
    />

    <div v-if="text" class="agri-card result">
      <h2>我听到的是</h2>
      <p>{{ text }}</p>
      <div class="agri-row">
        <button type="button" class="agri-secondary-btn" @click="reset">重新说</button>
        <button type="button" class="agri-primary-btn" @click="confirmSubmit">确认提交</button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.back { padding-left: 0; margin-bottom: 8px; }
.block { margin: 24px 0; }
.result h2 {
  margin: 0 0 10px;
  font-size: 18px;
  color: #687268;
}
.result p {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.55;
  color: #1F2A1F;
}
</style>
