<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav from '@/components/agri/BottomNav.vue'
import '@/styles/agri.css'

const route = useRoute()
const hideNav = computed(() => Boolean(route.meta.hideAgriNav))
</script>

<template>
  <div class="agri-app">
    <router-view />
    <BottomNav v-if="!hideNav" />
  </div>
</template>
