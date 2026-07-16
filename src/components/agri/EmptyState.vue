<script setup lang="ts">
defineProps<{
  title: string
  desc?: string
}>()
</script>

<template>
  <div class="empty-state">
    <div class="icon">🌱</div>
    <h3>{{ title }}</h3>
    <p v-if="desc">{{ desc }}</p>
    <slot />
  </div>
</template>

<style scoped>
.empty-state {
  text-align: center;
  padding: 36px 16px;
  color: #687268;
}
.icon { font-size: 40px; margin-bottom: 10px; }
h3 {
  margin: 0;
  font-size: 22px;
  color: #1F2A1F;
}
p {
  margin: 8px 0 0;
  font-size: 16px;
  line-height: 1.5;
}
</style>
