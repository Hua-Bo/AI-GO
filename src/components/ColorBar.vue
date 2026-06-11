<script setup lang="ts">
const props = defineProps<{
  unit: string
  colors: (number | string)[][]
  split?: boolean
}>()

const backgroundColor = computed(() => {
  let config = 'linear-gradient(to right, '
  const interval = 100 / props.colors.length / 2
  props.colors.forEach((item, idx) => {
    if (idx === 0) {
      config += `${item[1]} 0%, ${item[1]} ${interval}%`
    } else {
      config += `, ${item[1]} ${interval * (idx * 2 + 1)}%`
    }
    if (idx === props.colors.length - 1) {
      config += `, ${item[1]} 100%)`
    }
  })
  return config
})
</script>

<template>
  <div class="h-5 flex rounded-full items-center text-xs text-white">
    <div class="whitespace-nowrap px-1 text-black" style="background-color: rgba(255, 255, 255, 0.8)">
      {{ props.unit }}
    </div>
    <div class="flex items-center w-full" :style="{background: props.split ? undefined : backgroundColor}">
      <div
        v-for="(item) of props.colors"
        :key="item[0]"
        class="whitespace-nowrap min-w-[3rem] flex-1 text-center px-2"
        :style="{
          background: props.split ? item[1] : undefined,
        }"
      >
        {{ item[0] }}
      </div>
    </div>
  </div>
</template>
