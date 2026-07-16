<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import PhotoUploader from '@/components/agri/PhotoUploader.vue'
import { useAgriStore } from '@/stores/agri'

const router = useRouter()
const store = useAgriStore()
const photos = ref<string[]>([...store.photos])

watch(photos, (v) => store.setPhotos(v), { deep: true })

function submit() {
  if (!photos.value.length) return
  store.setPhotos(photos.value)
  router.push('/agri-assistant/analyze')
}
</script>

<template>
  <main class="agri-page no-nav">
    <button type="button" class="agri-ghost-btn back" @click="router.back()">返回</button>
    <h1 class="agri-title">拍照看看</h1>
    <p class="agri-subtitle">拍叶子、果实或者整株</p>

    <div class="block agri-card">
      <PhotoUploader v-model="photos" :max="5" />
    </div>

    <button
      type="button"
      class="agri-primary-btn"
      :disabled="!photos.length"
      @click="submit"
    >
      开始分析
    </button>
  </main>
</template>

<style scoped>
.back { padding-left: 0; margin-bottom: 8px; }
.block { margin: 20px 0; }
</style>
