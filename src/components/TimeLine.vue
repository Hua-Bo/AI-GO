<script setup lang="ts">
import { dayjs, ElPopover } from 'element-plus'
import { useStore } from '@/store'
import { ref, watch } from 'vue';
import html2canvas from 'html2canvas'; // 引入截图工具

const props = defineProps<{
  imgContainer: any;
  timeType: 'day' | 'month' | 'season' | 'year';
  // 可以根据需要增加其他参数，如起始日期、结束日期等
}>()

const emit = defineEmits<(e: 'renderTimeLine', date: string) => void>()

let T = 0

const store = useStore()
let lastTick = ref('')
let timeLineIndex = ref('0')
let timeLineList = ref<{ parent: string; children: string[] }[]>([])

//
// 根据起始和结束日期生成时间范围，支持日、月、季节、年
//
const getDateRange = (startDate: Date, endDate: Date, timeType: string) => {
  const dates: string[] = []
  let currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    if (timeType === 'day') {
      dates.push(dayjs(currentDate).format('YYYY-MM-DD'))
      currentDate.setDate(currentDate.getDate() + 1)
    } else if (timeType === 'month') {
      dates.push(dayjs(currentDate).format('YYYY-MM'))
      currentDate = dayjs(currentDate).add(1, 'month').toDate()
    } else if (timeType === 'season') {
      // 根据月份判断季节，简单处理：3-5 春季，6-8 夏季，9-11 秋季，其余为 冬季
      const month = currentDate.getMonth() + 1
      let seasonLabel = ''
      if (month >= 3 && month <= 5) {
        seasonLabel = '春季'
      } else if (month >= 6 && month <= 8) {
        seasonLabel = '夏季'
      } else if (month >= 9 && month <= 11) {
        seasonLabel = '秋季'
      } else {
        seasonLabel = '冬季'
      }
      dates.push(`${dayjs(currentDate).format('YYYY')}-${seasonLabel}`)
      currentDate = dayjs(currentDate).add(3, 'month').toDate()
    } else if (timeType === 'year') {
      dates.push(dayjs(currentDate).format('YYYY'))
      currentDate.setFullYear(currentDate.getFullYear() + 1)
    }
  }
  return dates
}

//
// 生成时间轴：将时间范围拆分为若干“父节点”及其下的“子节点”
//
const normalizeTimeLine = (startDate: Date, endDate: Date, timeType: string) => {
  const dateRange = getDateRange(startDate, endDate, timeType);
  timeLineList.value = [];
  if (dateRange.length <= 0) return;

  let tickCount = 3; // 初始分段数量
  const maxTickCount = 8; // 最大分段数量
  let interval = Math.ceil(dateRange.length / tickCount);

  // 动态尝试分段数量，直到找到合适的分段数
  while (tickCount <= maxTickCount) {
    interval = Math.ceil(dateRange.length / tickCount);
    if (dateRange.length % tickCount === 0 || tickCount === maxTickCount) {
      break; // 若能均分，或已达到最大分段数，则退出循环
    }
    tickCount++;
  }

  let tickIndex = 0;
  for (let i = 0; i < tickCount; i++) {
    const parent = dateRange[tickIndex]; // 父节点时间点
    const children = dateRange.slice(tickIndex + 1, tickIndex + interval); // 子节点区间
    timeLineList.value.push({
      parent,
      children,
    });
    tickIndex += interval;
  }

  // 将剩余的时间归入最后一组的 children
  const remainingData = dateRange.slice(tickIndex);
  if (remainingData.length > 0) {
    timeLineList.value[timeLineList.value.length - 1]?.children.push(...remainingData);
  }
  // 记录最后一个时间点
  lastTick.value = dateRange[dateRange.length - 1];
  emit('renderTimeLine', timeLineList.value[0]?.parent);
}

//
// 判断当前时间轴是否处于激活状态
//
const isActiveTimeLine = (type: 'parent' | 'child' | 'last', parentIndex: number, childIndex?: number) => {
  const [parent, child] = timeLineIndex.value.split('-')
  if (type === 'parent') return parentIndex === Number(parent) && child === undefined
  else if (type === 'child') return parentIndex === Number(parent) && childIndex === Number(child)
  else if (type === 'last') return Number(parent) === timeLineList.value.length && parentIndex === timeLineList.value.length - 1
}

//
// 切换时间轴：根据点击的父节点或子节点更新当前激活的时间轴
//
const changeTimeLine = (depth: 'parent' | 'child' | 'last', parentIndex: number, childIndex?: number) => {
  if (depth === 'parent') {
    timeLineIndex.value = parentIndex.toString()
    emit('renderTimeLine', timeLineList.value[parentIndex].parent)
  } else if (depth === 'child') {
    timeLineIndex.value = `${parentIndex}-${childIndex}`
    emit('renderTimeLine', timeLineList.value[parentIndex].children[childIndex!])
  } else {
    timeLineIndex.value = timeLineList.value.length.toString()
    emit('renderTimeLine', lastTick.value)
  }
}

//
// 控制播放状态
//
const playTimeLine = () => {
  store.playing = !store.playing
}

//
// 播放过程中自动依次渲染时间轴（并可根据设置进行截图）
//
const playRender = () => {
  if (store.playing) {
    T = window.setInterval(() => {
      if (timeLineIndex.value.length === 1) {
        const current = timeLineList.value[Number(timeLineIndex.value)]
        const next = timeLineList.value[Number(timeLineIndex.value) + 1]
        if (current.children[0]) {
          timeLineIndex.value = `${timeLineIndex.value}-0`
          emit('renderTimeLine', current.children[0])
          if (store.startScreenshot) {
            takeScreenshot();
          }
        } else if (parseInt(timeLineIndex.value, 10) + 1 !== timeLineList.value.length) {
          timeLineIndex.value = `${Number(timeLineIndex.value) + 1}`
          emit('renderTimeLine', next.parent)
          if (store.startScreenshot) {
            takeScreenshot();
          }
        } else {
          timeLineIndex.value = timeLineList.value.length.toString()
          emit('renderTimeLine', lastTick.value)
          clearInterval(T)
          setTimeout(() => {
            timeLineIndex.value = '0'
            store.playing = false
            emit('renderTimeLine', timeLineList.value[0].parent)
          }, 1000)
        }
      } else {
        const [parent, child] = timeLineIndex.value.split('-')
        if (timeLineList.value[Number(parent)].children[Number(child) + 1]) {
          timeLineIndex.value = `${parent}-${Number(child) + 1}`
          emit('renderTimeLine', timeLineList.value[Number(parent)].children[Number(child) + 1])
          if (store.startScreenshot) {
            takeScreenshot();
          }
        } else if (parseInt(timeLineIndex.value, 10) + 1 !== timeLineList.value.length) {
          timeLineIndex.value = `${Number(parent) + 1}`
          emit('renderTimeLine', timeLineList.value[Number(timeLineIndex.value)].parent)
          if (store.startScreenshot) {
            takeScreenshot();
          }
        } else {
          timeLineIndex.value = timeLineList.value.length.toString()
          emit('renderTimeLine', lastTick.value)
          clearInterval(T)
          setTimeout(() => {
            timeLineIndex.value = '0'
            store.playing = false
            emit('renderTimeLine', timeLineList.value[0].parent)
          }, 1000)
        }
      }
    }, 1000)
  } else {
    clearTimeout(T)
  }
}

//
// 截图功能：对传入的容器进行截图并保存图片数据
//
const takeScreenshot = () => {
  if (props.imgContainer) {
    html2canvas(props.imgContainer).then(canvas => {
      const imgData = canvas.toDataURL(); // 获取图片数据URL
      store.gifList.push(imgData); // 将截图保存到 store.gifList 中
    });
  }
};

watch(() => store.playing, () => {
  playRender()
})

defineExpose({
  normalizeTimeLine,
  timeLineList,
})
</script>

<template>
  <div
    class="fixed flex items-center"
    :style="{
      bottom: '4rem',
      left: `calc(${store.menuWidth} + 1rem)`,
    }"
  >
    <div class="mr-4 relative -bottom-1 cursor-pointer" @click="playTimeLine">
      <img v-if="store.playing" class="h-12 w-12" src="@/assets/timeline_pause.png" />
      <img v-else class="h-12 w-12" src="@/assets/timeline_play.png" />
    </div>
    <div
      class="time-line h-3 flex justify-between cursor-pointer"
      :style="{ width: `calc(100vw - ${store.menuWidth} - 11rem - 2rem)` }"
    >
      <div
        v-for="(item, index) of timeLineList"
        :key="item.parent"
        class="relative flex-1 flex"
      >
        <ElPopover placement="top" trigger="hover" :content="item.parent" popper-class="popper">
          <template #reference>
            <div class="tick" style="height: 1.25rem" @click="changeTimeLine('parent', index)">
              <img v-if="isActiveTimeLine('parent', index)" class="time-line-arrow" src="@/assets/timeline_tick.png" />
            </div>
          </template>
        </ElPopover>

        <ElPopover
          v-for="(tick, childIndex) of item.children"
          :key="tick"
          placement="top"
          trigger="hover"
          :content="tick"
          popper-class="popper"
        >
          <template #reference>
            <div class="tick" style="height: 0.625rem" @click="changeTimeLine('child', index, childIndex)">
              <img
                v-if="isActiveTimeLine('child', index, childIndex)"
                class="time-line-arrow"
                src="@/assets/timeline_tick.png"
                style="bottom: -2px"
              />
            </div>
          </template>
        </ElPopover>

        <ElPopover placement="top" trigger="hover" :content="lastTick" popper-class="popper">
          <template #reference>
            <div :class="[index === timeLineList.length - 1 ? 'last-tick' : '']" @click="changeTimeLine('last', index)">
              <img v-if="isActiveTimeLine('last', index)" class="time-line-arrow" src="@/assets/timeline_tick.png" />
            </div>
          </template>
        </ElPopover>

        <div class="absolute -bottom-10 -translate-x-1/2 text-xl whitespace-nowrap">
          {{ item.parent }}
        </div>
        <div v-if="index === timeLineList.length - 1" class="absolute -bottom-10 translate-x-1/2 text-xl right-4">
          {{ lastTick }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.time-line {
  background-color: rgba(26, 26, 26, 0.5);
}
.tick {
  position: relative;
  flex: 1;
  border-left: 1px solid rgba(0, 0, 0, 0.36);
}
.time-line-arrow {
  position: absolute;
  left: -5px;
  bottom: 8px;
  height: 24px;
  width: 10px;
  z-index: 10;
}
.last-tick {
  position: relative;
  height: 0.625rem;
  width: 1px;
  background-color: rgba(0, 0, 0, 0.36);
}
</style>

<style>
.popper {
  min-width: 6rem !important;
  width: 6rem !important;
  padding: 8px 0 !important;
  text-align: center !important;
  font-size: 16px !important;
}
</style>