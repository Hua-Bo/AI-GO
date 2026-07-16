<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  text: string
}>()

const speaking = ref(false)
const paused = ref(false)

const label = computed(() => {
  if (speaking.value && paused.value) return '继续听'
  if (speaking.value) return '暂停'
  return '听一遍'
})

function stop() {
  window.speechSynthesis?.cancel()
  speaking.value = false
  paused.value = false
}

function speak() {
  if (!('speechSynthesis' in window)) {
    alert('当前手机不支持朗读')
    return
  }
  if (speaking.value && !paused.value) {
    window.speechSynthesis.pause()
    paused.value = true
    return
  }
  if (speaking.value && paused.value) {
    window.speechSynthesis.resume()
    paused.value = false
    return
  }
  stop()
  const utter = new SpeechSynthesisUtterance(props.text)
  utter.lang = 'zh-CN'
  utter.rate = 0.92
  utter.onend = () => {
    speaking.value = false
    paused.value = false
  }
  utter.onerror = () => {
    speaking.value = false
    paused.value = false
  }
  speaking.value = true
  window.speechSynthesis.speak(utter)
}

watch(() => props.text, () => stop())
onBeforeUnmount(stop)

defineExpose({ speak, stop })
</script>

<template>
  <button type="button" class="speak-btn" @click="speak">
    {{ label }}
  </button>
</template>

<style scoped>
.speak-btn {
  width: 100%;
  min-height: 56px;
  border: none;
  border-radius: 16px;
  background: #E8F5E9;
  color: #2F7D32;
  font-size: 20px;
  font-weight: 800;
  cursor: pointer;
}
</style>
