const TZ = 'Asia/Shanghai'

function parts(d: Date) {
  const fmt = new Intl.DateTimeFormat('zh-CN', {
    timeZone: TZ,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const map: Record<string, string> = {}
  for (const p of fmt.formatToParts(d)) {
    if (p.type !== 'literal') map[p.type] = p.value
  }
  return {
    year: map.year || '',
    month: map.month || '',
    day: map.day || '',
    hour: map.hour || '00',
    minute: map.minute || '00',
  }
}

/** 当前北京时间描述，供系统提示与模型上下文使用 */
export function getNowContext(d = new Date()): string {
  const p = parts(d)
  return `${p.year}年${p.month}月${p.day}日 ${p.hour}:${p.minute}（北京时间）`
}

export function formatChinaDate(d = new Date()): string {
  const p = parts(d)
  return `${p.year}年${p.month}月${p.day}日`
}

export function formatChinaDateTime(d = new Date()): string {
  const p = parts(d)
  return `${p.year}年${p.month}月${p.day}日 ${p.hour}:${p.minute}`
}

export function formatChinaIssueTime(d = new Date()): string {
  const p = parts(d)
  return `${p.year}年${p.month}月${p.day}日${p.hour}时`
}

/** 从当前时刻起未来几小时的预报时段 */
export function buildForecastTimeRange(startOffsetHours = 1, durationHours = 6, base = new Date()): string {
  const start = new Date(base.getTime() + startOffsetHours * 3600000)
  const end = new Date(start.getTime() + durationHours * 3600000)
  const ps = parts(start)
  const pe = parts(end)
  const sameDay = ps.year === pe.year && ps.month === pe.month && ps.day === pe.day
  if (sameDay) {
    return `${ps.year}年${ps.month}月${ps.day}日 ${ps.hour}:${ps.minute}—${pe.hour}:${pe.minute}`
  }
  return `${formatChinaDateTime(start)}—${formatChinaDateTime(end)}`
}

export function buildSystemPrompt(): string {
  return `你是气象行业服务智能助手，负责协助生成强对流等服务短信与内参报告。
当前系统时间：${getNowContext()}。
回答应专业、简洁，使用 Markdown 格式。
涉及日期、时段、发布时间时必须使用系统提供的最新查询数据，禁止编造日期，禁止使用占位符（如 X 日、某月某日）。
若用户提供了工具查询结果，必须与其保持一致。`
}
