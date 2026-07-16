<script setup lang="ts">
defineProps<{
  title: string
  desc?: string
  accent?: 'green' | 'orange' | 'blue'
}>()

const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    class="big-action"
    :class="accent || 'green'"
    @click="emit('click')"
  >
    <span class="big-action-title">{{ title }}</span>
    <span v-if="desc" class="big-action-desc">{{ desc }}</span>
  </button>
</template>

<style scoped>
.big-action {
  width: 100%;
  min-height: 96px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 6px;
  padding: 18px 20px;
  border: none;
  border-radius: 20px;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(31, 42, 31, 0.06);
}
.big-action.green { background: #2F7D32; color: #fff; }
.big-action.orange { background: #E8A317; color: #1F2A1F; }
.big-action.blue { background: #3B7DD8; color: #fff; }
.big-action-title {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.2;
}
.big-action-desc {
  font-size: 16px;
  opacity: 0.92;
  line-height: 1.4;
}
</style>
