<template>
  <div class="upload-container">
    <!-- 标题 -->
    <h2 class="title">海温评估图片展示</h2>

    <!-- 上传文件区域 -->
    <div class="upload-content">
      <div class="upload-label">评估文件</div>
      <div class="upload-input">
        <el-input
          v-model="fileName"
          placeholder="请选择文件"
          readonly
          class="file-input"
        >
          <!-- 搜索按钮 -->
          <template #append>
            <el-button @click="triggerFileUpload">
              <!-- <el-icon><el-icon-search /></el-icon> -->
               <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
        <!-- 隐藏的文件上传 input -->
        <input
          ref="fileInput"
          type="file"
          accept=".xlsx, .xls"
          style="display: none"
          @change="handleFileUpload"
        />
      </div>
    </div>

    <!-- 生成按钮 -->
    <el-button type="primary" class="generate-btn" @click="onGenerate">
      生成
    </el-button>

    <!-- 弹框展示图表和表格 -->
    <el-dialog
      v-model="isDialogVisible"
      :title="fileName"
      width="80%"
      top="5vh"
      :close-on-click-modal="false"
      @opened="generateChartAndTable"
    >
      <div id="chart-container" style="width: 100%; height: 650px; position: relative;">
        <div id="chart" style="width: 100%; height: 75%;"></div>
        <div id="table" style="width: 100%; margin-top: 10px;"></div>
      </div>
      <template #footer>
        <el-button @click="isDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, nextTick } from "vue";
import * as XLSX from "xlsx";
import * as echarts from "echarts";
import { ElMessage } from "element-plus";
import { Search } from "@element-plus/icons-vue"; // 引入图标

// 定义数据类型
interface ChartData {
  xAxisData: string[];
  seriesData: Record<string, number[]>;
}

// 数据存储
const chartData: ChartData = { xAxisData: [], seriesData: {} };
const fileName = ref<string>(""); // 存储文件名
const isDialogVisible = ref<boolean>(false); // 控制弹框显示
const fileInput = ref<HTMLInputElement | null>(null); // 引用文件 input
let fileContent: Uint8Array | null = null; // 保存文件内容

// 触发文件上传
const triggerFileUpload = (): void => {
  fileInput.value?.click();
};

// 文件上传处理
const handleFileUpload = (event: Event): void => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  fileName.value = file.name.replace(/\.[^/.]+$/, ""); // 提取文件名
  const reader = new FileReader();
  reader.onload = (e: ProgressEvent<FileReader>) => {
    if (e.target?.result) {
      fileContent = new Uint8Array(e.target.result as ArrayBuffer); // 保存文件数据
    }
  };
  reader.readAsArrayBuffer(file);
};

// 生成按钮点击事件
const onGenerate = (): void => {
  if (!fileContent) {
    ElMessage.warning("请先选择一个 Excel 文件！");
    return;
  }

  const workbook = XLSX.read(fileContent, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

  processExcelData(sheet as unknown[][]);
  isDialogVisible.value = true; // 打开弹框
};

// 处理 Excel 数据
const processExcelData = (sheet: unknown[][]): void => {
  const headers = sheet[0].slice(1) as string[]; // 提取地点列
  const rows = sheet.slice(1) as (string | number)[][];

  chartData.xAxisData = headers;
  chartData.seriesData = {};

  rows.forEach((row) => {
    const time = row[0] as string; // 时间
    chartData.seriesData[time] = row.slice(1) as number[]; // 数据
  });
};

// 生成图表和表格
const generateChartAndTable = async (): Promise<void> => {
  await nextTick();

  // 初始化 ECharts
  const chartContainer = document.getElementById("chart");
  if (!chartContainer) return;

  const chart = echarts.init(chartContainer);

  const option = {
    title: { text: fileName.value, left: "center" },
    tooltip: { trigger: "axis" },
    legend: {
      data: Object.keys(chartData.seriesData),
      top: "5%", // 图例放置在右上角
      right: "10%", // 距右侧的距离
    },
    grid: { top: 80, left: "13%", right: "5%", bottom: 40 },
    xAxis: { type: "category", data: chartData.xAxisData },
    yAxis: { type: "value", name: "检验值" },
    series: Object.keys(chartData.seriesData).map((time) => ({
      name: time,
      type: "bar",
      data: chartData.seriesData[time],
      barWidth: "20%",
    })),
  };

  chart.setOption(option);

  // 生成表格
  const table = document.getElementById("table");
  if (!table) return;

  let tableHtml = `
    <table style="width: 90%; margin: 0 auto; border-collapse: collapse; font-size: 14px;">
      <thead>
        <tr>
          <th style="border: 1px solid #ddd; padding: 5px; width: 80px;">时间</th>
          ${chartData.xAxisData
            .map((loc) => `<th style="border: 1px solid #ddd; padding: 5px;">${loc}</th>`)
            .join("")}
        </tr>
      </thead>
      <tbody>
        ${Object.entries(chartData.seriesData)
          .map(
            ([time, values]) =>
              `<tr>
                <td style="border: 1px solid #ddd; padding: 5px; width: 9%; text-align: center;">${time}</td>
                ${values
                  .map(
                    (v) =>
                      `<td style="border: 1px solid #ddd; padding: 5px; text-align: center;">${v || ''}</td>`
                  )
                  .join("")}
              </tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;
  table.innerHTML = tableHtml;
};
</script>

<style scoped>
.upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f3f3f3;
}

.title {
  font-size: 24px;
  color: #5e6d82;
  margin-bottom: 40px;
  font-weight: 600;
}

.upload-content {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  gap: 10px;
}

.upload-label {
  font-size: 16px;
  color: #333;
  width: 80px;
  text-align: right;
}

.upload-input {
  width: 400px;
}

.file-input {
  width: 100%;
}

.generate-btn {
  margin-top: 20px;
  width: 100px;
  height: 40px;
  font-size: 16px;
}
</style>