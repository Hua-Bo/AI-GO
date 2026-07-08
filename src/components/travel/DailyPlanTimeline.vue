<script setup lang="ts">
import type { DailyPlan } from '@/types/travelTypes'

defineProps<{
  plans: DailyPlan[]
}>()

const typeIcon: Record<string, string> = {
  transport: '🚗',
  scenic: '🏞️',
  food: '🍜',
  hotel: '🏨',
  free: '🌙',
}
</script>

<template>
  <div class="timeline">
    <div v-for="plan in plans" :key="plan.day" class="day-block">
      <div class="day-head">
        <span class="day-num">D{{ plan.day }}</span>
        <div>
          <h4>{{ plan.title }}</h4>
          <span v-if="plan.dateText" class="date">{{ plan.dateText }}</span>
        </div>
      </div>
      <div class="day-items">
        <div v-for="(item, idx) in plan.items" :key="idx" class="timeline-item">
          <div class="rail">
            <span class="dot" />
            <span v-if="idx < plan.items.length - 1" class="line" />
          </div>
          <div class="item-card">
            <div class="item-head">
              <span class="time">{{ item.time }}</span>
              <span class="type">{{ typeIcon[item.type] }} {{ item.title }}</span>
            </div>
            <p class="desc">{{ item.description }}</p>
            <div v-if="item.cost || item.duration" class="item-meta">
              <span v-if="item.duration">⏱ {{ item.duration }}</span>
              <span v-if="item.cost">💰 {{ item.cost }}</span>
            </div>
            <p v-if="item.tips" class="tips">{{ item.tips }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.day-block {
  margin-bottom: 24px;
}

.day-head {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;
}

.day-num {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--travel-primary-light);
  color: var(--travel-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.day-head h4 {
  margin: 0;
  font-size: 16px;
}

.date {
  font-size: 12px;
  color: var(--travel-text-secondary);
}

.timeline-item {
  display: flex;
  gap: 12px;
}

.rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 16px;
  padding-top: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--travel-primary);
  flex-shrink: 0;
}

.line {
  flex: 1;
  width: 2px;
  background: var(--travel-border);
  margin: 4px 0;
}

.item-card {
  flex: 1;
  padding-bottom: 16px;
}

.item-head {
  display: flex;
  gap: 12px;
  align-items: baseline;
  flex-wrap: wrap;
}

.time {
  font-weight: 600;
  color: var(--travel-primary);
  font-size: 14px;
}

.type {
  font-weight: 600;
  font-size: 14px;
}

.desc {
  margin: 6px 0;
  font-size: 13px;
  color: var(--travel-text-secondary);
  line-height: 1.55;
}

.item-meta {
  display: flex;
  gap: 14px;
  font-size: 12px;
  color: var(--travel-text-secondary);
}

.tips {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--travel-warning);
}
</style>
