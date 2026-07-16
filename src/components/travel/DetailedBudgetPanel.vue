<script setup lang="ts">
import type { DetailedBudget } from '@/types/travelTypes'
import { formatMoneyValue } from '@/utils/travelNormalize'

defineProps<{ budget: DetailedBudget }>()

const catLabel: Record<string, string> = {
  transport: '交通', hotel: '住宿', ticket: '门票', food: '餐饮',
  parking: '停车', charging: '充电', fuel: '油费', other: '其他',
}
</script>

<template>
  <div class="budget-panel">
    <div class="totals">
      <div class="total-item">
        <span>人均估算</span>
        <strong>{{ formatMoneyValue(budget.perPersonEstimate, '见明细') }}</strong>
      </div>
      <div class="total-item highlight">
        <span>全程总计</span>
        <strong>{{ formatMoneyValue(budget.totalEstimate, '—') }}</strong>
      </div>
    </div>

    <div v-if="(budget.items || []).length" class="budget-grid">
      <div v-for="(item, i) in budget.items" :key="i" class="budget-item">
        <p class="cat">{{ catLabel[item.category] || item.category }}</p>
        <strong class="amount">{{ formatMoneyValue(item.amount, '以实际为准') }}</strong>
        <p class="name">{{ item.name }}</p>
        <p class="desc">{{ item.description || '以实际为准' }}</p>
      </div>
    </div>

    <ul v-if="(budget.notes || []).length" class="notes">
      <li v-for="(n, i) in budget.notes" :key="i">{{ n }}</li>
    </ul>
  </div>
</template>

<style scoped>
.budget-panel { font-size: 13px; }
.totals { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
.total-item { padding: 14px 20px; background: #f8fafc; border-radius: 10px; border: 1px solid var(--travel-border); }
.total-item span { display: block; font-size: 12px; color: var(--travel-text-secondary); margin-bottom: 4px; }
.total-item strong { font-size: 18px; }
.total-item.highlight { background: var(--travel-primary-light); border-color: #93c5fd; }
.total-item.highlight strong { color: var(--travel-primary); font-size: 20px; }
.budget-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.budget-item { border: 1px solid #e5e7eb; background: #f8fafc; border-radius: 16px; padding: 14px; }
.cat { margin: 0; font-size: 12px; color: var(--travel-text-secondary); }
.name { margin: 4px 0 0; font-size: 12px; color: var(--travel-text); }
.amount { font-weight: 600; white-space: nowrap; }
.desc { margin: 4px 0 0; color: var(--travel-text-secondary); font-size: 12px; }
.notes { margin: 12px 0 0; padding-left: 20px; font-size: 12px; color: var(--travel-text-secondary); line-height: 1.6; }
@media (max-width: 960px) {
  .budget-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .budget-grid { grid-template-columns: 1fr; }
}
</style>
