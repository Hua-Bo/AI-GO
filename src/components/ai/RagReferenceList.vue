<script setup lang="ts">
import type { RagReference } from '@/types/aiTypes'

defineProps<{
  references: RagReference[]
}>()

const expanded = ref<Record<string, boolean>>({})

function toggle(id: string) {
  expanded.value[id] = !expanded.value[id]
}
</script>

<template>
  <div class="rag-list">
    <div class="rag-title">引用来源</div>
    <div
      v-for="ref in references"
      :key="ref.id"
      class="rag-item"
    >
      <button type="button" class="rag-head" @click="toggle(ref.id)">
        <span class="ref-title">{{ ref.title }}</span>
        <span class="ref-score">相似度 {{ ref.score.toFixed(2) }}</span>
      </button>
      <div v-if="expanded[ref.id]" class="rag-body">
        <div class="meta">{{ ref.fileName }} · {{ ref.sourceType }}</div>
        <p>{{ ref.content }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rag-list {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #475569;
}

.rag-title {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 8px;
}

.rag-item {
  margin-bottom: 6px;
  border: 1px solid #334155;
  border-radius: 8px;
  overflow: hidden;
}

.rag-head {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #0f172a;
  border: none;
  color: #cbd5e1;
  cursor: pointer;
  text-align: left;
  font-size: 13px;
}

.ref-score {
  font-size: 11px;
  color: #60a5fa;
}

.rag-body {
  padding: 10px 12px;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.6;
}

.meta {
  margin-bottom: 4px;
  color: #64748b;
}
</style>
