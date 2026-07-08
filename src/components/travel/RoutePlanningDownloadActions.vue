<script setup lang="ts">
import type { DetailedTravelGuide } from '@/types/travelTypes'
import {
  downloadGuidePdf,
  exportGuideToImage,
  exportGuideToWord,
  printGuide,
} from '@/services/travelExportApi'

defineProps<{
  guide: DetailedTravelGuide | null
}>()
</script>

<template>
  <div class="download-actions">
    <el-button :disabled="!guide" @click="guide && exportGuideToWord(guide)">下载 Word</el-button>
    <el-button :disabled="!guide" @click="guide && printGuide()">打印攻略</el-button>
    <el-button :disabled="!guide" @click="guide && downloadGuidePdf()">下载 PDF</el-button>
    <el-button :disabled="!guide" @click="guide && exportGuideToImage(guide)">下载长图</el-button>
  </div>
</template>

<style scoped>
.download-actions { display: flex; gap: 8px; flex-wrap: wrap; }
</style>
