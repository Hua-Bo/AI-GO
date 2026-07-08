<script setup lang="ts">
import type { TravelGuide } from '@/types/travelTypes'
import { exportGuideToImage, exportGuideToPdf, exportGuideToWord } from '@/services/travelExportApi'

defineProps<{
  guide: TravelGuide | null
}>()
</script>

<template>
  <div class="download-actions">
    <el-button :disabled="!guide" @click="guide && exportGuideToWord(guide)">下载 Word</el-button>
    <el-button :disabled="!guide" @click="guide && exportGuideToPdf()">下载 PDF</el-button>
    <el-button :disabled="!guide" @click="guide && exportGuideToImage(guide)">下载长图</el-button>
  </div>
</template>

<style scoped>
.download-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
