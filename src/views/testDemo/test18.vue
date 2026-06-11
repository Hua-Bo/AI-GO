<template>
  <div class="container">
    <div class="title-bar">
      <h1 class="title">{{ displayTitle }}</h1>
      <button class="link" @click="isEditingTitle = !isEditingTitle">
        {{ isEditingTitle ? '完成' : '编辑标题' }}
      </button>
    </div>

    <div v-if="isEditingTitle" class="title-editor">
      <input
        v-model="internalTitle"
        type="text"
        class="title-input"
        :placeholder="fileTitle || props.title || DEFAULT_TITLE"
        @input="titleDirty = true"
        @keyup.enter="isEditingTitle = false"
      />
      <div class="btns">
        <button class="btn secondary" v-if="fileTitle" @click="resetToFile">重置为文件名</button>
        <button class="btn secondary" v-if="props.title" @click="resetToProp">重置为传入标题</button>
      </div>
    </div>

    <input type="file" @change="onFileChange" accept=".json" />
    <button :disabled="!blobUrl" @click="download" class="btn">下载新 JSON</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// 可选标题 Prop
const props = defineProps<{ title?: string }>()
const DEFAULT_TITLE = '生成只包含 Attributes 的 JSON'

// 标题编辑相关
const isEditingTitle = ref(false)
const internalTitle = ref<string>('')              // 用户编辑的标题
const titleDirty = ref(false)                      // 是否被用户修改过
const fileTitle = ref<string>('')                  // 由文件名派生的标题（不含后缀）

const displayTitle = computed(() =>
  (internalTitle.value.trim()
    || fileTitle.value.trim()
    || (props.title?.trim() ?? '')
    || DEFAULT_TITLE)
)

function resetToFile() {
  internalTitle.value = fileTitle.value || ''
  titleDirty.value = false
}
function resetToProp() {
  internalTitle.value = props.title ?? ''
  titleDirty.value = false
}

// 导出文件名安全化
function sanitizeName(name: string) {
  return name.replace(/[\\/:*?"<>|\r\n]+/g, '_').trim() || 'attributes'
}
// 去掉扩展名
function baseNameWithoutExt(name: string) {
  return name.replace(/\.[^/.]+$/u, '')
}

const blobUrl = ref<string | null>(null)

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  const file = input.files[0]

  // 1) 先根据文件名设定默认标题
  fileTitle.value = baseNameWithoutExt(file.name)
  // 若用户还没改过标题，则用文件名覆盖显示值
  if (!titleDirty.value) {
    internalTitle.value = fileTitle.value
  }

  // 2) 读取并生成只含 attributes 的 JSON
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const json = JSON.parse(reader.result as string)
      const features = Array.isArray(json.features) ? json.features : []
      const onlyAttrs = features.map((item: any) => item.attributes || {})
      const output = { data: onlyAttrs }
      const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' })
      blobUrl.value = URL.createObjectURL(blob)
    } catch (err: any) {
      alert('解析文件失败：' + err.message)
    }
  }
  reader.readAsText(file)
}

function download() {
  if (!blobUrl.value) return
  const link = document.createElement('a')
  link.href = blobUrl.value
  // 用当前展示标题作为下载名
  link.download = `${sanitizeName(displayTitle.value)}.json`
  link.click()
  URL.revokeObjectURL(blobUrl.value)
  blobUrl.value = null
}
</script>

<style scoped>
.container { padding: 1rem; font-family: sans-serif; }
.title-bar { display: flex; align-items: center; gap: 8px; }
.title { flex: 1; margin: 0; font-size: 20px; }
.link { background: transparent; border: none; color: #007bff; cursor: pointer; padding: 4px 8px; }
.title-editor { display: flex; gap: 8px; margin-top: 8px; align-items: center; }
.title-input { flex: 1; padding: 6px 8px; border: 1px solid #dcdfe6; border-radius: 4px; outline: none; }
.title-input:focus { border-color: #007bff; }
.btns { display: flex; gap: 8px; }
input[type="file"] { display: block; margin-top: 1rem; }
.btn { margin-top: 1rem; padding: 0.5rem 1rem; background: #007bff; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
.btn.secondary { background: #6c757d; }
.btn:disabled { background: #ccc; cursor: not-allowed; }
</style>