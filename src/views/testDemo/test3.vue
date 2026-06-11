<template>
  <div class="markdownContainer">
    <aside class="sidebar">
      <ul>
        <li
          v-for="(file, index) in markdownFilesList"
          :key="index"
          @click="loadMarkdown(file)"
          :class="{ active: activeFile === file }"
        >
          {{ removeMdExtension(file) }}
        </li>
      </ul>
    </aside>

    <div class="markdown-body">
      <div v-if="currentMarkdownComponent">
        <component :is="currentMarkdownComponent" />
      </div>
      <div v-else>
        <p>暂无 API 文档</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import 'github-markdown-css/github-markdown.css' // 引入 GitHub 风格的样式

const markdownFilesList = ref<string[]>([])
const markdownFiles = import.meta.glob('../../markdown/**/*.md')
const currentMarkdownComponent = ref()
const activeFile = ref<string>('')

// 加载 Markdown 文件列表
onMounted(() => {
  markdownFilesList.value = Object.keys(markdownFiles).map((filePath) => filePath.split('/').pop())
  loadMarkdown(markdownFilesList.value[0])
})

// 切换 Markdown 文件
const loadMarkdown = async (fileName: string) => {
  for (const path in markdownFiles) {
    if (path.includes(fileName)) {
      const module = await markdownFiles[path]()
      currentMarkdownComponent.value = module.default
      activeFile.value = fileName
      break
    }
  }
}

// 删除 .md 后缀
const removeMdExtension = (fileName: string) => {
  return fileName.replace(/\.md$/, '') // 删除 .md 后缀
}
</script>

<style scoped>
.markdownContainer {
  display: flex;
  width: 100vw;
  height: 100vh;
}

.sidebar {
  width: 200px;
  background-color: #f7f7f7;
  border-right: 1px solid #ddd;
  padding: 10px;
  box-sizing: border-box;
  overflow-y: auto; /* 侧边栏滚动条 */
}

.sidebar ul {
  list-style: none;
  padding: 0;
}

.sidebar li {
  padding: 10px;
  cursor: pointer;
}

.sidebar li.active {
  background-color: #3498db;
  color: white;
}

.sidebar li:hover {
  background-color: #ecf0f1;
}

.markdown-body {
  flex: 1;
  padding: 20px;
  background-color: #fff;
  overflow-y: auto; /* 内容区滚动条 */
  /* box-sizing: border-box; */
}
</style>
