import { ElMessage } from 'element-plus'
import type { AiReport } from '@/types/aiTypes'

export async function exportReportToWord(report: AiReport): Promise<void> {
  // 预留：后续对接后端 docx 生成服务
  console.info('[exportReportToWord]', report.title)
  ElMessage.info('Word 导出：后续可对接后端文档生成服务')
}

export async function exportReportToPdf(report: AiReport): Promise<void> {
  // 预留：后续对接后端 PDF 生成服务
  console.info('[exportReportToPdf]', report.title)
  ElMessage.info('PDF 导出：后续可对接后端 PDF 生成服务')
}

export async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}
