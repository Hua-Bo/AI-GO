<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ImageStatus } from '@/types/travelTypes'

const props = defineProps<{
  src?: string
  alt?: string
  title?: string
  height?: number | string
  status?: ImageStatus
  imageSource?: string
}>()

const imageError = ref(false)

function isValidSrc(src?: string): boolean {
  if (!src) return false
  const t = src.trim()
  return Boolean(t) && t !== 'undefined' && t !== 'null'
}

const hasValidImage = computed(() =>
  isValidSrc(props.src) && !imageError.value,
)

const placeholderTitle = computed(() =>
  props.status === 'noReliableImage' ? '暂无可靠图片' : '暂无图片',
)

const placeholderDesc = computed(() =>
  props.status === 'noReliableImage' ? '已避免展示不相关图片' : '景区图片获取失败',
)

watch(() => props.src, () => {
  imageError.value = false
})

function handleImageError() {
  imageError.value = true
}
</script>

<template>
  <div class="scenic-image" :style="height ? { height: typeof height === 'number' ? `${height}px` : height } : undefined">
    <template v-if="hasValidImage">
      <img
        :src="src"
        :alt="alt || title || '景区图片'"
        crossorigin="anonymous"
        @error="handleImageError"
      >
      <div v-if="imageSource || status === 'uncertain'" class="image-caption">
        <span v-if="imageSource">图片来源：{{ imageSource }}</span>
        <span v-if="status === 'uncertain'" class="uncertain">图片仅供参考</span>
      </div>
    </template>
    <div v-else class="scenic-image-placeholder">
      <div class="placeholder-icon">🖼️</div>
      <div class="placeholder-title">{{ placeholderTitle }}</div>
      <div class="placeholder-desc">{{ placeholderDesc }}</div>
    </div>
  </div>
</template>

<style scoped>
.scenic-image {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #f8fafc, #eef2ff);
  border: 1px solid #e5e7eb;
  position: relative;
}

.scenic-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 4px 8px;
  background: rgba(15, 23, 42, 0.55);
  color: #f8fafc;
  font-size: 11px;
  display: flex;
  gap: 8px;
}

.uncertain { color: #fde68a; }

.scenic-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #94a3b8;
}

.placeholder-icon { font-size: 28px; }
.placeholder-title { font-size: 14px; font-weight: 600; color: #64748b; }
.placeholder-desc { font-size: 12px; color: #94a3b8; }
</style>
