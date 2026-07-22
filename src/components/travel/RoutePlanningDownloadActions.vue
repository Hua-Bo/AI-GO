<script setup lang="ts">
import { ref } from 'vue'
import type { DetailedTravelGuide } from '@/types/travelTypes'
import {
  downloadGuidePdf,
  exportGuideToImage,
  exportGuideToWord,
  printGuide,
} from '@/services/travelExportApi'
import { exportGuideToAmap } from '@/services/travelAmapExport'
import AmapDayNavDialog from './AmapDayNavDialog.vue'

const props = defineProps<{
  guide: DetailedTravelGuide | null
}>()

const amapDayNavVisible = ref(false)
</script>

<template>
  <div class="download-actions-wrap">
    <div class="download-actions">
      <el-button :disabled="!guide" @click="guide && exportGuideToWord(guide)">下载 Word</el-button>
      <el-button :disabled="!guide" @click="guide && printGuide()">打印攻略</el-button>
      <el-button :disabled="!guide" @click="guide && downloadGuidePdf(guide)">下载 PDF</el-button>
      <el-button :disabled="!guide" @click="guide && exportGuideToImage(guide)">下载长图</el-button>
      <el-button type="success" :disabled="!guide" @click="guide && exportGuideToAmap(guide)">导出高德文件</el-button>
      <el-button type="success" plain :disabled="!guide" @click="amapDayNavVisible = true">按天高德导航</el-button>
    </div>
    <p class="amap-mini-help">
      高德用法：先点「导出高德文件」→ 电脑打开
      <a href="https://wia.amap.com" target="_blank" rel="noopener noreferrer">wia.amap.com</a>
      → 批量导入 CSV → 手机高德「地图小程序」查看。当天开跑用「按天高德导航」。
    </p>
    <AmapDayNavDialog v-model:visible="amapDayNavVisible" :guide="props.guide" />
  </div>
</template>

<style scoped>
.download-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.amap-mini-help {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.55;
  color: #64748b;
}
.amap-mini-help a {
  color: #15803d;
  font-weight: 700;
}
</style>
