import { nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { buildDetailedGuideBodyHtml } from '@/services/travelGuideHtml'
import type { DetailedTravelGuide, TravelGuide } from '@/types/travelTypes'

export function safeFileName(name: string): string {
  return (name || '旅游攻略')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80)
}

export function isPdfDownloadAvailable(): boolean {
  return false
}

export function downloadBlob(blob: Blob, fileName: string) {
  if (!blob || blob.size === 0) {
    throw new Error('文件内容为空')
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function buildWordDocument(guide: DetailedTravelGuide, bodyHtml: string): string {
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:w="urn:schemas-microsoft-com:office:word"
        xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${guide.title || '旅游攻略'}</title>
  <style>
    body { font-family: "Microsoft YaHei", Arial, sans-serif; color: #111827; line-height: 1.7; }
    h1, h2, h3 { color: #0f172a; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    th, td { border: 1px solid #d1d5db; padding: 8px; vertical-align: top; }
    th { background: #f3f4f6; }
    img { max-width: 560px; height: auto; border-radius: 8px; }
    .placeholder { border: 1px dashed #cbd5e1; background: #f8fafc; color: #64748b; padding: 24px; text-align: center; border-radius: 8px; }
  </style>
</head>
<body>${bodyHtml}</body>
</html>`
}

export async function exportGuideToWord(guide: DetailedTravelGuide): Promise<void> {
  try {
    if (!guide) {
      ElMessage.warning('请先生成攻略')
      return
    }
    const html = buildDetailedGuideBodyHtml(guide)
    const wordHtml = buildWordDocument(guide, html)
    const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword;charset=utf-8' })
    if (blob.size < 50) {
      ElMessage.error('Word 导出失败：文件内容为空')
      return
    }
    downloadBlob(blob, `${safeFileName(guide.title)}.doc`)
    ElMessage.success('Word 文件已导出')
  } catch (error) {
    console.error(error)
    ElMessage.error('Word 导出失败')
  }
}

export function printGuide(): void {
  const el = document.getElementById('travel-route-report')
  if (!el) {
    ElMessage.warning('请先生成攻略')
    return
  }
  window.print()
}

export async function downloadGuidePdf(): Promise<void> {
  if (!isPdfDownloadAvailable()) {
    ElMessage.warning('当前未安装 PDF 导出依赖，请使用「打印攻略」选择另存为 PDF，或接入后端 PDF 服务。')
    return
  }
}

/** @deprecated use printGuide */
export function exportGuideToPdf(): void {
  printGuide()
}

function hideExternalImages(container: HTMLElement): () => void {
  const backups: Array<{ img: HTMLImageElement; display: string }> = []
  container.querySelectorAll('img').forEach((img) => {
    if (img.src && !img.src.startsWith(window.location.origin) && !img.src.startsWith('data:')) {
      backups.push({ img, display: img.style.display })
      img.style.display = 'none'
    }
  })
  return () => {
    backups.forEach(({ img, display }) => { img.style.display = display })
  }
}

function prepareBrokenImages(container: HTMLElement): () => void {
  const backups: Array<{ img: HTMLImageElement; display: string }> = []
  container.querySelectorAll('img').forEach((img) => {
    if (!img.complete || img.naturalWidth === 0 || img.style.display === 'none') {
      backups.push({ img, display: img.style.display })
      img.style.display = 'none'
    }
  })
  return () => {
    backups.forEach(({ img, display }) => { img.style.display = display })
  }
}

export async function exportGuideToImage(
  guide: DetailedTravelGuide,
  options?: { skipExternalImages?: boolean },
): Promise<void> {
  let restoreExternal: (() => void) | null = null
  let restoreBroken: (() => void) | null = null

  try {
    if (!guide) {
      ElMessage.warning('请先生成攻略')
      return
    }
    const el = document.getElementById('travel-route-report')
    if (!el) {
      ElMessage.warning('请先生成攻略')
      return
    }

    await nextTick()
    if (options?.skipExternalImages) restoreExternal = hideExternalImages(el)
    restoreBroken = prepareBrokenImages(el)

    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(el, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      width: el.scrollWidth,
      height: el.scrollHeight,
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
    })

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/png')
    })

    if (!blob || blob.size === 0) {
      ElMessage.error('长图生成失败')
      return
    }

    downloadBlob(blob, `${safeFileName(guide.title)}.png`)
    ElMessage.success('长图已下载')
  } catch (error) {
    console.error(error)
    ElMessage.error('长图下载失败，可能是外部图片跨域。请尝试「下载长图（无外部图片）」。')
  } finally {
    restoreExternal?.()
    restoreBroken?.()
  }
}

export async function exportLegacyGuideToWord(guide: TravelGuide): Promise<void> {
  const blob = new Blob(
    [`\ufeff<html><body><h1>${guide.title}</h1><p>${guide.summary}</p></body></html>`],
    { type: 'application/msword;charset=utf-8' },
  )
  downloadBlob(blob, `${safeFileName(guide.title)}.doc`)
}

export const exportRoutePlanToWord = exportGuideToWord
export const exportRoutePlanToPdf = printGuide
export const exportRoutePlanToImage = exportGuideToImage
