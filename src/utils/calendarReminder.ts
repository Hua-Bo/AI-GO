import { ElMessage } from 'element-plus'
import { buildAppleCompatibleIcs, type CalendarReminderItem } from '@/utils/buildAppleIcs'

export type { CalendarReminderItem }

/** Apple 兼容 ICS（CRLF、METHOD:PUBLISH、UTC Z、VALARM） */
export const buildIcsContent = buildAppleCompatibleIcs

export const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent)

export const isWechat = () => /MicroMessenger/i.test(navigator.userAgent)

export const canShareFile = (file: File) => {
  return !!navigator.share && !!navigator.canShare && navigator.canShare({ files: [file] })
}

export function getCalendarTip() {
  if (isIOS() && isWechat()) {
    return '检测到你正在 iPhone 微信内打开。请点击右上角，选择「在 Safari 中打开」，再添加到系统日历。'
  }
  if (isIOS()) {
    return '点击后将通过系统分享或日历文件添加提醒。如无法添加，请复制提醒文本。'
  }
  return '点击后将生成日历文件，可导入系统日历；失败时可复制提醒文本。'
}

export function applyReminderMinutes(reminders: CalendarReminderItem[], minutes: number): CalendarReminderItem[] {
  return reminders.map((item) => ({ ...item, remindBeforeMinutes: minutes }))
}

export const buildReminderText = (reminders: CalendarReminderItem[]) => {
  return reminders.map((item) => {
    const time = item.endTime
      ? `${item.date} ${item.startTime}-${item.endTime}`
      : `${item.date} ${item.startTime}`

    return [
      `时间：${time}`,
      `事项：${item.title}`,
      item.location ? `地点：${item.location}` : '',
      item.description ? `说明：${item.description}` : '',
    ].filter(Boolean).join('\n')
  }).join('\n\n')
}

export async function copyReminderText(reminders: CalendarReminderItem[]) {
  if (!reminders.length) {
    ElMessage.warning('暂无可复制的提醒')
    return false
  }

  const text = buildReminderText(reminders)
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    ElMessage.success('提醒文本已复制，可手动添加到日历或备忘录')
    return true
  } catch {
    ElMessage.error('复制失败，请手动选择文本复制')
    return false
  }
}

export type AddRemindersResult = 'shared' | 'downloaded'

/**
 * 纯前端添加日历提醒：
 * - iPhone Safari：优先 navigator.share({ files })
 * - 其他浏览器：Blob 下载 .ics
 * - 微信内：提示 Safari，仍尝试分享/下载
 */
export const addRemindersToCalendar = async (
  reminders: CalendarReminderItem[],
  options?: {
    title?: string
    filename?: string
    onWechatIOS?: () => void
    onFallbackDownload?: () => void
  },
): Promise<AddRemindersResult> => {
  if (!reminders.length) {
    throw new Error('暂无可添加的提醒')
  }

  const title = options?.title || '旅游行程提醒'
  const filename = options?.filename || 'travel-reminders.ics'
  const icsContent = buildIcsContent(reminders, title)

  const file = new File([icsContent], filename, {
    type: 'text/calendar;charset=utf-8',
  })

  if (isIOS() && isWechat()) {
    options?.onWechatIOS?.()
  }

  if (isIOS() && canShareFile(file)) {
    try {
      await navigator.share({
        title,
        text: '添加旅游行程到系统日历',
        files: [file],
      })
      return 'shared'
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error
      }
      console.warn('系统分享失败，降级为下载 ICS', error)
    }
  }

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  options?.onFallbackDownload?.()
  return 'downloaded'
}
