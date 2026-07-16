<script setup lang="ts">
import { ref } from 'vue'
import { compressImage, uploadImageFile } from '@/api/agri'

const props = defineProps<{
  modelValue: string[]
  max?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [urls: string[]]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

function openCamera() {
  inputRef.value?.click()
}

async function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files || [])
  input.value = ''
  if (!files.length) return
  const max = props.max || 5
  const remain = Math.max(0, max - props.modelValue.length)
  if (!remain) return
  uploading.value = true
  try {
    const next = [...props.modelValue]
    for (const file of files.slice(0, remain)) {
      const compressed = await compressImage(file)
      const url = await uploadImageFile(compressed)
      next.push(url)
    }
    emit('update:modelValue', next.slice(0, max))
  } finally {
    uploading.value = false
  }
}

function removeAt(i: number) {
  const next = props.modelValue.filter((_, idx) => idx !== i)
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="photo-uploader">
    <p class="tips">先拍整株，再拍有问题的地方</p>
    <button type="button" class="agri-primary-btn" :disabled="uploading || modelValue.length >= (max || 5)" @click="openCamera">
      {{ uploading ? '处理中…' : (modelValue.length ? '继续拍照' : '拍照看看') }}
    </button>
    <input
      ref="inputRef"
      class="hidden"
      type="file"
      accept="image/*"
      capture="environment"
      multiple
      @change="onPick"
    >
    <div v-if="modelValue.length" class="thumbs">
      <div v-for="(url, i) in modelValue" :key="i" class="thumb">
        <img :src="url" alt="作物照片">
        <button type="button" class="del" @click="removeAt(i)">删</button>
      </div>
    </div>
    <p class="count">已拍 {{ modelValue.length }}/{{ max || 5 }} 张</p>
  </div>
</template>

<style scoped>
.tips {
  margin: 0 0 14px;
  text-align: center;
  color: #687268;
  font-size: 17px;
}
.hidden { display: none; }
.thumbs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}
.thumb {
  position: relative;
  aspect-ratio: 1;
  border-radius: 14px;
  overflow: hidden;
  background: #EEF2EE;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.del {
  position: absolute;
  top: 6px;
  right: 6px;
  min-width: 36px;
  min-height: 36px;
  border: none;
  border-radius: 999px;
  background: rgba(31, 42, 31, 0.72);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.count {
  margin: 12px 0 0;
  text-align: center;
  color: #687268;
  font-size: 15px;
}
</style>
