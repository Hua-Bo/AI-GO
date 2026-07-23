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

async function waitForImages(container: HTMLElement, timeoutMs = 4000) {
  const imgs = Array.from(container.querySelectorAll('img'))
  await Promise.race([
    Promise.all(imgs.map((img) => {
      if (img.complete) return Promise.resolve()
      return new Promise<void>((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true })
        img.addEventListener('error', () => resolve(), { once: true })
      })
    })),
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ])
}

function isBlankCanvas(canvas: HTMLCanvasElement): boolean {
  try {
    const ctx = canvas.getContext('2d')
    if (!ctx) return true
    const sampleH = Math.min(48, canvas.height)
    if (sampleH <= 0 || canvas.width <= 0) return true
    const data = ctx.getImageData(0, 0, canvas.width, sampleH).data
    let nonWhite = 0
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]
      if (a > 8 && (r < 250 || g < 250 || b < 250)) nonWhite += 1
      if (nonWhite > 20) return false
    }
    return true
  } catch {
    return false
  }
}

const MAX_CANVAS_EDGE = 14000

async function captureElement(
  el: HTMLElement,
  options?: { skipExternalImages?: boolean; scale?: number },
): Promise<HTMLCanvasElement> {
  await nextTick()
  await waitForImages(el)
  const restoreExternal = options?.skipExternalImages ? hideExternalImages(el) : null
  const restoreBroken = prepareBrokenImages(el)
  try {
    const height = el.scrollHeight || el.clientHeight
    const scale = options?.scale
      ?? (height > 9000 ? 1 : height > 5000 ? 1.25 : 2)
    const html2canvas = (await import('html2canvas')).default
    return await html2canvas(el, {
      backgroundColor: '#ffffff',
      scale,
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

async function captureGuideCanvas(options?: { skipExternalImages?: boolean }) {
  const el = document.getElementById('travel-route-report')
  if (!el) throw new Error('请先生成攻略')
  return captureElement(el, options)
}

/** 按区块分段截屏，避免长行程单 canvas 超限导致 PDF 后半白页 */
async function captureGuideSections(options?: { skipExternalImages?: boolean }): Promise<HTMLCanvasElement[]> {
  const root = document.getElementById('travel-route-report')
  if (!root) throw new Error('请先生成攻略')

  const sections = Array.from(root.querySelectorAll<HTMLElement>('.guide-section'))
  const targets = sections.length ? sections : [root]
  const canvases: HTMLCanvasElement[] = []

  for (const section of targets) {
    // 跳过打印隐藏区
    if (section.classList.contains('no-print')) continue
    const h = section.scrollHeight
    if (h < 8) continue

    // 超高区块再按子块切
    const children = h > MAX_CANVAS_EDGE / 2
      ? Array.from(section.children).filter((n): n is HTMLElement => n instanceof HTMLElement)
      : [section]

    for (const piece of children.length ? children : [section]) {
      if ((piece.scrollHeight || 0) < 8) continue
      try {
        const canvas = await captureElement(piece, {
          ...options,
          scale: piece.scrollHeight > 6000 ? 1 : undefined,
        })
        if (!isBlankCanvas(canvas)) canvases.push(canvas)
      } catch {
        // 单块失败不中断
      }
    }
  }

  if (!canvases.length) {
    const fallback = await captureGuideCanvas(options)
    return [fallback]
  }
  return canvases
}

function appendCanvasToPdf(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdf: any,
  canvas: HTMLCanvasElement,
  startPageIndex: number,
): number {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 8
  const usableWidth = pageWidth - margin * 2
  const usableHeight = pageHeight - margin * 2

  const imgWidth = usableWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  const pageCanvasHeight = Math.max(1, Math.floor((usableHeight / imgHeight) * canvas.height))

  let renderedHeight = 0
  let pageIndex = startPageIndex
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
    if (isBlankCanvas(pageCanvas)) {
      renderedHeight += sliceHeight
      continue
    }
    const pageData = pageCanvas.toDataURL('image/jpeg', 0.9)
    const sliceImgHeight = (sliceHeight * imgWidth) / canvas.width
    if (pageIndex > 0) pdf.addPage()
    pdf.addImage(pageData, 'JPEG', margin, margin, imgWidth, sliceImgHeight)
    renderedHeight += sliceHeight
    pageIndex += 1
  }
  return pageIndex
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

    ElMessage.info('正在生成 PDF，长行程将分段导出，请稍候…')
    let canvases: HTMLCanvasElement[]
    try {
      canvases = await captureGuideSections({ skipExternalImages: false })
    } catch {
      canvases = await captureGuideSections({ skipExternalImages: true })
    }

    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    })

    let pageIndex = 0
    for (const canvas of canvases) {
      pageIndex = appendCanvasToPdf(pdf, canvas, pageIndex)
    }
    if (pageIndex === 0) {
      ElMessage.error('PDF 内容为空，请改用「打印攻略」另存为 PDF')
      return
    }

    const title = guide?.title || document.querySelector('#travel-route-report h1')?.textContent || '旅游攻略'
    pdf.save(`${safeFileName(String(title))}.pdf`)
    ElMessage.success(`PDF 已下载（共 ${pageIndex} 页）`)
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
