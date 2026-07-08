<script setup lang="ts">
const specialPlaceHint = defineModel<string>('specialPlaceHint', { required: false, default: '' })
</script>

<template>
  <div class="form-card">
    <div class="form-card-header">
      <span class="form-card-icon">✨</span>
      <div>
        <div class="form-card-title">偏好补充</div>
        <div class="form-card-desc">补充特殊点位或玩法线索</div>
      </div>
    </div>

    <div class="form-field">
      <label class="form-label">特殊点位 / 线索</label>
      <el-input
        v-model="specialPlaceHint"
        type="textarea"
        :rows="2"
        placeholder="例如：宜兴上厂村附近濉溪玩水点，车能开到河边、小众溪流、能露营"
      />
      <p class="form-help">AI 会优先参考你提供的具体地点线索。</p>
    </div>
  </div>
</template>

<style scoped>
@import './travel-form.css';
</style>
