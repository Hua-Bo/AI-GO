<script setup lang="ts">
import type { AgriStatus } from '@/types/agri'

defineProps<{
  status: AgriStatus
  text: string
}>()
</script>

<template>
  <span class="status-tag" :class="status">{{ text }}</span>
</template>

<style scoped>
.status-tag {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 700;
}
.status-tag.normal { background: #E8F5E9; color: #2F7D32; }
.status-tag.attention { background: #FFF6E0; color: #B7791F; }
.status-tag.danger { background: #FDECEC; color: #D94B3D; }
</style>
