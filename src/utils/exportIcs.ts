import { buildIcsContent, type CalendarReminderItem } from '@/utils/calendarReminder'

export type IcsReminder = CalendarReminderItem

/** @deprecated 请使用 addRemindersToCalendar */
export const exportIcs = (reminders: IcsReminder[], filename = 'travel-reminders.ics') => {
  const icsContent = buildIcsContent(reminders, '旅游行程提醒')
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
