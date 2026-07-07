import type {
  AiReport,
  RagReference,
  ServiceTemplate,
  SmsForm,
  WeatherData,
} from '@/types/aiTypes'
import {
  buildForecastTimeRange,
  formatChinaIssueTime,
  getNowContext,
} from '@/utils/datetime'

export const MOCK_REFERENCES: RagReference[] = [
  {
    id: 'ref-1',
    title: '《强对流天气服务规范》',
    fileName: '强对流服务规范_v2.3.pdf',
    content: '强对流天气服务短信应在预警发布后 30 分钟内完成首条提醒，内容须包含影响区域、时段及防范建议。',
    score: 0.92,
    sourceType: '规范文件',
  },
  {
    id: 'ref-2',
    title: '《海雾服务提醒模板》',
    fileName: '海雾模板库.docx',
    content: '短信模板应区分政府决策用户、行业用户及公众用户，语言风格由正式到通俗逐级调整。',
    score: 0.87,
    sourceType: '模板库',
  },
  {
    id: 'ref-3',
    title: '《行业用户服务手册》',
    fileName: '行业服务手册_2025.pdf',
    content: '内参报告须包含风险等级、影响区域、分区域建议及后续跟踪安排，表格字段与业务系统保持一致。',
    score: 0.85,
    sourceType: '手册',
  },
  {
    id: 'ref-4',
    title: '《历史服务案例》',
    fileName: 'cases_2024_wuxi.json',
    content: '2024-07-15 无锡强对流过程：发布橙色预警，交通与农业部门收到定向提醒，2 小时内完成全渠道触达。',
    score: 0.81,
    sourceType: '案例库',
  },
]

export function extractRegionFromQuery(userInput: string): string {
  const district = userInput.match(/([\u4e00-\u9fa5]{1,6}(?:市|县|区))/)
  if (district) return district[1]
  if (/滨湖/.test(userInput)) return '滨湖区'
  if (/无锡/.test(userInput)) return '无锡市'
  if (/宜兴/.test(userInput)) return '宜兴市'
  if (/江阴/.test(userInput)) return '江阴市'
  return '无锡市'
}

function weatherMeta(now = new Date()) {
  return {
    dataTime: getNowContext(now),
    issueTime: formatChinaIssueTime(now),
    timeRange: buildForecastTimeRange(1, 6, now),
  }
}

export function mockGetWeatherData(region = '无锡市', userInput = ''): WeatherData {
  const meta = weatherMeta()
  if (/台风|热带气旋|热带风暴/.test(userInput)) {
    const nameMatch = userInput.match(/台风[\u201c\u201d"']?([\u4e00-\u9fa5A-Za-z0-9]+)/)
      || userInput.match(/台风([\u4e00-\u9fa5A-Za-z]+)/)
    const typhoonLabel = nameMatch?.[1] ? `台风${nameMatch[1]}` : '台风'
    return {
      region,
      weatherType: `${typhoonLabel}外围影响`,
      riskLevel: '黄色',
      timeRange: buildForecastTimeRange(12, 24),
      wind: '阵风 7—9 级，沿江沿海 8—10 级',
      precipitation: '过程雨量 40—80mm，局地 100mm 以上',
      radar: `${typhoonLabel}向偏北移动，${region}处于外围螺旋雨带影响区，中心不直接过境城区`,
      dataTime: meta.dataTime,
      issueTime: meta.issueTime,
    }
  }
  if (/是否有雨|下雨|降雨|降水/.test(userInput)) {
    return {
      region: region.includes('市') || region.includes('区') ? region : `${region}市`,
      weatherType: '阵雨',
      riskLevel: '蓝色',
      timeRange: buildForecastTimeRange(2, 8),
      wind: '东南风 3—4 级',
      precipitation: '有中到大雨，局地暴雨',
      radar: '雷达回波显示分散性对流发展，午后起影响范围扩大',
      dataTime: meta.dataTime,
      issueTime: meta.issueTime,
    }
  }
  if (/风险|预警|强对流/.test(userInput)) {
    return {
      region,
      weatherType: '雷雨大风',
      riskLevel: '黄色',
      timeRange: meta.timeRange,
      wind: '阵风 7—9 级，局地雷暴大风',
      precipitation: '伴有短时强降水，小时雨强 20—40mm',
      radar: '雷达回波呈带状东移，强回波中心位于滨湖—惠山一带',
      dataTime: meta.dataTime,
      issueTime: meta.issueTime,
    }
  }
  return {
    region,
    weatherType: '强对流天气',
    riskLevel: '橙色',
    timeRange: meta.timeRange,
    wind: '阵风 8—10 级，局地雷暴大风',
    precipitation: '小时雨强 30—50mm，伴有短时强降水',
    radar: '雷达回波呈带状东移，强回波中心位于宜兴—无锡北部',
    dataTime: meta.dataTime,
    issueTime: meta.issueTime,
  }
}

export function mockGetServiceTemplate(target = '行业用户'): ServiceTemplate {
  const templates: Record<string, string> = {
    行业用户: '【气象服务提醒】{region}{timeRange}将出现{weatherType}，风险等级{riskLevel}。请加强防范，关注最新预警信息。',
    政府决策用户: '【决策服务】{region}预计{timeRange}{weatherType}，风险{riskLevel}。建议启动应急响应联动机制。',
    公众用户: '【天气提醒】{region}{timeRange}有{weatherType}，请注意出行安全，远离临时搭建物。',
  }
  return {
    target,
    template: templates[target] || templates['行业用户'],
  }
}

export function mockGenerateWarningSms(weather: WeatherData, template: ServiceTemplate): string {
  const body = template.template
    .replace('{region}', weather.region)
    .replace('{timeRange}', weather.timeRange)
    .replace('{weatherType}', weather.weatherType)
    .replace('{riskLevel}', weather.riskLevel)
  return `${body}（${weather.region}气象台，${weather.issueTime}发布）`
}

export function mockGenerateInternalReport(weather: WeatherData): AiReport {
  const isTyphoon = /台风/.test(weather.weatherType)
  return {
    title: `${weather.region}${weather.weatherType}内参报告`,
    summary: `${weather.region}预计${weather.timeRange}受${weather.weatherType}影响，风险等级${weather.riskLevel}。${weather.radar}，需重点关注交通、水利及户外作业安全。`,
    riskLevel: weather.riskLevel,
    affectedAreas: [weather.region, '宜兴市', '江阴市', '惠山区'],
    timeRange: weather.timeRange,
    table: isTyphoon
      ? [
          {
            area: weather.region,
            weatherType: weather.weatherType,
            riskLevel: weather.riskLevel,
            timeRange: '26日夜间—27日',
            suggestion: '加固临时设施，暂停高空及水上户外作业',
          },
          {
            area: '宜兴市',
            weatherType: '台风降水',
            riskLevel: '黄色',
            timeRange: '27日白天',
            suggestion: '关注水库泄洪与地质灾害隐患点',
          },
          {
            area: '江阴市',
            weatherType: '大风',
            riskLevel: '黄色',
            timeRange: '26日—27日',
            suggestion: '加强沿江港口船舶避风管理',
          },
        ]
      : [
          {
            area: weather.region,
            weatherType: weather.weatherType,
            riskLevel: weather.riskLevel,
            timeRange: weather.timeRange,
            suggestion: '启动行业用户定向提醒，加强雷达监测',
          },
          {
            area: '宜兴市',
            weatherType: '雷暴大风',
            riskLevel: '橙色',
            timeRange: '14:00—18:00',
            suggestion: '关注水库及旅游景区安全',
          },
          {
            area: '江阴市',
            weatherType: '短时强降水',
            riskLevel: '黄色',
            timeRange: '15:00—19:00',
            suggestion: '注意城市内涝及交通疏导',
          },
        ],
    chartData: isTyphoon
      ? [
          { name: '无锡', value: 68 },
          { name: '宜兴', value: 62 },
          { name: '江阴', value: 75 },
          { name: '惠山', value: 58 },
        ]
      : [
          { name: '无锡', value: 85 },
          { name: '宜兴', value: 72 },
          { name: '江阴', value: 68 },
          { name: '惠山', value: 55 },
        ],
    suggestion: isTyphoon
      ? `建议于 ${formatChinaIssueTime()} 前发布台风防御提醒短信，并视路径订正动态调整服务等级。`
      : `建议于 ${formatChinaIssueTime()} 前完成短信审核发布，并启动小时级跟踪会商。`,
  }
}

export function buildSmsFormFromWeather(weather: WeatherData): SmsForm {
  return {
    region: weather.region,
    target: '行业用户',
    weatherType: weather.weatherType,
    timeRange: weather.timeRange,
    riskLevel: weather.riskLevel,
    remark: `${weather.radar}（数据时间：${weather.dataTime}，${weather.issueTime}发布）`,
  }
}

/** 将 Agent 工具查询结果注入模型上下文，避免编造日期 */
export function buildAgentToolContext(
  userInput: string,
  smsForm: SmsForm,
  sms: string,
  reportTitle?: string,
): string {
  return `【系统最新查询结果 · ${getNowContext()}】
用户诉求：${userInput}
区域：${smsForm.region}
天气类型：${smsForm.weatherType}
风险等级：${smsForm.riskLevel}
预报时段：${smsForm.timeRange}
会商/雷达：${smsForm.remark}
短信草稿：${sms}
${reportTitle ? `内参报告标题：${reportTitle}` : ''}

请基于以上数据撰写回复。日期、时段、发布时间必须与上述字段完全一致，不得使用占位符或编造时间。`
}

export function buildMockAgentReply(userInput: string, form: SmsForm): string {
  const dataTime = form.remark?.match(/数据时间：([^（）]+)/)?.[1]?.trim() || getNowContext()
  return `## 服务方案已生成

已根据**${form.region} · ${form.weatherType}**形势，完成以下工作：

1. 查询实时天气与雷达回波数据
2. 匹配行业用户短信模板
3. 生成服务短信草稿
4. 输出内参报告（含分区域表格与风险图表）

### 要点摘要

- **关联问题**：${userInput.slice(0, 40)}
- **数据时间**：${dataTime}
- **风险等级**：${form.riskLevel}
- **预报时段**：${form.timeRange}
- **天气类型**：${form.weatherType}

请在右侧预览区查看短信草稿与内参报告，支持人工编辑后导出。`
}

/** Mock 模式下普通问答的上下文回复 */
export function mockChatReply(userInput: string): string {
  const region = extractRegionFromQuery(userInput)

  if (/台风|热带气旋/.test(userInput)) {
    const nameMatch = userInput.match(/台风[\u201c\u201d"']?([\u4e00-\u9fa5A-Za-z0-9]+)/)
      || userInput.match(/台风([\u4e00-\u9fa5A-Za-z]+)/)
    const typhoonName = nameMatch?.[1] || '巴威'
    const range = buildForecastTimeRange(12, 24)
    return `## 台风${typhoonName}对${region}影响研判

**数据时间**：${getNowContext()}

根据最新数值预报和路径集合分析：

**路径概况**：台风${typhoonName}未来 48 小时以偏北—东北方向移动，强度缓慢增强。

**对${region}影响**：
- ${region}处于台风**外围风雨影响区**，并非预报登陆核心区
- 预计 **${range}** 风雨趋于明显
- 过程最大阵风 7—9 级，有中到大雨，局地暴雨

**是否经过${region}？**  
台风中心**不直接经过**${region}城区，但外围螺旋雨带将带来明显风雨影响。

> 预报时效较长，请密切关注后续路径订正及当地气象台短临预警。`
  }

  if (/降雨|下雨|降水|是否有雨/.test(userInput)) {
    const now = getNowContext()
    const range = buildForecastTimeRange(2, 8)
    return `## ${region}降雨预报

**数据时间**：${now}

**预报时段**：${range}

- **上午**：多云，局部短时阵雨
- **午后—夜间**：降雨趋于明显，有中到大雨
- **降雨概率**：约 70%
- **累计雨量**：15—30mm，局地 50mm 以上

**风险提示**：午后对流发展，可能伴有雷电和短时强降水，出行请关注最新雷达回波与短临预警。`
  }

  return `## 气象答复

**数据时间**：${getNowContext()}

已收到您关于「${userInput.slice(0, 36)}」的咨询。

当前为 **Mock 演示模式**，以上为示例答复。切换真实模型可获得更精准分析。

如需生成服务短信或内参报告，请明确说明，例如：
- 生成无锡强对流服务短信
- 查询滨湖区风险提示`
}

/** @deprecated 使用 buildMockAgentReply */
export const MOCK_STREAM_REPLY = buildMockAgentReply(
  '生成强对流服务材料',
  buildSmsFormFromWeather(mockGetWeatherData('无锡市', '强对流')),
)
