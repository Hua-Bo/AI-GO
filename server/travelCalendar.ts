import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Request, Response } from 'express'
import { buildAppleCompatibleIcs, type CalendarReminderItem } from '../src/utils/buildAppleIcs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const CALENDAR_CACHE_DIR = path.resolve(__dirname, 'calendar-cache')

const FILENAME_RE = /^travel-reminders-\d+\.ics$/

export async function createTravelCalendarHandler(req: Request, res: Response) {
  try {
    const { title, reminders, timezone } = req.body as {
      title?: string
      timezone?: string
      reminders?: CalendarReminderItem[]
    }

    if (!Array.isArray(reminders) || reminders.length === 0) {
      res.status(400).json({ code: 400, message: 'reminders is empty', data: null })
      return
    }

    for (const item of reminders) {
      if (!item.title || !item.date || !item.startTime) {
        res.status(400).json({ code: 400, message: '提醒数据不完整', data: null })
        return
      }
    }

    const calendarTitle = title || '旅游行程提醒'
    const ics = buildAppleCompatibleIcs(reminders, calendarTitle)
    await fs.mkdir(CALENDAR_CACHE_DIR, { recursive: true })

    const filename = `travel-reminders-${Date.now()}.ics`
    await fs.writeFile(path.join(CALENDAR_CACHE_DIR, filename), ics, 'utf8')

    const url = `/api/travel/calendar/file/${filename}`
    res.json({
      code: 0,
      message: 'success',
      data: { url, filename, timezone: timezone || 'Asia/Shanghai' },
    })
  } catch (e) {
    res.status(500).json({
      code: 500,
      message: e instanceof Error ? e.message : '生成日历失败',
      data: null,
    })
  }
}

export function serveTravelCalendarFile(req: Request, res: Response) {
  const filename = path.basename(req.params.filename || '')
  if (!FILENAME_RE.test(filename)) {
    res.status(400).end('invalid filename')
    return
  }

  const filePath = path.join(CALENDAR_CACHE_DIR, filename)
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8; method=PUBLISH')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.setHeader('Cache-Control', 'no-cache')
  res.sendFile(filePath, (err) => {
    if (err) res.status(404).end('file not found')
  })
}
