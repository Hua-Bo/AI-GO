<script setup lang="ts">
import type { TravelGuide } from '@/types/travelTypes'
import BudgetEstimateCard from './BudgetEstimateCard.vue'
import TravelDownloadActions from './TravelDownloadActions.vue'
import ScenicImage from './ScenicImage.vue'

defineProps<{
  guide: TravelGuide | null
}>()
</script>

<template>
  <div v-if="guide" class="guide-preview" id="travel-guide-report">
    <div class="preview-head">
      <div>
        <h2>{{ guide.title }}</h2>
        <p class="summary">{{ guide.summary }}</p>
      </div>
      <TravelDownloadActions :guide="guide" />
    </div>

    <section v-if="guide.routeOverview" class="doc-section">
      <h3>行程总览</h3>
      <p class="text-block">{{ guide.routeOverview }}</p>
    </section>

    <section v-if="guide.arrangementReason" class="doc-section">
      <h3>为什么这样安排</h3>
      <p class="text-block">{{ guide.arrangementReason }}</p>
    </section>

    <section v-if="guide.meetingPlan || guide.meetupAdvice" class="doc-section">
      <h3>多出发地汇合方案</h3>
      <p v-if="guide.meetingPlan" class="text-block">{{ guide.meetingPlan }}</p>
      <el-alert v-if="guide.meetupAdvice" type="success" :closable="false" show-icon>
        <template #title>{{ guide.meetupAdvice.city }} · {{ guide.meetupAdvice.time }}</template>
        <p>先到：{{ guide.meetupAdvice.earlyArrival }}</p>
        <p>晚到：{{ guide.meetupAdvice.lateArrival }}</p>
      </el-alert>
    </section>

    <section class="doc-section">
      <h3>基本信息</h3>
      <div class="info-grid">
        <div><span>目的地</span><strong>{{ guide.destination }}</strong></div>
        <div><span>游玩天数</span><strong>{{ guide.days }} 天</strong></div>
        <div><span>总人数</span><strong>{{ guide.peopleTotal }} 人</strong></div>
      </div>
    </section>

    <section class="doc-section">
      <h3>交通方案</h3>
      <div v-for="(r, i) in guide.routePlans" :key="i" class="route-row">
        <strong>{{ r.fromCity || r.fromAddress }} → {{ r.toCity }}</strong>
        <span>{{ r.distance }} · {{ r.duration }} · {{ r.costRange }}</span>
        <ul><li v-for="(t, j) in r.routeTips" :key="j">{{ t }}</li></ul>
      </div>
    </section>

    <section v-if="guide.routeSegments?.length" class="doc-section">
      <h3>沿途路线</h3>
      <div v-for="(seg, i) in guide.routeSegments" :key="i" class="route-seg">
        <strong>
          <span v-if="seg.day">第 {{ seg.day }} 天 · </span>
          {{ seg.from }} → {{ seg.to }}
        </strong>
        <span class="seg-meta">{{ seg.distanceText }} · {{ seg.durationText }}</span>
        <p>{{ seg.transportSuggestion }}</p>
        <ul v-if="seg.tips?.length"><li v-for="(t, j) in seg.tips" :key="j">{{ t }}</li></ul>
      </div>
    </section>

    <section class="doc-section">
      <h3>推荐景区</h3>
      <div class="spot-thumbs">
        <div v-for="s in guide.selectedSpots" :key="s.id" class="thumb">
          <div class="thumb-img"><ScenicImage :src="s.image" :alt="s.name" /></div>
          <div><strong>{{ s.name }}</strong><span>{{ s.ticketPrice }}</span></div>
        </div>
      </div>
    </section>

    <section v-if="guide.spotDetails?.length" class="doc-section">
      <h3>景区详情</h3>
      <div v-for="(sd, i) in guide.spotDetails" :key="i" class="spot-detail-card">
        <h4>{{ sd.spotName }}</h4>
        <p><strong>推荐原因：</strong>{{ sd.recommendedReason }}</p>
        <p><strong>游玩时长：</strong>{{ sd.duration }} · <strong>最佳时间：</strong>{{ sd.bestTime }}</p>
        <p><strong>门票：</strong>{{ sd.ticketTip }} · <strong>停车：</strong>{{ sd.parkingTip }}</p>
        <p v-if="sd.photoTips?.length"><strong>拍照点：</strong>{{ sd.photoTips.join('、') }}</p>
        <p v-if="sd.avoidPitfalls?.length"><strong>避坑：</strong>{{ sd.avoidPitfalls.join('；') }}</p>
      </div>
    </section>

    <section class="doc-section">
      <h3>每日行程</h3>
      <div class="daily-readonly">
        <div v-for="day in guide.dailyPlans" :key="day.day" class="day-read">
          <h4>{{ day.title }}</h4>
          <div v-for="(item, ii) in day.items" :key="ii" class="item-read">
            <span class="time">{{ item.time }}</span>
            <span class="title">{{ item.title }}</span>
            <span class="desc">{{ item.description }}</span>
          </div>
        </div>
      </div>
    </section>

    <section v-if="guide.drivingDetails?.length" class="doc-section">
      <h3>自驾细节</h3>
      <ul class="tip-list"><li v-for="(t, i) in guide.drivingDetails" :key="i">{{ t }}</li></ul>
    </section>

    <section v-if="guide.publicTransportDetails?.length" class="doc-section">
      <h3>高铁 / 飞机细节</h3>
      <ul class="tip-list"><li v-for="(t, i) in guide.publicTransportDetails" :key="i">{{ t }}</li></ul>
    </section>

    <section class="doc-section">
      <h3>美食推荐</h3>
      <el-table :data="guide.foodRecommendations" size="small" stripe>
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="type" label="类型" width="80" />
        <el-table-column prop="description" label="介绍" />
        <el-table-column prop="avgCost" label="人均" width="100" />
        <el-table-column prop="avoidTip" label="避坑" />
      </el-table>
    </section>

    <section class="doc-section">
      <h3>住宿建议</h3>
      <div class="hotel-list">
        <div v-for="(h, i) in guide.hotelSuggestions" :key="i" class="hotel-card">
          <strong>{{ h.area }}</strong>
          <p>{{ h.reason }}</p>
          <span>{{ h.priceRange }} · 适合 {{ h.suitableFor }}</span>
        </div>
      </div>
    </section>

    <section class="doc-section">
      <h3>费用预算</h3>
      <BudgetEstimateCard :budget="guide.budgetEstimate" />
      <p v-if="guide.budgetEstimate.parkingCharging" class="sub-line">停车/充电/高速：{{ guide.budgetEstimate.parkingCharging }}</p>
    </section>

    <section class="doc-section">
      <h3>出行清单</h3>
      <div class="packing-list">
        <label v-for="(item, i) in (guide.packingList || [])" :key="i" class="pack-item">
          <input type="checkbox"><span>{{ item }}</span>
        </label>
      </div>
    </section>

    <section v-if="guide.weatherTips?.length" class="doc-section">
      <h3>天气与装备</h3>
      <ul class="tip-list"><li v-for="(t, i) in guide.weatherTips" :key="i">{{ t }}</li></ul>
    </section>

    <section v-if="guide.backupPlans?.length" class="doc-section">
      <h3>备选方案</h3>
      <ul class="tip-list"><li v-for="(t, i) in guide.backupPlans" :key="i">{{ t }}</li></ul>
    </section>

    <section class="doc-section">
      <h3>注意事项</h3>
      <el-alert v-for="(tip, i) in (guide.tips || [])" :key="i" :title="tip" type="warning" :closable="false" show-icon class="tip-alert" />
    </section>
  </div>

  <div v-else class="guide-empty">
    <div class="empty-icon">🗺️</div>
    <p>完成路线规划后，点击「生成旅游攻略」预览完整文档</p>
  </div>
</template>

<style scoped>
.guide-preview { background: var(--travel-card); border-radius: var(--travel-radius); border: 1px solid var(--travel-border); padding: 24px; margin-top: 20px; }
.preview-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; padding-bottom: 20px; border-bottom: 1px solid var(--travel-border); margin-bottom: 20px; }
.preview-head h2 { margin: 0; font-size: 22px; }
.summary { margin: 8px 0 0; color: var(--travel-text-secondary); line-height: 1.6; max-width: 720px; }
.doc-section { margin-bottom: 28px; }
.doc-section h3 { margin: 0 0 14px; font-size: 16px; font-weight: 600; padding-left: 10px; border-left: 3px solid var(--travel-primary); }
.text-block { margin: 0; line-height: 1.7; font-size: 14px; color: var(--travel-text-secondary); }
.info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
.info-grid div { padding: 12px 14px; background: #f8fafc; border-radius: 10px; }
.info-grid span { display: block; font-size: 12px; color: var(--travel-text-secondary); }
.route-row, .route-seg { padding: 12px 0; border-bottom: 1px dashed var(--travel-border); font-size: 13px; }
.seg-meta { display: block; color: var(--travel-text-secondary); margin: 4px 0; }
.route-row ul { margin: 6px 0 0; padding-left: 18px; color: var(--travel-text-secondary); }
.spot-thumbs { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.thumb { display: flex; gap: 10px; align-items: center; padding: 8px; border: 1px solid var(--travel-border); border-radius: 10px; }
.thumb-img { width: 72px; height: 48px; flex-shrink: 0; border-radius: 6px; overflow: hidden; }
.thumb strong { display: block; font-size: 13px; }
.thumb span { font-size: 11px; color: var(--travel-text-secondary); }
.spot-detail-card { padding: 14px; background: #f8fafc; border-radius: 10px; margin-bottom: 12px; font-size: 13px; line-height: 1.6; }
.spot-detail-card h4 { margin: 0 0 8px; }
.daily-readonly .day-read { margin-bottom: 16px; }
.day-read h4 { margin: 0 0 8px; }
.item-read { display: grid; grid-template-columns: 60px 120px 1fr; gap: 8px; font-size: 13px; padding: 4px 0; }
.item-read .time { color: var(--travel-primary); font-weight: 500; }
.hotel-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.hotel-card { padding: 14px; background: #f8fafc; border-radius: 10px; font-size: 13px; }
.packing-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; }
.pack-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.tip-list { margin: 0; padding-left: 20px; line-height: 1.7; font-size: 14px; }
.tip-alert { margin-bottom: 8px; }
.sub-line { margin-top: 8px; font-size: 13px; color: var(--travel-text-secondary); }
.guide-empty { text-align: center; padding: 60px 24px; background: var(--travel-card); border-radius: var(--travel-radius); border: 1px dashed var(--travel-border); margin-top: 20px; color: var(--travel-text-secondary); }
.empty-icon { font-size: 48px; margin-bottom: 12px; }
</style>
