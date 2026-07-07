<script setup lang="ts">
import type { AiReport } from '@/types/aiTypes'
import ReportChart from './ReportChart.vue'
import { exportReportToPdf, exportReportToWord } from '@/utils/exportReport'

const report = defineModel<AiReport | null>({ required: true })

function onExportWord() {
  if (report.value) exportReportToWord(report.value)
}

function onExportPdf() {
  if (report.value) exportReportToPdf(report.value)
}

const riskTagType = computed(() => {
  const level = report.value?.riskLevel
  if (level === '红色') return 'danger'
  if (level === '橙色') return 'warning'
  if (level === '黄色') return 'warning'
  return 'info'
})
</script>

<template>
  <div class="report-panel">
    <div v-if="!report" class="empty-state">
      <div class="empty-icon">📄</div>
      <p>完成 Agent 流程后，内参报告将在此预览与编辑</p>
    </div>

    <div v-else class="report-workspace">
      <div class="report-title-card">
        <div class="title-row">
          <h3>{{ report.title }}</h3>
          <el-tag :type="riskTagType" effect="dark" size="small">{{ report.riskLevel }}</el-tag>
        </div>
        <div class="export-actions">
          <el-button size="small" @click="onExportWord">导出 Word</el-button>
          <el-button size="small" @click="onExportPdf">导出 PDF</el-button>
        </div>
      </div>

      <div class="section-card">
        <label>摘要</label>
        <el-input v-model="report.summary" type="textarea" :rows="3" />
      </div>

      <div class="meta-card">
        <div class="meta-item">
          <span class="meta-label">影响时段</span>
          <span>{{ report.timeRange }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">影响区域</span>
          <span>{{ report.affectedAreas.join('、') }}</span>
        </div>
      </div>

      <div class="section-card">
        <label>分区域建议表</label>
        <el-table :data="report.table" size="small" border stripe>
          <el-table-column prop="area" label="区域" width="90" />
          <el-table-column prop="weatherType" label="天气类型" width="100" />
          <el-table-column prop="riskLevel" label="风险" width="70" />
          <el-table-column prop="timeRange" label="时段" width="120" />
          <el-table-column prop="suggestion" label="建议" min-width="160" />
        </el-table>
      </div>

      <div class="section-card">
        <label>风险指数（示意）</label>
        <ReportChart :data="report.chartData" />
      </div>

      <div class="section-card">
        <label>综合建议</label>
        <el-input v-model="report.suggestion" type="textarea" :rows="3" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.report-panel {
  min-height: 200px;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--agent-text-secondary);
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.6;
}

.empty-state p {
  margin: 0;
  font-size: 13px;
}

.report-workspace {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.report-title-card {
  padding: 14px 16px;
  border-radius: var(--agent-radius);
  background: var(--agent-card);
  border: 1px solid var(--agent-border);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.title-row h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--agent-text);
}

.export-actions {
  display: flex;
  gap: 8px;
}

.section-card,
.meta-card {
  padding: 14px 16px;
  border-radius: var(--agent-radius);
  background: var(--agent-card);
  border: 1px solid var(--agent-border);
}

.section-card label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--agent-text-secondary);
  margin-bottom: 8px;
}

.meta-card {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 13px;
  color: var(--agent-text);
}

.meta-label {
  display: block;
  font-size: 11px;
  color: var(--agent-text-secondary);
  margin-bottom: 4px;
}
</style>
