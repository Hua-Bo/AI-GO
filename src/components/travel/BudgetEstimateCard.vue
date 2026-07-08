<script setup lang="ts">
import type { BudgetEstimate } from '@/types/travelTypes'

defineProps<{
  budget: BudgetEstimate
}>()
</script>

<template>
  <div class="budget-grid">
    <div class="budget-item">
      <span class="label">交通</span>
      <span class="value">{{ budget.transport }}</span>
    </div>
    <div class="budget-item">
      <span class="label">住宿</span>
      <span class="value">{{ budget.hotel }}</span>
    </div>
    <div class="budget-item">
      <span class="label">门票</span>
      <span class="value">{{ budget.tickets }}</span>
    </div>
    <div class="budget-item">
      <span class="label">餐饮</span>
      <span class="value">{{ budget.food }}</span>
    </div>
    <div class="budget-item total">
      <span class="label">预估总计</span>
      <span class="value">{{ budget.total }}</span>
    </div>
  </div>
</template>

<style scoped>
.budget-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.budget-item {
  padding: 16px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid var(--travel-border);
}

.budget-item.total {
  grid-column: 1 / -1;
  background: var(--travel-primary-light);
  border-color: #93c5fd;
}

.label {
  display: block;
  font-size: 12px;
  color: var(--travel-text-secondary);
  margin-bottom: 6px;
}

.value {
  font-size: 15px;
  font-weight: 600;
  color: var(--travel-text);
}

.total .value {
  font-size: 18px;
  color: var(--travel-primary);
}
</style>
