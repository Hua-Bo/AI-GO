<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import TodayTaskItem from '@/components/agri/TodayTaskItem.vue'
import EmptyState from '@/components/agri/EmptyState.vue'
import { useAgriStore } from '@/stores/agri'

const store = useAgriStore()
const { tasks } = storeToRefs(store)

onMounted(() => {
  store.loadTasks()
})
</script>

<template>
  <main class="agri-page">
    <h1 class="agri-title">今天干什么</h1>
    <p class="agri-subtitle">只看最重要的几件事</p>

    <EmptyState
      v-if="!tasks.length"
      title="今天暂时没有任务"
      desc="说一次问题或拍照后，会生成今日任务"
    />

    <TodayTaskItem
      v-for="task in tasks"
      :key="task.id"
      :title="task.title"
      :done="task.done"
      @toggle="store.toggleTaskDone(task.id)"
      @later="store.remindTaskLater(task.id)"
    />
  </main>
</template>
