<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAgriStore } from '@/stores/agri'
import { loadAiConfig } from '@/utils/travelAiConfigStorage'

const router = useRouter()
const store = useAgriStore()
const { crop, hasCropProfile } = storeToRefs(store)

const useMock = String(import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false'
const aiConfigured = computed(() => Boolean(loadAiConfig().apiKey?.trim()))
</script>

<template>
  <main class="agri-page">
    <h1 class="agri-title">设置</h1>
    <p class="agri-subtitle">只保留必要选项</p>

    <section class="agri-card">
      <h2>作物档案</h2>
      <p v-if="hasCropProfile">{{ crop.name }} · {{ crop.growType === 'greenhouse' ? '大棚' : '露天' }} · {{ crop.area }}</p>
      <p v-else>还没有填写</p>
      <button type="button" class="agri-secondary-btn" @click="router.push('/agri-assistant/crop')">
        {{ hasCropProfile ? '修改档案' : '去填写' }}
      </button>
    </section>

    <section class="agri-card">
      <h2>分析模式</h2>
      <p>{{ useMock ? '当前：演示 Mock（可离线体验）' : '当前：真实接口' }}</p>
      <p class="muted">
        {{ aiConfigured
          ? '已检测到 AI Key，演示模式下也可直连模型分析。'
          : '未配置 Key 时使用本地演示结果。可到旅游攻略页配置 AI Key。' }}
      </p>
      <button type="button" class="agri-secondary-btn" @click="router.push('/travel-planner')">
        去配置 AI Key
      </button>
    </section>

    <section class="agri-card">
      <h2>使用说明</h2>
      <p>1. 按住说话，说明地里问题</p>
      <p>2. 或直接拍照给 AI 看</p>
      <p>3. 听建议，做今天该做的事</p>
    </section>
  </main>
</template>

<style scoped>
.agri-card {
  margin-top: 14px;
}
h2 {
  margin: 0 0 10px;
  font-size: 20px;
}
p {
  margin: 0 0 8px;
  font-size: 16px;
  line-height: 1.5;
}
.muted { color: #687268; }
.agri-secondary-btn { margin-top: 8px; }
</style>
