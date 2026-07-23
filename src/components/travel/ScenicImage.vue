<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ImageStatus } from '@/types/travelTypes'
import { buildScenicImageKeyword, getScenicImage } from '@/services/travelImageApi'

const props = defineProps<{
  src?: string
  alt?: string
  title?: string
  height?: number | string
  status?: ImageStatus
  imageSource?: string
  city?: string
  name?: string
  province?: string
  spotType?: string
  imageKeyword?: string
  /** 无图时是否自动联网搜图；默认 false，避免「不要图片」仍发请求 */
  autoFetch?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:src', value: string): void
  (e: 'update:status', value: ImageStatus): void
  (e: 'update:imageSource', value: string): void
}>()

const imageError = ref(false)
const loading = ref(false)
const localSrc = ref('')
const localStatus = ref<ImageStatus | undefined>(props.status)
const localSource = ref(props.imageSource || '')
const autoTried = ref(false)

function isValidSrc(src?: string): boolean {
  if (!src) return false
  const t = src.trim()
  return Boolean(t) && t !== 'undefined' && t !== 'null'
}

const displaySrc = computed(() => localSrc.value || props.src)
const hasValidImage = computed(() => isValidSrc(displaySrc.value) && !imageError.value)

const searchKeyword = computed(() => {
  if (props.imageKeyword?.trim()) return props.imageKeyword.trim()
  const name = props.name || props.title || props.alt || ''
  const city = props.city || ''
  if (name && city) return `${city} ${name} 景区`
  if (name) return `${name} 旅游`
  return '旅游景点 风景'
})

watch(() => props.src, (v) => {
  imageError.value = false
  localSrc.value = v || ''
})

watch(() => props.status, (v) => {
  localStatus.value = v
})

watch(() => props.imageSource, (v) => {
  localSource.value = v || ''
})

// 仅当显式开启 autoFetch 时，无图才自动联网检索
watch(
  () => [props.autoFetch, props.src, props.name, props.title, props.imageKeyword, props.city] as const,
  async ([autoFetch, src, name, title, imageKeyword]) => {
    if (!autoFetch) return
    if (isValidSrc(src) || loading.value || autoTried.value) return
    if (!(name || title || imageKeyword)) return
    autoTried.value = true
    await retrySearch({ openOnFail: false })
  },
  { immediate: true },
)

function handleImageError() {
  imageError.value = true
}

function openImageSearch() {
  window.open(`https://www.bing.com/images/search?q=${encodeURIComponent(searchKeyword.value)}`, '_blank')
}

async function retrySearch(options?: { openOnFail?: boolean }) {
  if (loading.value) return
  loading.value = true
  imageError.value = false
  try {
    const result = await getScenicImage({
      name: props.name || props.title || props.alt || searchKeyword.value,
      city: props.city || '',
      province: props.province || '',
      spotType: (props.spotType as any) || 'scenic',
      imageKeyword: searchKeyword.value,
    })
    if (result.url) {
      localSrc.value = result.url
      localStatus.value = result.status
      localSource.value = result.source
      emit('update:src', result.url)
      emit('update:status', result.status)
      emit('update:imageSource', result.source)
    } else {
      localStatus.value = 'noReliableImage'
      if (options?.openOnFail !== false) openImageSearch()
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <!-- 无图时不渲染占位，避免一堆空白框 -->
  <div
    v-if="loading || hasValidImage"
    class="scenic-image"
    :style="height ? { height: typeof height === 'number' ? `${height}px` : height } : undefined"
  >
    <template v-if="loading">
      <div class="scenic-image-placeholder">
        <div class="placeholder-icon">⏳</div>
        <div class="placeholder-title">图片加载中...</div>
      </div>
    </template>
    <template v-else>
      <img
        :src="displaySrc"
        :alt="alt || title || name || '景区图片'"
        referrerpolicy="no-referrer"
        @error="handleImageError"
      >
      <div v-if="localSource || localStatus === 'uncertain'" class="image-caption">
        <span v-if="localSource">图片来源：{{ localSource }}</span>
        <span v-if="localStatus === 'uncertain'" class="uncertain">图片仅供参考</span>
      </div>
    </template>
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
  padding: 12px;
  text-align: center;
  box-sizing: border-box;
}

.placeholder-icon { font-size: 28px; }
.placeholder-title { font-size: 14px; font-weight: 600; color: #64748b; }
.placeholder-desc { font-size: 12px; color: #94a3b8; }

.placeholder-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 4px;
}

.retry-btn,
.search-btn {
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.search-btn {
  background: #fff;
  border-color: #e2e8f0;
  color: #475569;
}
</style>
