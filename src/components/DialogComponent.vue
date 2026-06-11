<template>
    <el-dialog
      :model-value="modelValue"
      :title="title"
      width="80%"
      top="5vh"
      :close-on-click-modal="false"
      @opened="onOpened"
      @close="closeDialog"
    >
      <div id="chart-container" style="width: 100%; height: 650px; position: relative;">
        <div id="chart" style="width: 100%; height: 75%;"></div>
        <div id="table" style="width: 100%; margin-top: 10px;"></div>
      </div>
      <template #footer>
        <el-button @click="closeDialog">关闭</el-button>
      </template>
    </el-dialog>
  </template>
  
  <script lang="ts" setup>
  import { nextTick, defineProps, defineEmits } from "vue";
  import * as echarts from "echarts";
  
  // Props
  defineProps({
    modelValue: {
      type: Boolean,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    chartData: {
      type: Object,
      required: true,
    },
  });
  
  // Emits
  const emit = defineEmits(["update:modelValue"]);
  
  // 打开弹框
  const onOpened = async () => {
    await nextTick();
    generateChart();
    generateTable();
  };
  
  // 生成图表
  const generateChart = () => {
    const chartContainer = document.getElementById("chart");
    if (!chartContainer) return;
  
    const chart = echarts.init(chartContainer);
  
    const option = {
      title: { text: title, left: "center" },
      tooltip: { trigger: "axis" },
      legend: { data: Object.keys(chartData.seriesData), top: "5%", right: "10%" },
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
  };
  
  // 生成表格
  const generateTable = () => {
    const table = document.getElementById("table");
    if (!table) return;
  
    const tableHtml = `
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
                  <td style="border: 1px solid #ddd; padding: 5px; text-align: center;">${time}</td>
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
  
  // 关闭弹框
  const closeDialog = () => {
    emit("update:modelValue", false); // 触发父组件更新
  };
  </script>