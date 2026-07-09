import type { CalendarReminderItem } from '@/utils/buildAppleIcs'

export interface CreateCalendarRequest {
  title: string
  timezone: string
  reminders: CalendarReminderItem[]
}

export interface CreateCalendarResponse {
  code: number
  message: string
  data: {
    url: string
    filename: string
    timezone?: string
  } | null
}

export async function createTravelCalendar(data: CreateCalendarRequest): Promise<CreateCalendarResponse['data']> {
  const res = await fetch('/api/travel/calendar/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  const json = await res.json() as CreateCalendarResponse
  if (!res.ok || json.code !== 0 || !json.data?.url) {
    throw new Error(json.message || '生成日历提醒失败')
  }
  return json.data
}
