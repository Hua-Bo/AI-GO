<script setup lang="ts">
import { ref, defineProps, defineEmits, computed } from 'vue';
import { downloadDom } from '@/utils/imgTools';

// 接收父组件传递的 props
const props = defineProps({
  dialogVisible: {
    type: Boolean,
    required: true
  },
  imgUrl: {
    type: String,
    required: true
  },
  mapBounds: {
    type: Object,
    required: true
  }
});

// 定义一个 emit 用于父组件关闭弹框
const emit = defineEmits(['update:dialogVisible']);

const imgContainer = ref(null);

// 计算 X 和 Y 轴的刻度值
const ticks = computed(() => {
  if (!props.mapBounds) return { xTicks: [], yTicks: [] };

  const { lngMin, lngMax, latMin, latMax } = props.mapBounds;
  const xStep = (lngMax - lngMin) / 7; // X轴每个刻度的间隔
  const yStep = (latMax - latMin) / 5; // Y轴每个刻度的间隔

  const xTicks = Array.from({ length: 8 }, (_, i) => lngMin + i * xStep);
  const yTicks = Array.from({ length: 6 }, (_, i) => latMin + i * yStep);

  return { xTicks, yTicks };
});

// 处理保存截图
const handleSave = () => {
  downloadDom(imgContainer.value!, '截图.png');
};

// 关闭弹框
const closeDialog = () => {
  emit('update:dialogVisible', false);
};
</script>

<template>
  <el-dialog :model-value="dialogVisible" width="800" @close="closeDialog">
    <div ref="imgContainer" class="screenshot-container">
      <h1 class="text-center mb-4">地图截图</h1>
      <div class="scale-container">
        <!-- Y轴刻度 -->
        <div class="y-axis">
          <div 
            v-for="(tick, index) in ticks.yTicks" 
            :key="'y'+index"
            class="tick"
            :style="{ top: `${(index / 5) * 100}%` }"
          >
            <div class="tick-line"></div>
            <span class="tick-value">{{ index === 0 ? `${tick.toFixed(2)}°N` : tick.toFixed(2) }}</span>
          </div>
        </div>

        <!-- X轴刻度 -->
        <div class="x-axis">
          <div 
            v-for="(tick, index) in ticks.xTicks" 
            :key="'x'+index"
            class="tick"
            :style="{ left: `${(index / 7) * 100}%` }"
          >
            <div class="tick-line"></div>
            <span class="tick-value">{{ index === 7 ? `${tick.toFixed(2)}°E` : tick.toFixed(2) }}</span>
          </div>
        </div>

        <!-- 截图图片 -->
        <img class="screenshot-image" :src="imgUrl" alt="截图" />
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleSave">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.screenshot-container {
  position: relative;
  padding: 40px;
  background: white;
}

.scale-container {
  position: relative;
  padding-left: 40px;
  padding-bottom: 40px;
}

.screenshot-image {
  border-top: 2px solid #333;
  border-right: 2px solid #333;
}

/* Y轴样式 */
.y-axis {
  position: absolute;
  left: 2px;
  top: 0;
  bottom: 40px;
  width: 40px;
  border-right: 2px solid #333;
}

.y-axis .tick {
  position: absolute;
  right: 0;
  transform: translateY(-50%);
}

.y-axis .tick-line {
  width: 10px;
  height: 2px;
  background: #333;
  margin-right: -10px;
  position: absolute;
  right: 8px;
}

.y-axis .tick-value {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
}

/* X轴样式 */
.x-axis {
  position: absolute;
  left: 40px;
  right: 2px;
  bottom: 0;
  height: 40px;
  border-top: 2px solid #333;
}

.x-axis .tick {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
}

.x-axis .tick-line {
  height: 10px;
  width: 2px;
  background: #333;
  margin-top: -10px;
  position: absolute;
  top: 8px;
}

.x-axis .tick-value {
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
}
</style>