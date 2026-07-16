<script setup lang="ts">
import SpeakButton from './SpeakButton.vue'

defineProps<{
  title: string
  done: boolean
}>()

const emit = defineEmits<{
  toggle: []
  later: []
}>()
</script>

<template>
  <div class="task-item" :class="{ done }">
    <p class="title">{{ title }}</p>
    <div class="actions">
      <button type="button" class="act" @click="emit('toggle')">
        {{ done ? '已完成' : '完成' }}
      </button>
      <button type="button" class="act ghost" @click="emit('later')">稍后提醒</button>
    </div>
    <SpeakButton :text="title" />
  </div>
</template>

<style scoped>
.task-item {
  background: #fff;
  border-radius: 18px;
  padding: 16px;
  border: 1px solid rgba(47, 125, 50, 0.08);
  margin-bottom: 12px;
}
.task-item.done { opacity: 0.72; }
.title {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 700;
  color: #1F2A1F;
  line-height: 1.4;
}
.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
}
.act {
  min-height: 48px;
  border: none;
  border-radius: 14px;
  background: #2F7D32;
  color: #fff;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
}
.act.ghost {
  background: #EEF5EE;
  color: #2F7D32;
}
</style>
