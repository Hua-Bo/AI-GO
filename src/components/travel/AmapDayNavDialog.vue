<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { DetailedTravelGuide } from '@/types/travelTypes'
import { openAmapNavigationForDay } from '@/services/travelAmapExport'
import { useResponsive } from '@/composables/useResponsive'

const visible = defineModel<boolean>('visible', { required: true })
const props = defineProps<{
  guide: DetailedTravelGuide | null
}>()

const { isMobile } = useResponsive()
const selectedDay = ref(1)
const opening = ref(false)

const dayOptions = computed(() =>
  (props.guide?.dailyPlans || []).map((d) => ({
    day: d.day,
    title: d.title || `${d.startCity || ''}→${d.endCity || ''}`,
    summary: d.daySummary || (d.scenicSpots || []).slice(0, 2).map((s) => s.name).join('、') || '按当日行程导航',
    spots: (d.scenicSpots || []).length,
  })),
)

watch(visible, (v) => {
  if (v) {
    selectedDay.value = dayOptions.value[0]?.day || 1
    opening.value = false
  }
})

async function handleOpen() {
  if (!props.guide) {
    ElMessage.warning('请先生成攻略')
    return
  }
  opening.value = true
  try {
    await openAmapNavigationForDay(props.guide, selectedDay.value)
    visible.value = false
  } finally {
    opening.value = false
  }
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="按天打开高德导航"
    class="amap-day-nav-dialog"
    :class="{ 'is-mobile-drawer': isMobile }"
    :width="isMobile ? '100%' : '480px'"
    align-center
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
  >
    <p class="hint">选择要导航的那一天，将用当天首末景点作为起终点，并带上一个中间途经点。</p>

    <div v-if="!dayOptions.length" class="empty">暂无每日行程，请先生成攻略。</div>
    <div v-else class="day-list">
      <button
        v-for="opt in dayOptions"
        :key="opt.day"
        type="button"
        class="day-item"
        :class="{ active: selectedDay === opt.day }"
        @click="selectedDay = opt.day"
      >
        <div class="day-badge">D{{ opt.day }}</div>
        <div class="day-body">
          <strong>{{ opt.title }}</strong>
          <p>{{ opt.summary }}</p>
          <span v-if="opt.spots">含 {{ opt.spots }} 个景区点</span>
        </div>
        <div class="check" :class="{ on: selectedDay === opt.day }" />
      </button>
    </div>

    <template #footer>
      <div class="footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="opening" :disabled="!dayOptions.length" @click="handleOpen">
          打开高德导航
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.hint {
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.55;
  color: #64748b;
}

.empty {
  padding: 24px;
  text-align: center;
  color: #94a3b8;
  background: #f8fafc;
  border-radius: 12px;
}

.day-list {
  display: grid;
  gap: 10px;
  max-height: min(420px, 52vh);
  overflow: auto;
  padding-right: 2px;
}

.day-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: all .16s ease;
}

.day-item:hover {
  border-color: #93c5fd;
}

.day-item.active {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.12);
}

.day-badge {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 900;
  color: #1d4ed8;
  background: #dbeafe;
}

.day-item.active .day-badge {
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #06b6d4);
}

.day-body strong {
  display: block;
  font-size: 14px;
  color: #0f172a;
}

.day-body p {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.45;
  color: #64748b;
}

.day-body span {
  display: inline-block;
  margin-top: 4px;
  font-size: 11px;
  color: #94a3b8;
}

.check {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  box-sizing: border-box;
}

.check.on {
  border-color: #2563eb;
  background: #2563eb;
  box-shadow: inset 0 0 0 3px #fff;
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  width: 100%;
}
</style>

<style>
.amap-day-nav-dialog.el-dialog {
  width: min(480px, calc(100vw - 32px)) !important;
  max-width: calc(100vw - 32px);
  border-radius: 20px;
  overflow: hidden;
  margin: 0 auto !important;
}

.amap-day-nav-dialog .el-dialog__header {
  padding: 16px 20px 8px;
}

.amap-day-nav-dialog .el-dialog__body {
  padding: 4px 20px 12px;
}

.amap-day-nav-dialog .el-dialog__footer {
  padding: 12px 20px 16px;
  border-top: 1px solid #edf0f5;
}

.el-overlay-dialog:has(.amap-day-nav-dialog) {
  display: flex !important;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .amap-day-nav-dialog.el-dialog,
  .amap-day-nav-dialog.is-mobile-drawer.el-dialog {
    width: 100% !important;
    max-width: 100% !important;
    max-height: 78vh !important;
    margin: 0 !important;
    position: fixed !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    top: auto !important;
    transform: none !important;
    border-radius: 20px 20px 0 0;
  }

  .el-overlay-dialog:has(.amap-day-nav-dialog) {
    align-items: flex-end;
  }

  .amap-day-nav-dialog .el-dialog__footer {
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
  }
}
</style>
