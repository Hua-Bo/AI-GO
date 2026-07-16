<script setup lang="ts">
defineProps<{
  title: string
  desc?: string
  actionText?: string
}>()
const emit = defineEmits<{ action: [] }>()
</script>

<template>
  <div class="error-state">
    <div class="icon">😕</div>
    <h3>{{ title }}</h3>
    <p v-if="desc">{{ desc }}</p>
    <button v-if="actionText" type="button" class="agri-primary-btn" @click="emit('action')">
      {{ actionText }}
    </button>
  </div>
</template>

<style scoped>
.error-state {
  text-align: center;
  padding: 28px 12px;
}
.icon { font-size: 40px; margin-bottom: 8px; }
h3 {
  margin: 0;
  font-size: 22px;
  color: #1F2A1F;
}
p {
  margin: 8px 0 18px;
  color: #687268;
  font-size: 16px;
}
</style>
