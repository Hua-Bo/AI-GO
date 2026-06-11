<template>
    <el-dialog
      title="数据展示"
      :visible.sync="isVisible"
      width="80%"
      @close="handleClose"
      destroy-on-close
    >
      <div id="chart-container" v-if="isVisible" style="width: 100%; height: 500px;">
        <div id="chart" style="width: 100%; height: 75%;"></div>
        <div id="table" style="width: 100%; margin-top: 10px;"></div>
      </div>
    </el-dialog>
  </template>
  
  <script setup>
  import { ref, nextTick, watch } from "vue";
  import * as echarts from "echarts";
  
  const props = defineProps({
    chartData: Object, // 图表数据
    tableData: Array, // 表格数据
    fileName: String, // 文件名
  });
  
  const emit = defineEmits(["close"]);
  const isVisible = ref(true);
  
  const handleClose = () => {
    emit("close");
  };
  
  const generateChart = () => {
    const chartDom = document.getElementById("chart");
    if (!chartDom) {
      console.error(
        "Chart DOM element not found. Possible reasons: \n" +
        "1. The dialog has not finished rendering.\n" +
        "2. The DOM structure is incorrect.\n" +
        "3. The dialog was closed and the DOM was destroyed."
      );
      return;
    }
  
    const chart = echarts.init(chartDom);
    const option = {
      title: {
        text: props.fileName,
        left: "center",
      },
      tooltip: {
        trigger: "axis",
      },
      legend: {
        data: Object.keys(props.chartData.seriesData),
        top: "5%",
        right: "10%",
      },
      grid: {
        top: 80,
        left: "15%",
        right: "5%",
        bottom: 40,
      },
      xAxis: {
        type: "category",
        data: props.chartData.xAxisData,
      },
      yAxis: {
        type: "value",
        name: "检验值",
      },
      series: Object.keys(props.chartData.seriesData).map((key) => ({
        name: key,
        type: "bar",
        data: props.chartData.seriesData[key],
        barWidth: "20%",
      })),
    };
    chart.setOption(option);
  };
  
  const generateTable = () => {
    const table = document.getElementById("table");
    if (!table) {
      console.warn("Table DOM element not found. Skipping table generation.");
      return;
    }
    let tableHtml = `
      <table style="width: 90%; margin: 0 auto; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr>
            <th style="border: 1px solid #ddd; padding: 5px; width: 10%;">时间</th>
            ${props.chartData.xAxisData
              .map(
                (location) =>
                  `<th style="border: 1px solid #ddd; padding: 5px; text-align: center;">${location}</th>`
              )
              .join("")}
          </tr>
        </thead>
        <tbody>
          ${props.tableData
            .map(
              (row) =>
                `<tr>
                  <td style="border: 1px solid #ddd; padding: 5px; text-align: center;">${row[0]}</td>
                  ${props.chartData.xAxisData
                    .map(
                      (location, index) =>
                        `<td style="border: 1px solid #ddd; padding: 5px; text-align: center;">${
                          row[index + 1] || ""
                        }</td>`
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
  
  // 确保弹框显示时初始化图表和表格
  watch(
    () => isVisible,
    (visible) => {
      if (visible) {
        nextTick(() => {
          generateChart();
          generateTable();
        });
      }
    }
  );
  </script>
  
  <style scoped>
  #chart-container table {
    font-size: 14px;
    text-align: center;
  }
  </style>