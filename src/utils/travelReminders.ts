import { ElMessage } from 'element-plus'
import type { DetailedDailyPlan, DetailedTravelGuide, TravelReminder } from '@/types/travelTypes'
import {
  addRemindersToCalendar,
  applyReminderMinutes,
  copyReminderText,
  type CalendarReminderItem,
} from '@/utils/calendarReminder'

function normalizeTime(time: string): string {
  const m = time.match(/(\d{1,2}):(\d{2})/)
  if (!m) return '09:00'
  return `${String(Number(m[1])).padStart(2, '0')}:${m[2]}`
}

function estimateEndTime(startTime: string, duration?: string): string | undefined {
  const m = startTime.match(/(\d{1,2}):(\d{2})/)
  if (!m) return undefined
  let minutes = Number(m[1]) * 60 + Number(m[2])
  const hourMatch = duration?.match(/(\d+(?:\.\d+)?)\s*小时/)
  const minMatch = duration?.match(/(\d+)\s*分钟/)
  if (hourMatch) minutes += Math.round(Number(hourMatch[1]) * 60)
  else if (minMatch) minutes += Number(minMatch[1])
  else minutes += 90
  const h = Math.floor(minutes / 60) % 24
  const mm = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function toCalendarItem(r: TravelReminder): CalendarReminderItem {
  return {
    title: r.title,
    date: r.date,
    startTime: r.startTime,
    endTime: r.endTime,
    location: r.location,
    description: r.description,
    remindBeforeMinutes: r.remindBeforeMinutes,
  }
}

export function normalizeTravelReminder(raw: unknown, index: number, fallbackDate: string, remindBeforeMinutes: number): TravelReminder {
  const item = raw as Partial<TravelReminder>
  return {
    id: String(item.id || `reminder_${index}`),
    title: String(item.title || '行程提醒'),
    date: String(item.date || fallbackDate),
    startTime: normalizeTime(String(item.startTime || '09:00')),
    endTime: item.endTime ? normalizeTime(item.endTime) : undefined,
    location: item.location ? String(item.location) : undefined,
    description: item.description ? String(item.description) : undefined,
    remindBeforeMinutes: typeof item.remindBeforeMinutes === 'number' ? item.remindBeforeMinutes : remindBeforeMinutes,
  }
}

export function buildRemindersFromDay(day: DetailedDailyPlan, remindBeforeMinutes = 15): TravelReminder[] {
  const date = day.dateText || day.weather?.date || ''
  if (!date) return []
  if (day.reminders?.length) {
    return day.reminders.map((r, i) => normalizeTravelReminder(r, i, date, remindBeforeMinutes))
  }
  return (day.timeline || [])
    .filter((item) => item.time && /\d{1,2}:\d{2}/.test(item.time))
    .map((item, i) => ({
      id: `day${day.day}_${i}`,
      title: item.title,
      date,
      startTime: normalizeTime(item.time),
      endTime: estimateEndTime(item.time, item.duration),
      location: item.location || item.city,
      description: item.description,
      remindBeforeMinutes,
    }))
}

export function collectAllReminders(guide: DetailedTravelGuide, remindBeforeMinutes = 15): TravelReminder[] {
  return (guide.dailyPlans || []).flatMap((day) => buildRemindersFromDay(day, remindBeforeMinutes))
}

function toCalendarItems(reminders: TravelReminder[], remindBeforeMinutes: number): CalendarReminderItem[] {
  return applyReminderMinutes(reminders.map(toCalendarItem), remindBeforeMinutes)
}

export type AddCalendarResult =
  | { ok: true; mode: 'shared' | 'downloaded' }
  | { ok: false; reason: 'empty' | 'cancelled' | 'error'; message?: string }

export async function addDayToCalendar(
  day: DetailedDailyPlan,
  calendarTitle: string,
  remindBeforeMinutes = 15,
): Promise<AddCalendarResult> {
  const reminders = buildRemindersFromDay(day, remindBeforeMinutes)
  if (!reminders.length) return { ok: false, reason: 'empty' }

  try {
    const mode = await addRemindersToCalendar(toCalendarItems(reminders, remindBeforeMinutes), {
      title: calendarTitle,
      filename: `travel-day-${day.day}-reminders.ics`,
      onWechatIOS: () => {
        ElMessage.warning('iPhone 微信内打开可能无法添加日历，请点击右上角用 Safari 打开')
      },
      onFallbackDownload: () => {
        ElMessage.success('当天日历文件已生成，请打开文件并添加到系统日历')
      },
    })
    return { ok: true, mode }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      return { ok: false, reason: 'cancelled' }
    }
    return {
      ok: false,
      reason: 'error',
      message: '添加当天日历失败，请复制提醒文本后手动添加',
    }
  }
}

export async function addAllToCalendar(
  guide: DetailedTravelGuide,
  remindBeforeMinutes = 15,
): Promise<AddCalendarResult> {
  const reminders = collectAllReminders(guide, remindBeforeMinutes)
  if (!reminders.length) return { ok: false, reason: 'empty' }

  const title = `${guide.basicInfo.destination || '旅游行程'}提醒`
  try {
    const mode = await addRemindersToCalendar(toCalendarItems(reminders, remindBeforeMinutes), {
      title,
      filename: 'travel-reminders.ics',
      onWechatIOS: () => {
        ElMessage.warning('iPhone 微信内打开可能无法添加日历，请点击右上角用 Safari 打开')
      },
      onFallbackDownload: () => {
        ElMessage.success('日历文件已生成，请打开文件并添加到系统日历')
      },
    })
    return { ok: true, mode }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      return { ok: false, reason: 'cancelled' }
    }
    return {
      ok: false,
      reason: 'error',
      message: '添加日历失败，请复制提醒文本后手动添加',
    }
  }
}

export async function copyDayReminderText(day: DetailedDailyPlan, remindBeforeMinutes = 15) {
  const reminders = buildRemindersFromDay(day, remindBeforeMinutes)
  return copyReminderText(toCalendarItems(reminders, remindBeforeMinutes))
}

export async function copyAllReminderText(guide: DetailedTravelGuide, remindBeforeMinutes = 15) {
  const reminders = collectAllReminders(guide, remindBeforeMinutes)
  return copyReminderText(toCalendarItems(reminders, remindBeforeMinutes))
}
