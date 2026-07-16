import type { AnalysisResult, AgriRecord, CropProfile, TodayTask } from '@/types/agri'

export const mockAnalysisResult: AnalysisResult = {
  status: 'attention',
  statusText: '需要注意',
  summary: [
    '叶子可能受潮后出现病害。',
    '目前还不能完全确定。',
  ],
  todayActions: [
    '先不要浇大水',
    '检查叶片背面',
    '拍一张近距离照片',
  ],
  nextCheck: '明天傍晚再检查一次',
  riskWarning: '如果大面积扩散，请联系当地农技人员。',
  needMorePhotos: true,
  photoTips: ['拍叶片正面', '拍叶片背面'],
}

export const mockTodayTasks: TodayTask[] = [
  { id: 't1', title: '上午检查甜瓜叶子', done: false, remindLater: false },
  { id: 't2', title: '今天先不要浇大水', done: false, remindLater: false },
  { id: 't3', title: '傍晚再拍一张照片', done: false, remindLater: false },
]

export const mockRecords: AgriRecord[] = [
  {
    id: 'r1',
    date: '2026-07-13',
    cropName: '甜瓜',
    title: '叶子发黄、边缘发干',
    status: 'attention',
    statusText: '需要注意',
    thumbUrl: '',
    description: '甜瓜叶子发黄，前两天下过雨。',
    result: mockAnalysisResult,
  },
  {
    id: 'r2',
    date: '2026-07-10',
    cropName: '甜瓜',
    title: '整体长势正常',
    status: 'normal',
    statusText: '正常',
    thumbUrl: '',
  },
]

export const defaultCropProfile: CropProfile = {
  id: 'crop_001',
  name: '',
  plantDate: '',
  growType: '',
  area: '',
  region: '',
  updatedAt: '',
}
