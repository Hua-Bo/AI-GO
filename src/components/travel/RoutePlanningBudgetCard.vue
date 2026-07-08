<script setup lang="ts">
import type { RoutePlanningBudget } from '@/types/travelTypes'

defineProps<{
  budget: RoutePlanningBudget
}>()
</script>

<template>
  <div class="budget-grid">
    <div class="budget-item"><span class="label">交通</span><span class="value">{{ budget.transport }}</span></div>
    <div class="budget-item"><span class="label">住宿</span><span class="value">{{ budget.hotel }}</span></div>
    <div class="budget-item"><span class="label">门票</span><span class="value">{{ budget.tickets }}</span></div>
    <div class="budget-item"><span class="label">餐饮</span><span class="value">{{ budget.food }}</span></div>
    <div class="budget-item"><span class="label">其他</span><span class="value">{{ budget.other }}</span></div>
    <div class="budget-item total"><span class="label">预估总计</span><span class="value">{{ budget.total }}</span></div>
  </div>
</template>

<style scoped>
.budget-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; }
.budget-item { padding: 14px; border-radius: 10px; background: #f8fafc; border: 1px solid var(--travel-border); }
.budget-item.total { grid-column: 1 / -1; background: var(--travel-primary-light); border-color: #93c5fd; }
.label { display: block; font-size: 12px; color: var(--travel-text-secondary); margin-bottom: 4px; }
.value { font-size: 14px; font-weight: 600; }
.total .value { font-size: 17px; color: var(--travel-primary); }
</style>
