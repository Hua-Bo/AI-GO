<template>
    <div>
      <!-- —— 表 1：高低潮误差表 —— -->
      <h3 style="text-align:center; margin: 16px 0;">高低潮误差表</h3>
      <el-table
        :data="tableData"
        border
        style="width: 100%; margin-bottom: 40px;"
        :header-cell-style="{ textAlign: 'center', verticalAlign: 'middle' }"
        :cell-style="{ textAlign: 'center' }"
      >
        <!-- 日期 列，跨 3 行 -->
        <el-table-column
          prop="date"
          label="日期"
          width="100"
          :rowspan="3"
        />
        <!-- 分组：高潮 -->
        <el-table-column label="高潮" :colspan="4">
          <!-- 子分组：高潮高 -->
          <el-table-column label="高潮高" :colspan="2">
            <el-table-column
              prop="high.rms"
              label="均方根误差（cm）"
            />
            <el-table-column
              prop="high.score"
              label="得分"
            />
          </el-table-column>
          <!-- 子分组：高潮时 -->
          <el-table-column label="高潮时" :colspan="2">
            <el-table-column
              prop="highTime.rms"
              label="均方根误差（min）"
            />
            <el-table-column
              prop="highTime.score"
              label="得分"
            />
          </el-table-column>
        </el-table-column>
        <!-- 分组：低潮 -->
        <el-table-column label="低潮" :colspan="4">
          <!-- 子分组：低潮高 -->
          <el-table-column label="低潮高" :colspan="2">
            <el-table-column
              prop="low.rms"
              label="均方根误差（cm）"
            />
            <el-table-column
              prop="low.score"
              label="得分"
            />
          </el-table-column>
          <!-- 子分组：低潮时 -->
          <el-table-column label="低潮时" :colspan="2">
            <el-table-column
              prop="lowTime.rms"
              label="均方根误差（min）"
            />
            <el-table-column
              prop="lowTime.score"
              label="得分"
            />
          </el-table-column>
        </el-table-column>
      </el-table>
  
      <!-- —— 表 2：绝对误差频率表 —— -->
      <h3 style="text-align:center; margin: 16px 0;">绝对误差频率表</h3>
      <el-table
        :data="freqData"
        border
        style="width: 100%;"
        :header-cell-style="{ textAlign: 'center', verticalAlign: 'middle' }"
        :cell-style="{ textAlign: 'center' }"
      >
        <!-- 要素 列，跨 3 行 -->
        <el-table-column
          prop="variable"
          label="要素"
          width="120"
          :rowspan="3"
        />
  
        <!-- 分组：高潮 -->
        <el-table-column label="高潮" :colspan="8">
          <!-- 子分组：高潮高 -->
          <el-table-column label="高潮高" :colspan="4">
            <el-table-column
              prop="high.rmsAvg"
              label="平均绝对误差（cm）"
            />
            <el-table-column label="绝对误差出现频率（%）" :colspan="3">
              <el-table-column
                prop="high.freq.10"
                label="≤10cm"
              />
              <el-table-column
                prop="high.freq.11_30"
                label="11–30cm"
              />
              <el-table-column
                prop="high.freq.31"
                label="≥31cm"
              />
            </el-table-column>
          </el-table-column>
          <!-- 子分组：高潮时 -->
          <el-table-column label="高潮时" :colspan="4">
            <el-table-column
              prop="highTime.rmsAvg"
              label="平均绝对误差（min）"
            />
            <el-table-column label="绝对误差出现频率（%）" :colspan="3">
              <el-table-column
                prop="highTime.freq.10"
                label="≤10min"
              />
              <el-table-column
                prop="highTime.freq.11_30"
                label="11–30min"
              />
              <el-table-column
                prop="highTime.freq.31"
                label="≥31min"
              />
            </el-table-column>
          </el-table-column>
        </el-table-column>
  
        <!-- 分组：低潮 -->
        <el-table-column label="低潮" :colspan="8">
          <!-- 子分组：低潮高 -->
          <el-table-column label="低潮高" :colspan="4">
            <el-table-column
              prop="low.rmsAvg"
              label="平均绝对误差（cm）"
            />
            <el-table-column label="绝对误差出现频率（%）" :colspan="3">
              <el-table-column
                prop="low.freq.10"
                label="≤10cm"
              />
              <el-table-column
                prop="low.freq.11_30"
                label="11–30cm"
              />
              <el-table-column
                prop="low.freq.31"
                label="≥31cm"
              />
            </el-table-column>
          </el-table-column>
          <!-- 子分组：低潮时 -->
          <el-table-column label="低潮时" :colspan="4">
            <el-table-column
              prop="lowTime.rmsAvg"
              label="平均绝对误差（min）"
            />
            <el-table-column label="绝对误差出现频率（%）" :colspan="3">
              <el-table-column
                prop="lowTime.freq.10"
                label="≤10min"
              />
              <el-table-column
                prop="lowTime.freq.11_30"
                label="11–30min"
              />
              <el-table-column
                prop="lowTime.freq.31"
                label="≥31min"
              />
            </el-table-column>
          </el-table-column>
        </el-table-column>
      </el-table>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  // 表 1：高低潮误差数据
  const tableData = ref([
    {
      date: '2025-07-09',
      high:      { rms: 1.2,  score: 95 },
      highTime:  { rms: 2.0,  score: 90 },
      low:       { rms: 1.5,  score: 88 },
      lowTime:   { rms: 3.0,  score: 85 },
    },
    {
      date: '2025-07-10',
      high:      { rms: 1.1,  score: 96 },
      highTime:  { rms: 1.8,  score: 92 },
      low:       { rms: 1.6,  score: 87 },
      lowTime:   { rms: 2.9,  score: 86 },
    },
    {
      date: '2025-07-11',
      high:      { rms: 1.3,  score: 94 },
      highTime:  { rms: 2.1,  score: 89 },
      low:       { rms: 1.4,  score: 89 },
      lowTime:   { rms: 3.1,  score: 84 },
    },
  ])
  
  // 表 2：绝对误差频率数据
  const freqData = ref([
    {
      variable: '站点 A',
      high: {
        rmsAvg: 0.5,
        freq: { 10: 60, 11_30: 30, 31: 10 }
      },
      highTime: {
        rmsAvg: 1.2,
        freq: { 10: 70, 11_30: 25, 31: 5 }
      },
      low: {
        rmsAvg: 0.6,
        freq: { 10: 65, 11_30: 28, 31: 7 }
      },
      lowTime: {
        rmsAvg: 1.3,
        freq: { 10: 68, 11_30: 27, 31: 5 }
      }
    },
    // …更多行
  ])
  </script>