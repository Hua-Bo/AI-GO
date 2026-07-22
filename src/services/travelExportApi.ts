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
  return true
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

async function captureGuideCanvas(options?: { skipExternalImages?: boolean }) {
  const el = document.getElementById('travel-route-report')
  if (!el) throw new Error('请先生成攻略')

  await nextTick()
  const restoreExternal = options?.skipExternalImages ? hideExternalImages(el) : null
  const restoreBroken = prepareBrokenImages(el)

  try {
    const html2canvas = (await import('html2canvas')).default
    return await html2canvas(el, {
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
  } finally {
    restoreExternal?.()
    restoreBroken()
  }
}

/** 将长图画成多页 PDF 并下载 */
export async function downloadGuidePdf(guide?: DetailedTravelGuide): Promise<void> {
  try {
    if (guide === null) {
      ElMessage.warning('请先生成攻略')
      return
    }
    const el = document.getElementById('travel-route-report')
    if (!el) {
      ElMessage.warning('请先生成攻略')
      return
    }

    ElMessage.info('正在生成 PDF，请稍候…')
    let canvas: HTMLCanvasElement
    try {
      canvas = await captureGuideCanvas({ skipExternalImages: false })
    } catch {
      // 外部图片跨域时降级：去掉外部图再导出
      canvas = await captureGuideCanvas({ skipExternalImages: true })
    }

    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 8
    const usableWidth = pageWidth - margin * 2
    const usableHeight = pageHeight - margin * 2

    const imgWidth = usableWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const pageCanvasHeight = Math.floor((usableHeight / imgHeight) * canvas.height)

    let renderedHeight = 0
    let pageIndex = 0
    while (renderedHeight < canvas.height) {
      const sliceHeight = Math.min(pageCanvasHeight, canvas.height - renderedHeight)
      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = canvas.width
      pageCanvas.height = sliceHeight
      const ctx = pageCanvas.getContext('2d')
      if (!ctx) throw new Error('无法创建画布')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
      ctx.drawImage(
        canvas,
        0,
        renderedHeight,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight,
      )

      const pageData = pageCanvas.toDataURL('image/jpeg', 0.92)
      const sliceImgHeight = (sliceHeight * imgWidth) / canvas.width
      if (pageIndex > 0) pdf.addPage()
      pdf.addImage(pageData, 'JPEG', margin, margin, imgWidth, sliceImgHeight)
      renderedHeight += sliceHeight
      pageIndex += 1
    }

    const title = guide?.title || document.querySelector('#travel-route-report h1')?.textContent || '旅游攻略'
    pdf.save(`${safeFileName(String(title))}.pdf`)
    ElMessage.success('PDF 已下载')
  } catch (error) {
    console.error(error)
    ElMessage.error('PDF 导出失败，请改用「打印攻略」另存为 PDF')
  }
}

/** @deprecated use printGuide or downloadGuidePdf */
export function exportGuideToPdf(): void {
  void downloadGuidePdf()
}

export async function exportGuideToImage(
  guide: DetailedTravelGuide,
  options?: { skipExternalImages?: boolean },
): Promise<void> {
  try {
    if (!guide) {
      ElMessage.warning('请先生成攻略')
      return
    }
    const canvas = await captureGuideCanvas(options)
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
