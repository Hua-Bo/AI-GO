<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { AgriRecord } from '@/types/agri'
import AiResultCard from '@/components/agri/AiResultCard.vue'
import EmptyState from '@/components/agri/EmptyState.vue'
import StatusTag from '@/components/agri/StatusTag.vue'
import { useAgriStore } from '@/stores/agri'

const route = useRoute()
const router = useRouter()
const store = useAgriStore()
const record = ref<AgriRecord | null>(null)

onMounted(async () => {
  record.value = await store.loadRecord(String(route.params.id || ''))
})

const hasResult = computed(() => Boolean(record.value?.result))
</script>

<template>
  <main class="agri-page">
    <button type="button" class="agri-ghost-btn back" @click="router.back()">返回</button>

    <EmptyState
      v-if="!record"
      title="找不到这条记录"
      desc="可能已经被清理"
    />

    <template v-else>
      <div class="head agri-card">
        <div class="row">
          <h1 class="agri-title">{{ record.cropName }}</h1>
          <StatusTag :status="record.status" :text="record.statusText" />
        </div>
        <p class="meta">{{ record.date }} · {{ record.title }}</p>
        <p v-if="record.description" class="desc">{{ record.description }}</p>
        <div v-if="record.images?.length" class="imgs">
          <img v-for="(url, i) in record.images" :key="i" :src="url" alt="记录照片">
        </div>
      </div>

      <AiResultCard v-if="hasResult" :result="record.result!" />
      <EmptyState v-else title="这条记录没有详细建议" />
    </template>
  </main>
</template>

<style scoped>
.back { padding-left: 0; margin-bottom: 8px; }
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.agri-title { font-size: 24px; }
.meta {
  margin: 10px 0 0;
  color: #687268;
  font-size: 15px;
}
.desc {
  margin: 10px 0 0;
  font-size: 17px;
  line-height: 1.5;
}
.imgs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}
.imgs img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 12px;
}
.head { margin-bottom: 14px; }
</style>
