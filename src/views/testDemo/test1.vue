<!-- <template>
  <div class="container mx-auto">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="bg-blue-500 p-4">1</div>
      <div class="bg-green-500 p-4">2</div>
      <div class="bg-yellow-500 p-4">3</div>
      <div class="bg-red-500 p-4">4</div>
      <div class="bg-purple-500 p-4">5</div>
      <div class="bg-pink-500 p-4">6</div>
      <div class="bg-indigo-500 p-4">7</div>
      <div class="bg-teal-500 p-4">8</div>
      <div class="bg-orange-500 p-4">9</div>
    </div>

    <div class="mt-[10px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="bg-blue-500 p-4" style="grid-column: span 2; grid-row: span 2">1</div>
      <div class="bg-green-500 p-4" style="grid-column: span 1; grid-row: span 1">2</div>
      <div class="bg-yellow-500 p-4" style="grid-column: span 1; grid-row: span 1">3</div>
      <div class="bg-red-500 p-4" style="grid-column: span 1; grid-row: span 1">4</div>
      <div class="bg-purple-500 p-4" style="grid-column: span 1; grid-row: span 1">5</div>
      <div class="bg-pink-500 p-4" style="grid-column: span 1; grid-row: span 1">6</div>
      <div class="bg-indigo-500 p-4" style="grid-column: span 1; grid-row: span 1">7</div>
      <div class="bg-teal-500 p-4" style="grid-column: span 1; grid-row: span 1">8</div>
      <div class="bg-orange-500 p-4" style="grid-column: span 1; grid-row: span 1">9</div>
    </div>
  </div>
</template>

<script></script>

<style>
.el-col {
  border-radius: 4px;
  background-color: green;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}
</style> -->


<!-- <template>
  <el-date-picker
    v-model="timeRange"
    type="daterange"
    :picker-options="pickerOptions"
    range-separator="-"
    start-placeholder="Start date"
    end-placeholder="End date"
    size="small"
    class="w-[100px]"
  />

  <el-date-picker
    v-model="selectedDateTime"
    type="datetime"
    :disabled-hours="disabledHours"
    placeholder="选择日期和时间"
    format="YYYY-MM-DD HH"
    value-format="YYYY-MM-DD HH:mm:ss"
  />
</template>

<script setup>
import { ref } from 'vue'
import dayjs from 'dayjs'
import tz from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(tz)

const timeRange = ref('')
const startDate = ref('')

// 响应式存储选中的日期和时间
const selectedDateTime = ref(null)

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
const pickerOptions = {
  disabledDate(time) {
    if (!startDate.value) {
      return false // 如果起始日期未选择，则不禁用任何日期
    }
    const diffDays = Math.floor((time.getTime() - new Date(startDate.value).getTime()) / (1000 * 60 * 60 * 24))
    return diffDays % 7 !== 0 // 只允许选择7天一个周期的日期
  },
}

/**
 * 根据给定的分辨率将时间分割成多个时间段。
 * @param startTime - 开始时间，可以是字符串或 Date 对象。
 * @param resolution - 分辨率，表示每个时间段包含的天数。
 * @returns - 一个包含多个时间段的数组，每个时间段是一个包含日期的数组。
 */
function splitTimeByResolution(startTime, resolution) {
  // 创建一个空数组，用于存储时间段
  const timeArray = []

  // 将 startTime 转换为 dayjs 对象
  let currentDate
  if (typeof startTime === 'string') {
    currentDate = dayjs(startTime)
  } else {
    currentDate = startTime
  }

  // 创建一个空数组，用于存储当前时间段
  let currentSegment = []

  // 循环，直到当前日期超过当前时间
  while (currentDate.isBefore(dayjs())) {
    // 将当前日期添加到当前时间段
    currentSegment.push(currentDate)

    // 将当前日期增加一天
    currentDate = currentDate.add(1, 'day')

    // 如果当前时间段已经达到给定的分辨率，则将其添加到时间数组，并创建一个新的时间段
    if (currentSegment.length === resolution) {
      timeArray.push(currentSegment)
      currentSegment = []
    }
  }

  // 处理最后一个时间段
  if (currentSegment.length > 0) {
    timeArray.push(currentSegment)
  }

  // 返回时间数组
  return timeArray
}

onMounted(() => {
  // 示例用法
  const startTime = '2024-01-01' // 开始时间
  const resolution = 15 // 分辨率（天）
  const timeSegments = splitTimeByResolution(startTime, resolution)
  console.log(timeSegments)
})
</script>

<style>
.el-scrollbar:nth-of-type(2) {
  display: none !important;
}
.el-time-spinner {
  text-align: center;
}
</style> -->

<!-- <template>
  <el-date-picker
    v-model="timeRange"
    type="daterange"
    range-separator="-"
    start-placeholder="Start date"
    end-placeholder="End date"
    size="small"
    :disabled-date="computedDisabledDate"
    @input="handleStartTimeInput"
    @calendar-change="cakebdarChange"
    ref="datePicker"
    class="w-[300px]"
  />
</template>

<script setup>
import { ref, computed } from 'vue';
import dayjs from 'dayjs';

// 响应式变量存储选中的时间范围
const timeRange = ref([]);

// 引用 DatePicker 实例，用于手动打开或关闭日期选择器
const datePicker = ref(null);

// 计算属性：根据开始日期动态禁用其他日期
const computedDisabledDate = computed(() => {
  return (date) => {
    // 如果没有选择开始日期，则不禁用任何日期
    if (!timeRange.value || !timeRange.value[0]) return false;

    // 获取选择的开始日期
    const startDate = dayjs(timeRange.value[0]);

    // 计算当前一周内的日期范围（开始日期 + 7 天）
    const endDate = startDate.add(7, 'day');

    // 禁用范围之外的日期
    return date < startDate.toDate() || date > endDate.toDate();
  };
});

const cakebdarChange = ([start]) => {
  timeRange.value = [start, null];
  console.log(start.getTime());
};
</script> -->


<!-- <template>
  <el-date-picker
    v-model="timeRange"
    type="daterange"
    range-separator="-"
    start-placeholder="Start date"
    end-placeholder="End date"
    size="small"
    :disabled-date="computedDisabledDate"
    @calendar-change="calendarChange"
    ref="datePicker"
    class="w-[300px]"
  />
</template>

<script setup>
import { ref, computed } from 'vue';
import dayjs from 'dayjs';

// 响应式变量存储选中的时间范围
const timeRange = ref([]);
const getStartDate = ref(null);

// 假设这是从查询结果中获取到的有效日期数组，格式为 dayjs 对象数组
const validDatesArray = ref([]); // 这个数组将根据 getStartDate 的变化动态获取有效的日期

/**
 * 根据给定的分辨率将时间分割成多个时间段。
 * @param startTime - 开始时间，可以是字符串或 Date 对象。
 * @param resolution - 分辨率，表示每个时间段包含的天数。
 * @returns - 一个包含多个时间段的数组，每个时间段是一个包含日期的数组。
 */
 function splitTimeByResolution(startTime, resolution) {
  // 创建一个空数组，用于存储时间段
  const timeArray = []

  // 将 startTime 转换为 dayjs 对象
  let currentDate
  if (typeof startTime === 'string') {
    currentDate = dayjs(startTime)
  } else {
    currentDate = dayjs(startTime) // 确保 Date 对象也转换为 dayjs 对象
  }

  // 创建一个空数组，用于存储当前时间段
  let currentSegment = []

  // 循环，直到当前日期超过当前时间
  while (currentDate.isBefore(dayjs())) {
    // 将当前日期添加到当前时间段
    currentSegment.push(currentDate)

    // 将当前日期增加一天
    currentDate = currentDate.add(1, 'day')

    // 如果当前时间段已经达到给定的分辨率，则将其添加到时间数组，并创建一个新的时间段
    if (currentSegment.length === resolution) {
      timeArray.push(currentSegment)
      currentSegment = []
    }
  }

  // 处理最后一个时间段
  if (currentSegment.length > 0) {
    timeArray.push(currentSegment)
  }

  // 返回时间数组
  return timeArray
}

// 计算属性：根据开始日期动态禁用其他日期
const computedDisabledDate = computed(() => {
  return (date) => {
    // 如果没有选择开始日期，则不禁用任何日期
    if (!getStartDate.value || validDatesArray.value.length === 0) return false;

    // 检查当前日期是否在有效日期数组中
    const isDateValid = validDatesArray.value.some(validDate =>
      dayjs(validDate).isSame(date, 'day')
    );

    // 禁用不在有效日期数组中的日期
    return !isDateValid;
  };
});

// 监听日期选择的变化
const calendarChange = (selectedDates) => {
  // selectedDates 是用户选中的开始和结束日期
  const [start, end] = selectedDates;
  getStartDate.value = start;

  const startTime = '2024-01-01' // 开始时间
  const resolution = 15 // 分辨率（天）
  const timeSegments = splitTimeByResolution(startTime, resolution)

  // 查找包含目标日期的时间段
  const result = timeSegments.find(subArray => 
    subArray.some(date => date.isSame(dayjs(start), 'day')) // 使用 isSame 方法比较日期
  )

  console.log('timeSegments',timeSegmentss);

  // 模拟根据查询结果获取有效日期数组，这里你可以根据 getStartDate 查询并设置 validDatesArray
  if (start) {
    // 示例：假设根据开始日期查询到的有效日期是一周内的所有日期
    validDatesArray.value = Array.from({ length: 7 }, (_, i) => dayjs(start).add(i, 'day'));
    console.log('开始时间:', start, '有效日期数组:', validDatesArray.value);
  }
};
</script> -->

<template>
  <el-date-picker
    v-model="timeRange"
    type="daterange"
    range-separator="-"
    start-placeholder="Start date"
    end-placeholder="End date"
    size="small"
    :disabled-date="computedDisabledDate"
    @calendar-change="calendarChange"
    @clear="getStartDate = null"
    ref="datePicker"
    class="w-[300px]"
  />
</template>

<script setup>
import { ref, computed } from 'vue';
import dayjs from 'dayjs';

// 响应式变量存储选中的时间范围
const timeRange = ref([]);
const getStartDate = ref(null);

// 假设这是从查询结果中获取到的有效日期数组，格式为 dayjs 对象数组
const validDatesArray = ref([]); // 这个数组将根据 getStartDate 的变化动态获取有效的日期

/**
 * 根据给定的分辨率将时间分割成多个时间段。
 * @param startTime - 开始时间，可以是字符串或 Date 对象。
 * @param resolution - 分辨率，表示每个时间段包含的天数。
 * @returns - 一个包含多个时间段的数组，每个时间段是一个包含 dayjs 日期对象的数组。
 */
function splitTimeByResolution(startTime, resolution) {
  const timeArray = [];
  let currentDate = typeof startTime === 'string' ? dayjs(startTime) : dayjs(startTime);
  let currentSegment = [];

  while (currentDate.isBefore(dayjs())) {
    currentSegment.push(currentDate); // 确保 currentSegment 中的日期是 dayjs 对象
    currentDate = currentDate.add(1, 'day');
    if (currentSegment.length === resolution) {
      timeArray.push([...currentSegment]); // 确保 timeArray 中的日期是 dayjs 对象数组
      currentSegment = [];
    }
  }

  if (currentSegment.length > 0) {
    timeArray.push([...currentSegment]);
  }

  return timeArray;
}

// 计算属性：根据开始日期动态禁用其他日期和未达到的日期
const computedDisabledDate = computed(() => {
  return (date) => {
    const today = dayjs().startOf('day'); // 当前日期（今天）
    
    // 禁用未来日期（未达到的日期）
    if (dayjs(date).isAfter(today)) {
      return true;
    }

    // 如果没有选择开始日期或有效日期数组为空，则不禁用任何日期
    if (!getStartDate.value || validDatesArray.value.length === 0) return false;

    // 检查当前日期是否在有效日期数组中
    const isDateValid = validDatesArray.value.some(validDate =>
      dayjs(validDate).isSame(date, 'day') // 确保使用 dayjs 进行日期比较
    );

    // 禁用不在有效日期数组中的日期
    return !isDateValid;
  };
});

// 监听日期选择的变化
const calendarChange = (selectedDates) => {
  const [start, end] = selectedDates;
  if (!start) return; // 如果没有开始时间，返回

  getStartDate.value = dayjs(start); // 确保 start 是 dayjs 对象

  const startTime = '2024-01-01'; // 假设的开始时间
  const resolution = 15; // 分辨率（天数）
  const timeSegments = splitTimeByResolution(startTime, resolution);

  // 查找包含 start 时间的时间段，确保使用 dayjs 比较
  const resultSegment = timeSegments.find(segment =>
    segment.some(date => date.isSame(getStartDate.value, 'day')) // 确保使用 dayjs 的 isSame 方法
  );

  // 如果找到结果段，将其设置为有效日期数组
  if (resultSegment) {
    validDatesArray.value = resultSegment; // 将找到的结果段设置为有效日期
    console.log('开始时间:', getStartDate.value.format('YYYY-MM-DD'), '有效日期数组:', validDatesArray.value.map(d => d.format('YYYY-MM-DD')));
  } else {
    console.log('未找到包含开始时间的日期段');
  }
};
</script>