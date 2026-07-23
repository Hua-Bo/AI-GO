<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DestinationIntent, GuideOutline } from '@/types/travelTypes'
import { parseDistanceKm, MAX_REASONABLE_DAILY_KM } from '@/services/travelHighwayToll'
import { analyzeOutlineWarnings } from '@/services/travelOutlineConstraints'

const props = defineProps<{
  outline: GuideOutline
  revising?: boolean
  destinationIntent?: DestinationIntent
  travelDays?: number
  outlineRevisionNote?: string
}>()

const emit = defineEmits<{
  confirm: []
  revise: [note: string]
  restart: []
}>()

const revisionNote = ref('')

const outlineWarnings = computed(() => {
  if (!props.destinationIntent) {
    return (props.outline.dailyOutlines || [])
      .filter((d) => parseDistanceKm(d.distance) > MAX_REASONABLE_DAILY_KM)
      .map((d) => `第 ${d.day} 天里程过大`)
  }
  return analyzeOutlineWarnings(props.outline, {
    departurePoints: [],
    destinationIntent: props.destinationIntent,
    travelDays: props.travelDays || props.outline.travelDays || 1,
    outlineRevisionNote: props.outlineRevisionNote,
    budgetLevel: 'medium',
    pace: 'normal',
    travelThemes: [],
    withChildren: false,
    withElderly: false,
    avoidCrowded: false,
    preferNaturalScenery: false,
    preferFood: false,
    preferPhotoSpot: false,
    preferFreeSpots: false,
    preferParks: false,
    preferCamping: false,
    preferLakeside: false,
    preferForest: false,
    preferCityWalk: false,
    preferLowCost: false,
    avoidTicketsExpensive: false,
    preferDriveToSpot: false,
    preferRiverside: false,
    preferWaterPlay: false,
    preferWildSpot: false,
    preferEasyParking: false,
    accommodationPreference: { mode: 'auto' },
  })
})

const overnightLabel = (type?: string, overnight?: string) => {
  if (overnight) return overnight
  if (type === 'car') return '车宿'
  if (type === 'hotel') return '酒店'
  if (type === 'home') return '回家'
  if (type === 'camping') return '露营'
  return '—'
}

function submitRevise() {
  const note = revisionNote.value.trim()
  if (!note) return
  emit('revise', note)
}
</script>

<template>
  <div class="outline-preview no-print">
    <div class="outline-head">
      <div>
        <p class="eyebrow">第一步 · 行程大纲（请先确认）</p>
        <h2>{{ outline.title }}</h2>
        <p v-if="outline.subtitle" class="subtitle">{{ outline.subtitle }}</p>
      </div>
      <el-tag type="warning" effect="plain">确认后再生成每日细行程</el-tag>
    </div>

    <el-alert
      v-if="outlineWarnings.length"
      type="error"
      show-icon
      :closable="false"
      class="warn-alert"
      :title="`发现 ${outlineWarnings.length} 处问题，建议先改意见再确认细行程`"
    >
      <ul class="warn-list">
        <li v-for="(w, i) in outlineWarnings" :key="i">{{ w }}</li>
      </ul>
    </el-alert>

    <section class="block">
      <h3>总路线说明</h3>
      <p class="summary">{{ outline.routeSummary || outline.summary }}</p>
    </section>

    <section v-if="(outline.dailyOutlines || []).length" class="block">
      <h3>按天大纲</h3>
      <div class="day-list">
        <article v-for="d in outline.dailyOutlines" :key="d.day" class="day-card">
          <header>
            <strong>第 {{ d.day }} 天</strong>
            <span>{{ d.from }} → {{ d.to }}</span>
          </header>
          <p class="meta">
            <span v-if="d.distance">{{ d.distance }}</span>
            <span v-if="d.driveTime">{{ d.driveTime }}</span>
            <span>过夜：{{ overnightLabel(d.overnightType, d.overnight) }}</span>
          </p>
          <p v-if="(d.attractions || []).length" class="attrs">
            景点：{{ d.attractions.join('、') }}
          </p>
          <p v-if="d.note" class="note">{{ d.note }}</p>
          <p v-if="parseDistanceKm(d.distance) > MAX_REASONABLE_DAILY_KM" class="day-warn">
            ⚠ 当天里程过大，建议拆天
          </p>
        </article>
      </div>
    </section>

    <section class="block tags-block">
      <div v-if="(outline.coreCities || []).length">
        <h4>核心城市</h4>
        <div class="tags">
          <el-tag v-for="c in outline.coreCities" :key="c" size="small">{{ c }}</el-tag>
        </div>
      </div>
      <div v-if="(outline.routeHighlights || []).length">
        <h4>路线亮点</h4>
        <ul>
          <li v-for="(h, i) in outline.routeHighlights" :key="i">{{ h }}</li>
        </ul>
      </div>
      <div v-if="outline.accommodationStrategy">
        <h4>住宿策略</h4>
        <p>{{ outline.accommodationStrategy }}</p>
      </div>
      <div v-if="outline.dailyArrangementNote">
        <h4>每日安排</h4>
        <p>{{ outline.dailyArrangementNote }}</p>
      </div>
      <div v-if="(outline.foodHighlights || []).length">
        <h4>美食清单</h4>
        <ul>
          <li v-for="(f, i) in outline.foodHighlights" :key="i">{{ f }}</li>
        </ul>
      </div>
      <div v-if="(outline.photoHighlights || []).length">
        <h4>摄影亮点</h4>
        <ul>
          <li v-for="(p, i) in outline.photoHighlights" :key="i">{{ p }}</li>
        </ul>
      </div>
    </section>

    <section class="revise-block">
      <h3>提出修改意见</h3>
      <p class="hint">例如：「返程约 2500km 请拆成 4–5 天，不要最后一天示意」「不在广西过夜，倒数第二晚住贵州，最后一天直回南宁」</p>
      <el-input
        v-model="revisionNote"
        type="textarea"
        :rows="3"
        maxlength="800"
        show-word-limit
        placeholder="写你想改的地方，然后点「按意见重生成大纲」"
      />
      <div class="actions">
        <el-button :loading="revising" @click="emit('restart')">重新生成大纲</el-button>
        <el-button type="warning" :loading="revising" :disabled="!revisionNote.trim()" @click="submitRevise">
          按意见重生成大纲
        </el-button>
        <el-button type="primary" :loading="revising" @click="emit('confirm')">
          确认大纲，生成详细行程
        </el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.outline-preview {
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(180deg, #fff7ed, #ffffff 40%);
  border: 1px solid #fed7aa;
  box-shadow: 0 12px 28px rgba(154, 52, 18, 0.06);
}
.outline-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 12px;
}
.eyebrow {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 800;
  color: #c2410c;
}
.outline-head h2 {
  margin: 0;
  font-size: 22px;
  color: #9a3412;
  line-height: 1.35;
}
.subtitle {
  margin: 6px 0 0;
  color: #9a3412;
  opacity: 0.85;
}
.warn-alert { margin-bottom: 12px; }
.warn-list { margin: 6px 0 0; padding-left: 18px; line-height: 1.55; }
.block { margin-top: 16px; }
.block h3, .block h4 {
  margin: 0 0 8px;
  font-size: 15px;
  color: #9a3412;
}
.summary {
  margin: 0;
  line-height: 1.75;
  color: #334155;
  white-space: pre-wrap;
}
.day-list {
  display: grid;
  gap: 10px;
}
.day-card {
  padding: 12px 14px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #ffedd5;
}
.day-card header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  align-items: baseline;
  margin-bottom: 6px;
}
.day-card header strong { color: #c2410c; }
.meta {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  font-size: 12px;
  color: #64748b;
}
.attrs, .note {
  margin: 6px 0 0;
  font-size: 13px;
  color: #334155;
  line-height: 1.55;
}
.day-warn {
  margin: 6px 0 0;
  color: #b91c1c;
  font-size: 12px;
  font-weight: 700;
}
.tags-block {
  display: grid;
  gap: 14px;
}
.tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tags-block ul {
  margin: 0;
  padding-left: 18px;
  color: #334155;
  line-height: 1.6;
}
.tags-block p { margin: 0; color: #334155; line-height: 1.6; }
.revise-block {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px dashed #fdba74;
}
.hint {
  margin: 0 0 8px;
  font-size: 12px;
  color: #9a3412;
  line-height: 1.5;
}
.actions {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
@media (max-width: 640px) {
  .outline-head { flex-direction: column; }
  .actions .el-button { width: 100%; }
}
</style>
