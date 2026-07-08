<script setup lang="ts">
defineProps<{
  hasApiKey: boolean
  hasPlan: boolean
  planning: boolean
  canGenerate: boolean
  modelName?: string
}>()

const emit = defineEmits<{
  openConfig: []
  reset: []
  plan: []
}>()
</script>

<template>
  <header class="travel-header no-print">
    <div class="header-content">
      <div class="header-text">
        <h1 class="hero-title">AI 旅游攻略推荐</h1>
        <p class="hero-subtitle">多出发地 · 指定终点 · 自动推荐路线 · 一键生成图文攻略</p>
        <div class="status-tags">
          <el-tag v-if="!hasApiKey" type="warning" size="small" effect="plain">请填写 AI Key</el-tag>
          <el-tag v-else type="success" size="small" effect="plain">{{ modelName || 'AI 已配置' }}</el-tag>
          <el-tag v-if="hasPlan" type="info" size="small" effect="plain">攻略已生成</el-tag>
          <el-tag v-if="hasPlan" type="warning" size="small" effect="plain">可导出</el-tag>
        </div>
      </div>
      <div class="header-actions">
        <el-button class="soft-btn" @click="emit('openConfig')">AI 配置</el-button>
        <el-button class="soft-btn" @click="emit('reset')">重置配置</el-button>
        <el-button class="primary-btn" :loading="planning" :disabled="!canGenerate || planning" @click="emit('plan')">
          {{ planning ? '正在生成...' : 'AI 规划路线' }}
        </el-button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.travel-header {
  position: relative;
  overflow: hidden;
  padding: 32px 36px;
  border-radius: 28px;
  background:
    linear-gradient(135deg, rgba(219, 234, 254, 0.95), rgba(240, 253, 244, 0.9), rgba(254, 249, 195, 0.9));
  box-shadow: 0 20px 50px rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.7);
  margin-bottom: 18px;
}
.travel-header::before {
  content: "";
  position: absolute;
  width: 220px;
  height: 220px;
  right: -60px;
  top: -80px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.22), transparent 65%);
  border-radius: 999px;
}
.travel-header::after {
  content: "✈️";
  position: absolute;
  right: 80px;
  bottom: 24px;
  font-size: 56px;
  opacity: 0.16;
  transform: rotate(-12deg);
}
.header-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}
.hero-title {
  margin: 0;
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: #0f172a;
}
.hero-subtitle {
  margin: 10px 0 12px;
  font-size: 15px;
  color: #475569;
}
.status-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.soft-btn {
  border-radius: 999px;
}
.primary-btn {
  border: none;
  border-radius: 999px;
  color: #fff;
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  box-shadow: 0 10px 24px rgba(59, 130, 246, 0.25);
}
</style>
