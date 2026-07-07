<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import { computed, ref } from 'vue'
import { copyText } from '@/utils/exportReport'

const props = defineProps<{
  content: string
}>()

const md = new MarkdownIt({ html: false, linkify: true, breaks: true })

const html = computed(() => {
  const raw = md.render(props.content || '')
  return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } })
})

const copied = ref(false)

async function copyMarkdown() {
  await copyText(props.content)
  copied.value = true
  window.setTimeout(() => { copied.value = false }, 1500)
}
</script>

<template>
  <div class="md-renderer">
    <div class="md-body github-markdown-body" v-html="html" />
    <button v-if="content" type="button" class="copy-btn" @click="copyMarkdown">
      {{ copied ? '已复制' : '复制 Markdown' }}
    </button>
  </div>
</template>

<style scoped>
.md-renderer {
  position: relative;
}

.md-body {
  font-size: 14px;
  line-height: 1.7;
  color: #e8edf5;
}

.md-body :deep(pre) {
  background: #0f172a;
  border-radius: 8px;
  padding: 12px;
  overflow-x: auto;
}

.md-body :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.md-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0;
}

.md-body :deep(th),
.md-body :deep(td) {
  border: 1px solid #334155;
  padding: 6px 10px;
}

.copy-btn {
  margin-top: 8px;
  padding: 4px 10px;
  font-size: 12px;
  border: 1px solid #475569;
  border-radius: 6px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
}

.copy-btn:hover {
  border-color: #60a5fa;
  color: #93c5fd;
}
</style>
