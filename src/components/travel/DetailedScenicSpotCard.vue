<script setup lang="ts">
import type { DetailedScenicSpot } from '@/types/travelTypes'
import { SPOT_TYPE_LABELS } from '@/types/travelTypes'
import ScenicImage from './ScenicImage.vue'

defineProps<{ spot: DetailedScenicSpot }>()
</script>

<template>
  <div class="spot-detail-card trip-scenic-card">
    <div class="img-wrap trip-scenic-image">
      <ScenicImage
        :src="spot.image"
        :alt="spot.name"
        :status="spot.imageStatus"
        :image-source="spot.imageSource"
      />
    </div>
    <div class="body">
      <div class="head-row">
        <h4>{{ spot.name }} <span class="city">{{ spot.city }}</span></h4>
        <div class="badges">
          <el-tag :type="spot.isFree ? 'success' : 'warning'" size="small" effect="plain">
            {{ spot.isFree ? '免费' : '收费' }}
          </el-tag>
          <el-tag type="info" size="small" effect="plain">{{ SPOT_TYPE_LABELS[spot.spotType] || spot.spotType }}</el-tag>
        </div>
      </div>
      <p class="reason">{{ spot.reason }}</p>
      <p class="desc">{{ spot.description }}</p>
      <div class="meta-grid">
        <div><span>门票</span><strong>{{ spot.isFree ? '免费' : spot.ticketPrice }}</strong></div>
        <div><span>时长</span><strong>{{ spot.suggestedDuration }}</strong></div>
        <div><span>最佳时间</span><strong>{{ spot.bestVisitTime }}</strong></div>
        <div v-if="spot.parkingInfo"><span>停车/交通</span><strong>{{ spot.parkingInfo }}</strong></div>
      </div>
      <div v-if="(spot.costTips || []).length" class="block cost-tips">
        <strong>费用提示</strong>
        <p>{{ spot.costTips.join('；') }}</p>
      </div>
      <div v-if="(spot.suitableFor || []).length" class="block">
        <strong>适合人群</strong><p>{{ spot.suitableFor.join('、') }}</p>
      </div>
      <div v-if="(spot.playRoute || []).length" class="block">
        <strong>游玩路线</strong>
        <p>{{ spot.playRoute.join(' → ') }}</p>
      </div>
      <div v-if="(spot.mustSeePoints || []).length" class="block">
        <strong>必看点</strong><p>{{ spot.mustSeePoints.join('、') }}</p>
      </div>
      <div v-if="(spot.photoSpots || []).length" class="block">
        <strong>拍照点</strong><p>{{ spot.photoSpots.join('、') }}</p>
      </div>
      <div v-if="(spot.avoidPitfalls || []).length" class="block warn">
        <strong>避坑</strong><p>{{ spot.avoidPitfalls.join('；') }}</p>
      </div>
      <div v-if="(spot.tags || []).length" class="tags">
        <el-tag v-for="t in spot.tags" :key="t" size="small" effect="plain">{{ t }}</el-tag>
      </div>
      <div v-if="spot.carAccess" class="block car-access">
        <strong>🚗 车辆可达性</strong>
        <p>可开到附近：{{ spot.carAccess.canDriveNear ? '是' : '否/需步行' }}</p>
        <p>停车距离：{{ spot.carAccess.parkingDistance || '以现场为准' }}</p>
        <p>路况：{{ spot.carAccess.roadCondition || '以现场为准' }}</p>
        <p>步行：{{ spot.carAccess.walkingDistance || '以现场为准' }}</p>
        <p>安全：{{ spot.carAccess.safetyNote || '注意天气变化和涉水风险' }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.spot-detail-card { display: grid; grid-template-columns: 170px minmax(0, 1fr); gap: 16px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 26px; margin-bottom: 12px; background: #fff; box-shadow: 0 14px 36px rgba(15,23,42,0.055); transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
.spot-detail-card:hover { transform: translateY(-2px); }
.img-wrap { width: 170px; height: 126px; border-radius: 20px; overflow: hidden; background: linear-gradient(135deg, #f1f5f9, #e0f2fe); }
.head-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
.body h4 { margin: 0; font-size: 16px; }
.badges { display: flex; gap: 4px; flex-wrap: wrap; }
.city { font-size: 13px; color: var(--travel-text-secondary); font-weight: normal; }
.reason { margin: 0 0 6px; font-size: 13px; color: var(--travel-primary); }
.desc { margin: 0 0 10px; font-size: 13px; line-height: 1.55; color: var(--travel-text-secondary); }
.meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 10px; font-size: 12px; }
.meta-grid span { display: block; color: var(--travel-text-secondary); }
.block { margin-bottom: 8px; font-size: 13px; }
.block strong { display: block; margin-bottom: 2px; font-size: 12px; color: var(--travel-text-secondary); }
.block p { margin: 0; line-height: 1.5; }
.block.warn p { color: #b45309; }
.cost-tips p { color: #0369a1; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
@media (max-width: 640px) { .spot-detail-card { grid-template-columns: 1fr; } }
</style>
