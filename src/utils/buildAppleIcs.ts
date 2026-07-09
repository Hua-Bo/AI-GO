export interface CalendarReminderItem {
  title: string
  date: string
  startTime: string
  endTime?: string
  location?: string
  description?: string
  remindBeforeMinutes?: number
}

const pad = (n: number) => String(n).padStart(2, '0')

export const escapeIcsText = (text = '') => {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

const toUtcIcsTime = (date: string, time: string, timezoneOffsetHours = 8) => {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)

  const localDate = new Date(Date.UTC(
    year,
    month - 1,
    day,
    hour - timezoneOffsetHours,
    minute,
    0,
  ))

  return [
    localDate.getUTCFullYear(),
    pad(localDate.getUTCMonth() + 1),
    pad(localDate.getUTCDate()),
  ].join('') + 'T' + [
    pad(localDate.getUTCHours()),
    pad(localDate.getUTCMinutes()),
    '00',
  ].join('') + 'Z'
}

const addMinutes = (date: string, time: string, minutesToAdd: number) => {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)

  const d = new Date(year, month - 1, day, hour, minute, 0)
  d.setMinutes(d.getMinutes() + minutesToAdd)

  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

export const buildAppleCompatibleIcs = (
  reminders: CalendarReminderItem[],
  calendarTitle = '旅游行程提醒',
) => {
  const now = new Date()
  const dtstamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')

  const events = reminders.map((item, index) => {
    const endDateTime = item.endTime
      ? { date: item.date, time: item.endTime }
      : addMinutes(item.date, item.startTime, 60)

    const start = toUtcIcsTime(item.date, item.startTime)
    const end = toUtcIcsTime(endDateTime.date, endDateTime.time)
    const alarmMinutes = item.remindBeforeMinutes ?? 15

    return [
      'BEGIN:VEVENT',
      `UID:travel-${Date.now()}-${index}@travel-ai-page`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escapeIcsText(item.title)}`,
      `LOCATION:${escapeIcsText(item.location || '')}`,
      `DESCRIPTION:${escapeIcsText(item.description || calendarTitle)}`,
      'BEGIN:VALARM',
      `TRIGGER:-PT${alarmMinutes}M`,
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcsText(item.title)}`,
      'END:VALARM',
      'END:VEVENT',
    ].join('\r\n')
  })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Travel AI Planner Frontend//CN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(calendarTitle)}`,
    'X-WR-TIMEZONE:Asia/Shanghai',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}
