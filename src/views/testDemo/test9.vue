<template>
    <div class="flex flex-col items-center w-full p-4 fixed bottom-10 ">
      <!-- 颜色条 -->
      <div ref="sliderRef" class="relative w-[500px] h-8 overflow-hidden border border-gray-300 rounded-full">
        <!-- 遮罩层 -->
        <div class="absolute top-0 left-0 h-full bg-black opacity-50" 
             :style="{ width: positionMin + 'px' }">
        </div>
        <div class="absolute top-0 right-0 h-full bg-black" 
             :style="{ width: (sliderWidth - positionMax) + 'px' }">
        </div>
  
        <!-- 颜色条 -->
        <ul class="legend-list flex w-full relative">
          <li v-for="(stop, index) in colorStops" 
              :key="index"
              :style="{ width: `${100 / colorStops.length}%`, backgroundColor: stop.color }"
              class="h-full relative">
            <!-- 显示色块的数值 -->
            <span class="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs text-black">
              {{ stop.value }}
            </span>
          </li>
        </ul>
  
        <!-- 最小值滑块 -->
        <div
          ref="minHandleRef"
          class="absolute top-0 w-[2px] h-full bg-black cursor-pointer"
          :style="{ left: positionMin + 'px' }"
          @mousedown="startDrag('min', $event)"
        ></div>
  
        <!-- 最大值滑块 -->
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
  import { ref, computed, onMounted } from "vue";
  
  const colorStops = ref([
    { value: -35, color: "rgb(120, 4, 113)" },  // colorStops[0]  (不可滑入)
    { value: -32, color: "rgb(0, 47, 158)" },  // colorStops[1]  (可滑动)
    { value: -28, color: "rgb(24, 89, 183)" },
    { value: -24, color: "rgb(32, 115, 219)" },
    { value: -20, color: "rgb(65, 159, 233)" },
    { value: -16, color: "rgb(102, 213, 255)" },
    { value: -12, color: "rgb(152, 226, 239)" },
    { value: -8, color: "rgb(189, 248, 254)" },
    { value: -4, color: "rgb(243, 254, 255)" },
    { value: 0, color: "rgb(220, 255, 213)" },
    { value: 4, color: "rgb(192, 254, 179)" },
    { value: 8, color: "rgb(180, 255, 130)" },
    { value: 12, color: "rgb(251, 253, 143)" },
    { value: 16, color: "rgb(254, 242, 192)" },
    { value: 20, color: "rgb(254, 223, 176)" },
    { value: 24, color: "rgb(255, 174, 118)" },
    { value: 28, color: "rgb(251, 135, 138)" },
    { value: 32, color: "rgb(254, 86, 0)" },  // colorStops[-2]  (可滑动)
    { value: 35, color: "rgb(143, 8, 20)" },  // colorStops[-1]  (不可滑入)
  ]);
  
  const sliderRef = ref(null);
  const minHandleRef = ref(null);
  const maxHandleRef = ref(null);
  const sliderWidth = ref(0); // 初始为 0，在 onMounted 计算
  const handleWidth = ref(2); // 滑块的宽度
  
  const leftLimit = ref(0);
  const rightLimit = ref(0);
  
  const positionMin = ref(0);
  const positionMax = ref(0);
  
  // 计算选中的最小值
  const selectedMinValue = computed(() => {
    const ratio = (positionMin.value - leftLimit.value) / (rightLimit.value - leftLimit.value);
    return Math.round(colorStops.value[1].value + ratio * (colorStops.value[colorStops.value.length - 2].value - colorStops.value[1].value));
  });
  
  // 计算选中的最大值
  const selectedMaxValue = computed(() => {
    const ratio = (positionMax.value - leftLimit.value) / (rightLimit.value - leftLimit.value);
    return Math.round(colorStops.value[1].value + ratio * (colorStops.value[colorStops.value.length - 2].value - colorStops.value[1].value));
  });
  
  // 拖动逻辑
  const startDrag = (type, event) => {
    console.log(event);
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
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };
  
  onMounted(() => {
    sliderWidth.value = sliderRef.value?.offsetWidth || 500;
  
    // 计算真实的滑动起点和终点（跳过第一个和最后一个 `li`）
    const stepWidth = sliderWidth.value / colorStops.value.length;
    leftLimit.value = stepWidth; // `colorStops[1]`
    rightLimit.value = sliderWidth.value - stepWidth; // `colorStops[-2]`
  
    positionMin.value = leftLimit.value;
    positionMax.value = rightLimit.value - 2;
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