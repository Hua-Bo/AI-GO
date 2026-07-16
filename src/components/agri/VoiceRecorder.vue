<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { transcribeAudio } from '@/api/agri'

const emit = defineEmits<{
  result: [text: string]
  error: [message: string]
}>()

const holding = ref(false)
const recognizing = ref(false)
const errorText = ref('')
let recognition: any = null
let mediaRecorder: MediaRecorder | null = null
let chunks: BlobPart[] = []

function getRecognition(): any {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SR) return null
  const r = new SR()
  r.lang = 'zh-CN'
  r.continuous = false
  r.interimResults = false
  return r
}

async function startHold() {
  errorText.value = ''
  holding.value = true
  recognition = getRecognition()
  if (recognition) {
    recognition.onresult = (ev: any) => {
      const text = Array.from(ev.results as ArrayLike<{ 0: { transcript: string } }>)
        .map((x) => x[0].transcript)
        .join('')
      if (text.trim()) emit('result', text.trim())
    }
    recognition.onerror = () => {
      errorText.value = '没听清，请再说一次'
      emit('error', errorText.value)
    }
    recognition.onend = () => {
      holding.value = false
    }
    try {
      recognition.start()
      return
    } catch {
      // fall through to MediaRecorder mock path
    }
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    chunks = []
    mediaRecorder = new MediaRecorder(stream)
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data)
    }
    mediaRecorder.start()
  } catch {
    // 无权限时仍允许 Mock
  }
}

async function endHold() {
  if (!holding.value && !mediaRecorder) return
  holding.value = false
  if (recognition) {
    try { recognition.stop() } catch { /* noop */ }
    recognition = null
    return
  }
  recognizing.value = true
  try {
    let blob: Blob | undefined
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      blob = await new Promise<Blob>((resolve) => {
        mediaRecorder!.onstop = () => {
          mediaRecorder?.stream.getTracks().forEach((t) => t.stop())
          resolve(new Blob(chunks, { type: 'audio/webm' }))
        }
        mediaRecorder!.stop()
      })
    }
    const text = await transcribeAudio(blob)
    emit('result', text)
  } catch {
    errorText.value = '没听清，请再说一次'
    emit('error', errorText.value)
  } finally {
    recognizing.value = false
    mediaRecorder = null
  }
}

onBeforeUnmount(() => {
  try { recognition?.stop() } catch { /* noop */ }
  try {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
    mediaRecorder?.stream.getTracks().forEach((t) => t.stop())
  } catch { /* noop */ }
})
</script>

<template>
  <div class="voice-recorder">
    <button
      type="button"
      class="hold-btn"
      :class="{ holding }"
      @pointerdown.prevent="startHold"
      @pointerup.prevent="endHold"
      @pointercancel.prevent="endHold"
      @pointerleave="holding && endHold()"
    >
      {{ holding ? '正在听…松手结束' : recognizing ? '正在识别…' : '按住说话' }}
    </button>
    <p class="hint">告诉我地里出了什么问题</p>
    <p v-if="errorText" class="err">{{ errorText }}</p>
  </div>
</template>

<style scoped>
.voice-recorder { width: 100%; }
.hold-btn {
  width: 100%;
  min-height: 120px;
  border: none;
  border-radius: 24px;
  background: #2F7D32;
  color: #fff;
  font-size: 26px;
  font-weight: 800;
  cursor: pointer;
  touch-action: none;
  user-select: none;
  box-shadow: 0 14px 28px rgba(47, 125, 50, 0.28);
}
.hold-btn.holding {
  background: #1B5E20;
  transform: scale(0.98);
}
.hint {
  margin: 12px 0 0;
  text-align: center;
  color: #687268;
  font-size: 16px;
}
.err {
  margin: 10px 0 0;
  text-align: center;
  color: #D94B3D;
  font-size: 16px;
  font-weight: 700;
}
</style>
