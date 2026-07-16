<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const items = [
  { path: '/agri-assistant', label: '首页', icon: '🏠' },
  { path: '/agri-assistant/today', label: '今天', icon: '✅' },
  { path: '/agri-assistant/records', label: '记录', icon: '📒' },
  { path: '/agri-assistant/crop', label: '作物', icon: '🌾' },
]

function go(path: string) {
  if (route.path !== path) router.push(path)
}

function isActive(path: string) {
  if (path === '/agri-assistant') return route.path === path
  return route.path.startsWith(path)
}
</script>

<template>
  <nav class="bottom-nav">
    <button
      v-for="item in items"
      :key="item.path"
      type="button"
      class="nav-item"
      :class="{ active: isActive(item.path) }"
      @click="go(item.path)"
    >
      <span class="icon">{{ item.icon }}</span>
      <span>{{ item.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 80;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  padding: 8px 8px calc(8px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid #E5EBE5;
  backdrop-filter: blur(10px);
}
.nav-item {
  min-height: 52px;
  border: none;
  background: transparent;
  color: #687268;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
}
.nav-item.active { color: #2F7D32; }
.icon { font-size: 18px; line-height: 1; }
</style>
