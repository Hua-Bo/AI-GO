<script setup lang="ts">
import type { AnalysisResult } from '@/types/agri'
import StatusTag from './StatusTag.vue'
import SpeakButton from './SpeakButton.vue'

const props = defineProps<{
  result: AnalysisResult
}>()

const speakText = [
  ...(props.result.summary || []),
  '今天先做什么：',
  ...(props.result.todayActions || []),
  props.result.riskWarning || '',
].filter(Boolean).join('。')
</script>

<template>
  <div class="ai-result-card">
    <div class="head">
      <h2>当前判断</h2>
      <StatusTag :status="result.status" :text="result.statusText" />
    </div>
    <ul class="summary">
      <li v-for="(s, i) in result.summary" :key="i">{{ s }}</li>
    </ul>

    <h2>今天先做什么</h2>
    <ol class="actions">
      <li v-for="(a, i) in result.todayActions" :key="i">{{ a }}</li>
    </ol>

    <h2>什么时候再看</h2>
    <p class="next">{{ result.nextCheck }}</p>

    <div v-if="result.riskWarning" class="risk">
      <h2>风险提醒</h2>
      <p>{{ result.riskWarning }}</p>
    </div>

    <div v-if="result.needMorePhotos" class="photo-tips">
      <h2>建议再拍</h2>
      <p v-for="(t, i) in result.photoTips" :key="i">{{ t }}</p>
    </div>

    <SpeakButton :text="speakText" />
  </div>
</template>

<style scoped>
.ai-result-card {
  background: #fff;
  border-radius: 20px;
  padding: 18px;
  border: 1px solid rgba(47, 125, 50, 0.08);
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
h2 {
  margin: 18px 0 8px;
  font-size: 20px;
  font-weight: 800;
  color: #1F2A1F;
}
.head h2 { margin: 0; }
.summary,
.actions {
  margin: 0;
  padding-left: 20px;
  font-size: 18px;
  line-height: 1.65;
  color: #1F2A1F;
}
.next {
  margin: 0;
  font-size: 18px;
  color: #1F2A1F;
}
.risk {
  margin-top: 8px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #FDECEC;
}
.risk h2 { margin-top: 0; color: #D94B3D; }
.risk p { margin: 0; color: #8B2E26; font-size: 17px; }
.photo-tips {
  margin-top: 8px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #FFF6E0;
}
.photo-tips h2 { margin-top: 0; color: #B7791F; }
.photo-tips p { margin: 4px 0; color: #6B5420; }
.ai-result-card :deep(.speak-btn) { margin-top: 18px; }
</style>
