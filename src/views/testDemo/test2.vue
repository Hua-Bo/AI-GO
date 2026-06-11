<template>
  <h3>选择分辨率为天的时间区间</h3>
  <el-date-picker
    v-model="timeRange"
    type="daterange"
    range-separator="-"
    start-placeholder="Start date"
    end-placeholder="End date"
    size="small"
    :disabled-date="computedDisabledDate"
    ref="datePicker"
    class="w-[300px]"
  />

  <h3>选择分辨率为天中选小时的时间区间</h3>
  <el-date-picker
    v-model="timeRanges"
    type="datetimerange"
    range-separator="-"
    start-placeholder="Start date"
    end-placeholder="End date"
    size="small"
    :disabled-hours="disabledHours"
    placeholder="选择日期和时间"
    format="YYYY-MM-DD HH"
    value-format="YYYY-MM-DD HH:mm:ss"
    class="w-[300px]"
  />

  <h3>选择分辨率为小时的时间区间</h3>
  <el-date-picker
    v-model="selectedDateTime"
    type="datetime"
    size="small"
    :disabled-hours="disabledHours"
    placeholder="选择日期和时间"
    format="YYYY-MM-DD HH"
    value-format="YYYY-MM-DD HH:mm:ss"
  />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'

/**
 * 根据给定的开始时间和分辨率，查询从开始时间到当前时间所有的日期。
 * @param {string} startTime - 开始时间，可以是字符串或 Date 对象。
 * @param {number} resolution - 分辨率，表示每个时间段包含的天数。
 * @returns {Array<string>} - 返回包含多个日期的数组，日期格式为 'YYYY-MM-DD'。
 */
function getAllDatesFromStart(startTime, resolution) {
  const datesArray = []
  let currentDate = dayjs(startTime) // 将开始时间转换为 dayjs 对象
  const today = dayjs() // 当前日期

  // 循环，直到当前日期
  while (currentDate.isBefore(today) || currentDate.isSame(today, 'day')) {
    datesArray.push(currentDate.format('YYYY-MM-DD')) // 添加当前日期到数组
    currentDate = currentDate.add(resolution, 'day') // 增加分辨率天数
  }

  return datesArray
}

// 响应式变量存储选中的时间范围
const timeRange = ref([])
const timeRanges = ref([])
const validDatesArray = ref([]) // 用于存储有效日期数组
const selectedDateTime = ref(null) // 用于存储选中的日期和时间

// 计算属性：根据有效日期数组动态禁用其他日期
const computedDisabledDate = computed(() => {
  return (date) => {
    // 将传入的 date 格式化为 'YYYY-MM-DD' 以进行比较
    const dateString = dayjs(date).format('YYYY-MM-DD')

    // 如果有效日期数组为空，则允许选择所有日期
    if (validDatesArray.value.length === 0) return false

    // 禁用不在有效日期数组中的日期
    return !validDatesArray.value.includes(dateString)
  }
})

// 在组件挂载后生成有效日期数组
onMounted(() => {
  const startTime = '2024-01-01' // 开始时间
  const resolution = 15 // 分辨率：15 天
  validDatesArray.value = getAllDatesFromStart(startTime, resolution) // 将结果赋值给 validDatesArray
  console.log('有效日期数组:', validDatesArray.value)
})

// 禁用非 6 小时间隔的时间
const disabledHours = () => {
  const hours = []
  let setp = 6
  for (let i = 0; i < 24; i++) {
    if (i % setp !== 0) {
      hours.push(i) // 禁用不符合条件的小时
    }
  }
  return hours
}
</script>

<style>
.el-scrollbar:nth-of-type(2) {
  display: none !important;
}
.el-time-spinner {
  text-align: center;
}
</style>
