<template>
  <div class="p-4 space-y-4">
    <div class="space-y-2">
      <div>
        <label>最小值：</label>
        <input v-model.number="min" type="number" class="input" />
      </div>
      <div>
        <label>步长：</label>
        <input v-model.number="step" type="number" class="input" />
      </div>
      <div>
        <label>刻度值（逗号分隔）：</label>
        <input v-model="valuesInput" type="text" class="w-full input" placeholder="例如：-100,-75,-50,0,50,100" />
      </div>
      <div>
        <label>颜色（逗号分隔）：</label>
        <input v-model="colorsInput" type="text" class="w-full input" placeholder="例如：rgb(255,255,255),rgb(199,226,243)" />
      </div>
      <button class="btn" @click="calculate">计算</button>
    </div>

    <div class="mt-4 space-y-2">
      <h3 class="font-bold">结果：</h3>
      <div v-for="(item, index) in result" :key="index">
        第 {{ index + 1 }} 个: [{{ item.ratio }} , '{{ item.color }}'] // {{ item.value }}
      </div>

      <div class="mt-4 flex items-center gap-2">
        <button class="btn bg-green-500 hover:bg-green-600" @click="copyToClipboard">一键复制灰度图颜色结果</button>
        <span v-if="copied" class="text-green-600">✅ 已复制！</span>
      </div>

      <div class="mt-2">
        <textarea  v-model="formattedResult" readonly class="w-full border p-2 rounded" rows="10"></textarea>
      </div>
    </div>

    <div class="mt-6 space-y-2">
        <h3 class="font-bold">刻度值+颜色：</h3>
        <div v-for="(item, index) in result" :key="'v-'+index">
            第 {{ index + 1 }} 个: [{{ item.value }} , '{{ item.color }}']
        </div>

        <div class="mt-4 flex items-center gap-2">
            <button class="btn bg-green-500 hover:bg-green-600" @click="copyValueColorResult">一键复制colorBar颜色</button>
            <span v-if="copied" class="text-green-600">✅ 已复制！</span>
        </div>

        <div class="mt-2">
            <textarea v-model="formattedValueColorResult" readonly class="w-full border p-2 rounded" rows="10"></textarea>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const min = ref(0)
const step = ref(1)
const valuesInput = ref('')
const colorsInput = ref('')
const result = ref([])
const copied = ref(false)

function calculate() {
  const values = valuesInput.value.split(',').map((v) => Number(v.trim()))
  const colors = Array.from(colorsInput.value.matchAll(/rgb\([^)]+\)/g)).map((match) => match[0])

  console.log(colors.length, values.length)

  if (colors.length !== values.length) {
    alert('❗颜色数量必须和刻度值数量一致')
    return
  }

  result.value = values.map((value, index) => {
    const x = Math.round((value - min.value) / step.value)
    const ratio = Number((x / 255).toFixed(6))
    return { value, x, ratio, color: colors[index] }
  })

  copied.value = false
}

const formattedResult = computed(() => {
  return result.value.map((item) => `[${item.ratio}, '${item.color}'], // ${item.value}`).join('\n')
})

function copyToClipboard() {
  navigator.clipboard.writeText(`[${formattedResult.value}\n]`).then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  })
}

// 生成 [value, color] 格式的数据
const formattedValueColorResult = computed(() => {
  if (!result.value.length) return ''
  return '\n' +
    result.value.map(item => `  [${item.value}, '${item.color}'],`).join('\n') +
    '\n'
})

// 新增复制 [value, color] 格式的方法
function copyValueColorResult() {
  navigator.clipboard.writeText(`[${formattedValueColorResult.value}\n]`).then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  })
}

/**
 * 根据最小值、步长、刻度数组和颜色数组生成最终的配色数组
 * @param {number} min 最小值
 * @param {number} step 步长
 * @param {number[]} values 刻度数组
 * @param {string[]} colors 颜色数组（如 'rgb(255,255,255)'）
 * @returns {Array} 返回 [[ratio, color], ...] 的二维数组
 */
function generateFinalColorArray(min, step, values, colors) {
  // 校验参数是否是数组
  if (!Array.isArray(values) || !Array.isArray(colors)) {
    throw new Error('values 和 colors 必须是数组')
  }

  // 校验数组长度是否一致
  if (values.length !== colors.length) {
    throw new Error('❗颜色数量必须和刻度值数量一致')
  }

  // 根据公式计算每个 ratio 并配对颜色，返回二维数组
  return values.map((value, index) => {
    // 先根据最小值和步长算出位置索引 x
    const x = Math.round((value - min) / step)

    // 根据 x 计算出 ratio，保留 6 位小数，并用 Number() 包裹，规范写法
    const ratio = Number((x / 255).toFixed(6))

    // 返回 [ratio, 对应颜色]
    return [ratio, colors[index]]
  })
}

onMounted(() => {
  // 示例数据
  const min = 0
  const step = 1
  const values = [1, 2, 4, 6, 8, 10, 15, 20, 25, 50]
  const colors = [
    'rgb(255,255,255)',
    'rgb(199,226,243)',
    'rgb(99,185,203)',
    'rgb(49,172,78)',
    'rgb(92,198,176)',
    'rgb(210,226,118)',
    'rgb(165,201,82)',
    'rgb(122,190,85)',
    'rgb(42,159,87)',
    'rgb(10,85,71)',
  ]

  // 调用生成结果
  const rawResult = generateFinalColorArray(min, step, values, colors)

  // 打印输出
  console.log(rawResult)
})
</script>

<style scoped>
.input {
  border: 1px solid #ccc;
  padding: 6px 10px;
  border-radius: 4px;
}
.btn {
  background-color: #4f46e5;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}
.btn:hover {
  background-color: #4338ca;
}
</style>
<!-- 1,2,4,6,8,10,15,20,25,50,100
rgb(255,255,255),rgb(199,226,243),rgb(99,185,203),rgb(49,172,78),rgb(92,198,176),rgb(210,226,118),rgb(165,201,82),rgb(122,190,85),rgb(42,159,87),rgb(10,85,71) -->
