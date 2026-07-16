<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import AiResultCard from '@/components/agri/AiResultCard.vue'
import EmptyState from '@/components/agri/EmptyState.vue'
import { useAgriStore } from '@/stores/agri'

const router = useRouter()
const store = useAgriStore()
const { result } = storeToRefs(store)

const hasResult = computed(() => Boolean(result.value))
</script>

<template>
  <main class="agri-page">
    <button type="button" class="agri-ghost-btn back" @click="router.push('/agri-assistant')">回首页</button>
    <h1 class="agri-title">分析结果</h1>

    <EmptyState
      v-if="!hasResult"
      title="还没有分析结果"
      desc="请先说话或拍照"
    >
      <button type="button" class="agri-primary-btn" style="margin-top:16px" @click="router.push('/agri-assistant')">
        去首页
      </button>
    </EmptyState>

    <AiResultCard v-else :result="result!" />

    <div v-if="hasResult" class="footer-actions">
      <button type="button" class="agri-secondary-btn" @click="router.push('/agri-assistant/camera')">再拍一张</button>
      <button type="button" class="agri-primary-btn" @click="router.push('/agri-assistant/today')">看今天任务</button>
    </div>
  </main>
</template>

<style scoped>
.back { padding-left: 0; margin-bottom: 8px; }
.footer-actions {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}
</style>
