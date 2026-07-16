<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import StatusTag from '@/components/agri/StatusTag.vue'
import EmptyState from '@/components/agri/EmptyState.vue'
import { useAgriStore } from '@/stores/agri'

const router = useRouter()
const store = useAgriStore()
const { records } = storeToRefs(store)

onMounted(() => {
  store.loadRecords()
})
</script>

<template>
  <main class="agri-page">
    <h1 class="agri-title">种植记录</h1>
    <p class="agri-subtitle">按时间看看以前的情况</p>

    <EmptyState
      v-if="!records.length"
      title="还没有记录"
      desc="分析完成后会自动保存"
    />

    <button
      v-for="item in records"
      :key="item.id"
      type="button"
      class="record-card"
      @click="router.push(`/agri-assistant/records/${item.id}`)"
    >
      <div v-if="item.thumbUrl" class="thumb">
        <img :src="item.thumbUrl" alt="">
      </div>
      <div v-else class="thumb placeholder">🪴</div>
      <div class="body">
        <div class="top">
          <strong>{{ item.cropName }}</strong>
          <StatusTag :status="item.status" :text="item.statusText" />
        </div>
        <p class="title">{{ item.title }}</p>
        <p class="date">{{ item.date }}</p>
      </div>
    </button>
  </main>
</template>

<style scoped>
.record-card {
  width: 100%;
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
  gap: 12px;
  padding: 12px;
  margin-top: 12px;
  border: 1px solid rgba(47, 125, 50, 0.08);
  border-radius: 18px;
  background: #fff;
  text-align: left;
  cursor: pointer;
}
.thumb {
  width: 84px;
  height: 84px;
  border-radius: 14px;
  overflow: hidden;
  background: #EEF2EE;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.thumb.placeholder {
  display: grid;
  place-items: center;
  font-size: 28px;
}
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.title {
  margin: 8px 0 4px;
  font-size: 17px;
  color: #1F2A1F;
  line-height: 1.4;
}
.date {
  margin: 0;
  color: #687268;
  font-size: 14px;
}
</style>
