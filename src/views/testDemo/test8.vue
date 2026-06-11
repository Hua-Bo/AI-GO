<template>
    <div class="flex flex-col items-center w-full p-4">
      <!-- 颜色条 -->
      <div ref="sliderRef" class="relative w-[500px] h-8 rounded-full overflow-hidden border border-gray-300 rounded-full">
        <div class="w-full h-full rounded-full" :style="{ background: gradientStyle }"></div>
  
        <!-- 最小值滑块 -->
        <div
          ref="minHandleRef"
          class="absolute top-1/2 w-5 h-5 bg-white border border-black rounded-full cursor-pointer transform -translate-y-1/2"
          :style="{ left: positionMin + 'px', backgroundColor: selectedMinColor }"
          @mousedown="startDrag('min', $event)"
        ></div>
  
        <!-- 最大值滑块 -->
        <div
          ref="maxHandleRef"
          class="absolute top-1/2 w-5 h-5 bg-white border border-black rounded-full cursor-pointer transform -translate-y-1/2"
          :style="{ left: positionMax + 'px', backgroundColor: selectedMaxColor }"
          @mousedown="startDrag('max', $event)"
        ></div>
      </div>
  
      <p class="mt-2 text-lg">
        选择范围: {{ selectedMinValue }} ~ {{ selectedMaxValue }}
      </p>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, onUnmounted } from "vue";
  
  const colorStops = [
    { value: -35, color: "#780471" },
    { value: -32, color: "#002F9E" },
    { value: -28, color: "#1859B7" },
    { value: -24, color: "#2073DB" },
    { value: -20, color: "#419FE9" },
    { value: -16, color: "#66D5FF" },
    { value: -12, color: "#98E2EF" },
    { value: -8, color: "#BDF8FE" },
    { value: -4, color: "#F3FEFF" },
    { value: 0, color: "#DCFFD5" },
    { value: 4, color: "#C0FEB3" },
    { value: 8, color: "#B4FF82" },
    { value: 12, color: "#FBFD8F" },
    { value: 16, color: "#FEF2C0" },
    { value: 20, color: "#FEE1B0" },
    { value: 24, color: "#FFA76E" },
    { value: 28, color: "#FB878A" },
    { value: 32, color: "#FE5600" },
    { value: 35, color: "#8F0814" },
  ];
  
  const sliderRef = ref(null);
  const minHandleRef = ref(null);
  const maxHandleRef = ref(null);
  const sliderWidth = ref(0); // Colorbar 轴宽度（初始为 0，在 mounted 计算）
  const handleWidth = ref(20); // 滑块宽度
  
  // **修正初始位置**，确保滑块在 `colorbar` 内
  const positionMin = ref(0);
  const positionMax = ref(0); // 先初始化为 0，在 onMounted 里重新计算
  
  // 计算最小值
  const selectedMinValue = computed(() => {
    const ratio = positionMin.value / (sliderWidth.value - handleWidth.value);
    return Math.round(-35 + ratio * 70);
  });
  
  // 计算最大值
  const selectedMaxValue = computed(() => {
    const ratio = positionMax.value / (sliderWidth.value - handleWidth.value);
    return Math.round(-35 + ratio * 70);
  });
  
  // 计算最小值颜色
  const selectedMinColor = computed(() => {
    return colorStops.find((c) => c.value === selectedMinValue.value)?.color || "#ffffff";
  });
  
  // 计算最大值颜色
  const selectedMaxColor = computed(() => {
    return colorStops.find((c) => c.value === selectedMaxValue.value)?.color || "#ffffff";
  });
  
  // 计算渐变色背景
  const gradientStyle = computed(() => {
    return `linear-gradient(to right, ${colorStops
      .map((stop) => `${stop.color} ${(stop.value + 35) / 70 * 100}%`)
      .join(", ")})`;
  });
  
  // 拖动逻辑
  const startDrag = (type, event) => {
    console.log(event);
    
    const handleMouseMove = (e) => {
      if (!sliderRef.value) return;
      const rect = sliderRef.value.getBoundingClientRect();
      let newX = e.clientX - rect.left;
  
      if (type === "min") {
        // 限制最小值滑块的范围
        newX = Math.max(0, Math.min(newX, positionMax.value - handleWidth.value));
        positionMin.value = newX;
      } else if (type === "max") {
        // 限制最大值滑块的范围
        newX = Math.max(positionMin.value + handleWidth.value, Math.min(newX, sliderWidth.value - handleWidth.value));
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
  
  // **修正 `positionMax` 的初始值**
  onMounted(() => {
    sliderWidth.value = sliderRef.value?.offsetWidth || 500;
    handleWidth.value = minHandleRef.value?.offsetWidth || 20;
  
    // **这里修正 `positionMax`，确保滑块不会超出 `colorbar`**
    positionMax.value = sliderWidth.value - handleWidth.value;
  });
  
  onUnmounted(() => {});
  </script>