<script setup lang="ts">
defineProps<{
  modelValue: string | number | boolean
  options: Array<{ label: string; value: string | number | boolean }>
  cols?: 2 | 3 | 4
  className?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number | boolean]
}>()
</script>

<template>
  <div
    class="segmented-control"
    :class="[
      cols === 2 ? 'cols-2' : cols === 3 ? 'cols-3' : cols === 4 ? 'cols-4' : 'cols-2',
      className,
    ]"
  >
    <button
      v-for="item in options"
      :key="String(item.value)"
      type="button"
      class="segmented-item"
      :class="{ active: modelValue === item.value }"
      :title="item.label"
      @click="emit('update:modelValue', item.value)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<style scoped>
.segmented-control {
  display: grid;
  gap: 8px;
  width: 100%;
}
.segmented-control.cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.segmented-control.cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.segmented-control.cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.segmented-item {
  min-width: 0;
  height: 36px;
  padding: 0 10px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: all .16s ease;
}
.segmented-item:hover {
  border-color: #93c5fd;
  color: #2563eb;
}
.segmented-item.active {
  border-color: #2563eb;
  background: linear-gradient(135deg, #2563eb, #06b6d4);
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.22);
}
</style>
