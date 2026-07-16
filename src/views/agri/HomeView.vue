<script setup lang="ts">
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import BigActionButton from '@/components/agri/BigActionButton.vue'
import { useAgriStore } from '@/stores/agri'

const router = useRouter()
const store = useAgriStore()
const { greeting, crop, hasCropProfile } = storeToRefs(store)
</script>

<template>
  <main class="agri-page">
    <header class="hero">
      <h1 class="agri-title">{{ greeting }}</h1>
      <p class="agri-subtitle">今天想做什么？</p>
      <p v-if="hasCropProfile" class="crop-line">当前作物：{{ crop.name }}</p>
      <button v-else type="button" class="agri-ghost-btn setup" @click="router.push('/agri-assistant/crop')">
        先填写作物档案
      </button>
    </header>

    <div class="actions">
      <BigActionButton
        title="按住说话"
        desc="告诉我地里出了什么问题"
        @click="router.push('/agri-assistant/voice')"
      />
      <BigActionButton
        title="拍照看看"
        desc="拍叶子、果实或者整株"
        accent="orange"
        @click="router.push('/agri-assistant/camera')"
      />
      <BigActionButton
        title="今天干什么"
        desc="看看今天最重要的事"
        accent="blue"
        @click="router.push('/agri-assistant/today')"
      />
      <BigActionButton
        title="种植记录"
        desc="查看以前的检查结果"
        @click="router.push('/agri-assistant/records')"
      />
    </div>

    <button type="button" class="settings-link" @click="router.push('/agri-assistant/settings')">
      设置
    </button>
  </main>
</template>

<style scoped>
.hero { margin-bottom: 22px; }
.crop-line {
  margin: 10px 0 0;
  color: #2F7D32;
  font-size: 16px;
  font-weight: 700;
}
.setup { padding-left: 0; margin-top: 6px; }
.actions {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.settings-link {
  display: block;
  width: 100%;
  margin-top: 18px;
  min-height: 44px;
  border: none;
  background: transparent;
  color: #687268;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
</style>
