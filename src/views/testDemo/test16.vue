<template>
  <el-button type="primary" @click="showModal = true">
    打开数据弹框
  </el-button>

  <!-- 通过 v-model 绑定可见性 -->
  <DataModal v-model="showModal" />
  <img src="https://nine-confidential.obs.cn-north-4.myhuaweicloud.com/www-ninecosmos-com/disaster-prevention-1.png/disaster-prevention-1.png" alt="test16" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataModal from '@/components/DataModal.vue'

const showModal = ref(false)
</script>