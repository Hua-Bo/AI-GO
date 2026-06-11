<template>
  <div>
    <input type="file" @change="handleFileUpload" accept=".xlsx, .xls" />
    <ChartDialog
      v-if="isDialogVisible"
      :chartData="chartData"
      :tableData="tableData"
      :fileName="fileName"
      @close="isDialogVisible = false"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import * as XLSX from "xlsx";
import ChartDialog from "../../components/ChartDialog.vue";

const fileName = ref(""); // 文件名
const chartData = ref({ xAxisData: [], seriesData: {} }); // 图表数据
const tableData = ref([]); // 表格数据
const isDialogVisible = ref(false); // 控制弹框显示

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  fileName.value = file.name.replace(/\.[^/.]+$/, ""); // 提取文件名
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

    processExcelData(sheet);
    isDialogVisible.value = true; // 打开弹框
  };
  reader.readAsArrayBuffer(file);
};

const processExcelData = (sheet) => {
  const headers = sheet[0].slice(1); // 地点列
  const rows = sheet.slice(1);

  chartData.value.xAxisData = headers;
  chartData.value.seriesData = {};

  rows.forEach((row) => {
    const time = row[0]; // 时间
    chartData.value.seriesData[time] = row.slice(1); // 各地点对应的数据
  });

  tableData.value = rows; // 保留表格数据
};
</script>
