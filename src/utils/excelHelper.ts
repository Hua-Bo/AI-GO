// utils/excelHelper.js
export const parseExcelData = (sheet: any) => {
    const headers = sheet[0].slice(1); // 提取地点列
    const rows = sheet.slice(1);
  
    const xAxisData = headers;
    const seriesData: any = {};
  
    rows.forEach((row: any) => {
      const time = row[0]; // 时间
      seriesData[time] = row.slice(1); // 数据
    });
  
    return { xAxisData, seriesData };
  };
  
  // utils/chartHelper.js
  // 导出一个函数，用于生成EChart的配置项
  export const generateEChartOption = (title: string, xAxisData: any, seriesData: any) => ({
    // 设置图表标题
    title: { text: title, left: "center" },
    // 设置提示框
    tooltip: { trigger: "axis" },
    // 设置图例
    legend: {
      // 设置图例数据
      data: Object.keys(seriesData),
      // 设置图例位置
      top: "5%", 
      right: "10%",
    },
    // 设置网格
    grid: { top: 80, left: "13%", right: "5%", bottom: 40 },
    // 设置X轴
    xAxis: { type: "category", data: xAxisData },
    // 设置Y轴
    yAxis: { type: "value", name: "检验值" },
    // 设置系列数据
    series: Object.keys(seriesData).map((time) => ({
      // 设置系列名称
      name: time,
      // 设置系列类型
      type: "bar",
      // 设置系列数据
      data: seriesData[time],
      // 设置柱状图宽度
      barWidth: "20%",
    })),
  });