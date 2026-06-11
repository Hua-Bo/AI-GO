<template>
  <el-dialog v-model="value" width="80%" class="snow-info-dialog">
    <!-- 头部筛选 -->
    <div class="filter-container">
      <el-form inline :model="filters" class="filter-form">
        <el-form-item label="数据源">
          <el-select v-model="filters.dataSource" placeholder="请选择" style="width:200px">
            <el-option
              v-for="item in dataSourceOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="时间">
          <el-select v-model="filters.timeUnit" placeholder="请选择" style="width:100px">
            <el-option
              v-for="item in timeOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="区域">
          <el-select v-model="filters.regionLevel" placeholder="请选择" style="width:180px">
            <el-option
              v-for="item in regionLevelOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-select v-model="filters.subRegion" placeholder="全部" style="width:100px">
            <el-option
              v-for="item in subRegionOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="寒潮类型">
          <el-select v-model="filters.coldType" placeholder="请选择" style="width:160px">
            <el-option
              v-for="item in coldTypeOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="变量">
          <el-select v-model="filters.variable" placeholder="请选择" style="width:120px">
            <el-option
              v-for="item in variableOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-select v-model="filters.operator" placeholder="运算符" style="width:60px">
            <el-option
              v-for="item in operatorOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-input
            v-model="filters.value"
            placeholder="请输入数值"
            style="width:120px"
            clearable
          />
        </el-form-item>

        <!-- <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
        </el-form-item> -->
      </el-form>
    </div>

    <!-- 数据表格 -->
    <el-table
      :data="tableData"
      table-layout="fixed"
      height="35rem"
      style="width: 100%"
    >
      <el-table-column prop="index" label="序号" />
      <el-table-column prop="date" label="时间" />

      <!-- default 模式 -->
      <template v-if="tableMode === 'default'">
        <el-table-column prop="station" label="站号" />
        <el-table-column prop="lng" label="经度" />
        <el-table-column prop="lat" label="纬度" />
        <el-table-column prop="elevation" label="高度" />
      </template>

      <!-- simple 模式 -->
      <template v-if="tableMode === 'simple'">
        <el-table-column prop="region" label="区域" />
      </template>

      <el-table-column prop="amount" label="数量" />
      <el-table-column prop="freq" label="频率" />
      <el-table-column prop="duration" label="持续时间" />
      <el-table-column prop="intensity" label="强度" />
      <el-table-column prop="amplitude" label="振幅" />
    </el-table>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="value = false">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  modelValue: boolean
}>()
const emits = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const value = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emits('update:modelValue', value),
})

// 筛选条件
const filters = reactive({
  dataSource: '',
  timeUnit: '',
  regionLevel: '',
  subRegion: '',
  coldType: '',
  variable: '',
  operator: '',
  value: ''
})

const tableMode = ref<'default' | 'simple'>('default') // 默认渲染模式

// 下拉选项示例
const dataSourceOptions = [
  '全球地面气温日值整合数据',
  '其他数据源 A',
  '其他数据源 B'
]
const timeOptions         = ['年', '月', '日']
const regionLevelOptions  = ['第三级区域国家', '省', '市']
const subRegionOptions    = ['全部', '区域 1', '区域 2']
const coldTypeOptions     = ['ECI寒潮', '其他寒潮类型']
const variableOptions     = ['数量', '频率', '持续时间', '强度', '振幅']
const operatorOptions     = ['<', '<=', '=', '>=', '>']

// 表格示例数据
const tableData = ref([
  { index: 1, date: '2023-06-24', station: 15, lng: '128.67°', lat: '113.50°', elevation: '2,600米', amount: 321, freq: 6, duration: '20天', intensity: 1, amplitude: 1 },
  { index: 2, date: '2023-06-27', station: 87, lng: '121.90°', lat: '116.39°', elevation: '8,400米', amount: 789, freq: 39, duration: '19天', intensity: 2, amplitude: 2 },
  // … 共 10 行，你可以替换成接口数据
])

watch(() => filters.dataSource, val => {
  if (val === '全球地面气温日值整合数据') {
    tableMode.value = 'default'
  } else {
    tableMode.value = 'simple'
  }
})

// 查询事件
function onSearch() {
  // TODO: 根据 filters 调用接口获取真实 tableData
  ElMessage.success(`查询条件：${JSON.stringify(filters)}`)
}
</script>

<style scoped>
/* 隐藏 el-dialog 默认 header */
.data-modal ::v-deep .el-dialog__header {
  display: none;
}

/* 筛选区域样式 */
.filter-container {
  border-bottom: 1px solid #ebeef5;
  padding: 16px 24px 0;
  margin-bottom: 16px;
}
.filter-form .el-form-item {
  margin-right: 24px;
  margin-bottom: 14px;
}

/* 底部按钮对齐 */
.dialog-footer {
  text-align: right;
}
</style>

<style>
.snow-info-dialog {
  background: linear-gradient( 180deg, #E7EFFF 0%, #FFFFFF 15%, #FFFFFF 100%);
  box-shadow: 0px 3px 8px 0px rgba(0,0,0,0.16);
  border-radius: 8px 8px 8px 8px;
  position: relative;
}

.snow-info-dialog .el-dialog__headerbtn {
  top: 16px !important;
  right: 16px !important;
  font-size: 24px !important;
  color: white !important;
}

.snow-info-dialog .el-dialog__headerbtn .el-icon {
  width: 24px;
  height: 24px;
  fill: white !important;
  color: white !important;
}
</style>