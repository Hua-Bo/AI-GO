<template>
  <div class="flex flex-col items-center w-full p-4 fixed bottom-10">
    <div ref="sliderRef" class="relative w-[500px] h-8 overflow-hidden border border-gray-300 rounded-full">
      <!-- 左侧遮罩 -->
      <div class="absolute top-0 left-0 h-full bg-black opacity-50" 
           :style="{ width: positionMin + 'px' }">
      </div>
      <!-- 右侧遮罩 -->
      <div class="absolute top-0 right-0 h-full bg-black" 
           :style="{ width: (sliderWidth - positionMax) + 'px' }">
      </div>
      
      <!-- 颜色条 -->
      <ul class="legend-list flex w-full relative">
        <li v-for="(stop, index) in colorStops" 
            :key="index"
            :style="{ width: `${100 / colorStops.length}%`, backgroundColor: stop.color }"
            class="h-full relative">
          <span v-if="props.showLabel" class="text-xs text-black leading-[30px] flex justify-center">
            {{ stop.value }}
          </span>
        </li>
      </ul>
      
      <!-- 最小值拖动点 -->
      <div
        ref="minHandleRef"
        class="absolute top-0 w-[2px] h-full bg-black cursor-pointer"
        :style="{ left: positionMin + 'px' }"
        @mousedown="startDrag('min', $event)"
      ></div>
      
      <!-- 最大值拖动点 -->
      <div
        ref="maxHandleRef"
        class="absolute top-0 w-[2px] h-full bg-black cursor-pointer"
        :style="{ left: positionMax + 'px' }"
        @mousedown="startDrag('max', $event)"
      ></div>
    </div>
    
    <p class="mt-2 text-lg">
      选择范围: {{ selectedMinValue }} ~ {{ selectedMaxValue }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineProps, defineEmits } from "vue";

const props = defineProps({
  colorStops: {
    type: Array,
    required: true,
  },
  showLabel: {
    type: Boolean,
    default: false,
  },
});

// 定义事件
const emit = defineEmits(["updateRange"]);

const sliderRef = ref(null);
const minHandleRef = ref(null);
const maxHandleRef = ref(null);
const sliderWidth = ref(0);
const handleWidth = ref(2);
const leftLimit = ref(0);
const rightLimit = ref(0);
const positionMin = ref(0);
const positionMax = ref(0);

const selectedMinValue = computed(() => {
  const rangeMin = props.colorStops[1].value;
  const rangeMax = props.colorStops[props.colorStops.length - 2].value;
  const ratio = (positionMin.value - leftLimit.value) / (rightLimit.value - leftLimit.value);
  return (rangeMin + ratio * (rangeMax - rangeMin)).toFixed(1); // 保留一位小数
});

const selectedMaxValue = computed(() => {
  const rangeMin = props.colorStops[1].value;
  const rangeMax = props.colorStops[props.colorStops.length - 2].value;
  const ratio = (positionMax.value - leftLimit.value) / (rightLimit.value - leftLimit.value);
  return (rangeMin + ratio * (rangeMax - rangeMin)).toFixed(1); // 保留一位小数
});

const startDrag = (type, event) => {
  const handleMouseMove = (e) => {
    if (!sliderRef.value) return;
    const rect = sliderRef.value.getBoundingClientRect();
    let newX = e.clientX - rect.left;
    if (type === "min") {
      newX = Math.max(leftLimit.value, Math.min(newX, positionMax.value - handleWidth.value));
      positionMin.value = newX;
    } else if (type === "max") {
      newX = Math.max(positionMin.value + handleWidth.value, Math.min(newX, rightLimit.value - handleWidth.value));
      positionMax.value = newX;
    }
  };

  const handleMouseUp = () => {
    // 释放鼠标时，向父组件传递最新的 min/max 值
    emit("updateRange", { min: selectedMinValue.value, max: selectedMaxValue.value });

    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };

  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);
};

onMounted(() => {
  sliderWidth.value = sliderRef.value?.offsetWidth || 500;

  // 把滑块限制在中间段（非边界颜色）
  const stepWidth = sliderWidth.value / props.colorStops.length;
  leftLimit.value = stepWidth; // 忽略第一个颜色
  rightLimit.value = sliderWidth.value - stepWidth; // 忽略最后一个颜色

  positionMin.value = leftLimit.value;
  positionMax.value = rightLimit.value - handleWidth.value;
});
</script>

<style scoped>
.legend-list {
  display: flex;
  height: 100%;
}
.legend-list li {
  list-style: none;
}
</style>