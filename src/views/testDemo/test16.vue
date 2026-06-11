<template>
  <el-button type="primary" @click="showModal = true">
    打开数据弹框
  </el-button>

  <!-- 通过 v-model 绑定可见性 -->
  <DataModal v-model="showModal" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataModal from '@/components/DataModal.vue'

const showModal = ref(false)
</script>