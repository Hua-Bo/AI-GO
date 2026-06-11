<template>
    <div class="page">
      <div class="header">
        <div class="title">JSON 字段值统计</div>
        <div class="desc">拖拽/选择 .json 文件后立即解析（不需要点上传）。</div>
      </div>
  
      <el-card class="card" shadow="never">
        <el-upload
          drag
          action="#"
          accept=".json,application/json"
          :limit="1"
          :show-file-list="true"
          :auto-upload="true"
          :on-change="handleFileChange"
          :on-exceed="handleExceed"
          :http-request="dummyRequest"
          class="uploader"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            拖拽 JSON 文件到这里，或 <em>点击选择</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持：数组 / 单对象 / { data|rows|list|items|features: [] } / GeoJSON FeatureCollection
            </div>
          </template>
        </el-upload>
  
        <div class="actions">
          <el-switch v-model="treatNumericStringAsNumber" active-text="把数字字符串当数值统计" />
          <el-switch v-model="geoJsonUseProperties" active-text="GeoJSON 用 properties 统计" />
          <el-button type="danger" plain :disabled="!rows.length && !rawText" @click="resetAll">清空</el-button>
        </div>
  
        <el-alert v-if="errorMsg" type="error" :title="errorMsg" show-icon class="mt12" />
        <el-alert
          v-else-if="fileName"
          type="success"
          :title="`已解析：${fileName}（${rows.length} 条记录）`"
          show-icon
          class="mt12"
        />
  
        <div v-if="rows.length" class="mt16 toolbar">
          <el-input v-model="keyword" clearable placeholder="搜索字段名" style="max-width: 320px" />
          <el-select v-model="typeFilter" clearable placeholder="按类型筛选" style="width: 160px">
            <el-option label="number" value="number" />
            <el-option label="string" value="string" />
            <el-option label="boolean" value="boolean" />
            <el-option label="object" value="object" />
            <el-option label="mixed" value="mixed" />
            <el-option label="null" value="null" />
            <el-option label="unknown" value="unknown" />
          </el-select>
          <el-switch v-model="onlyCategorical" active-text="仅看非数值字段" />
          <div class="spacer" />
          <el-tag type="info">字段数：{{ stats.length }}</el-tag>
        </div>
  
        <div v-if="rows.length" class="mt12">
          <el-table
            :data="filtered"
            border
            stripe
            size="small"
            style="width: 100%"
            :default-sort="{ prop: 'uniqueCount', order: 'descending' }"
          >
            <el-table-column prop="field" label="字段" min-width="160" />
            <el-table-column prop="type" label="类型" width="110" />
            <el-table-column prop="count" label="总数" width="80" />
            <el-table-column prop="missing" label="缺失" width="80" />
            <el-table-column prop="uniqueCount" label="去重数" width="90" />
  
            <el-table-column label="数值统计" min-width="260">
              <template #default="{ row }">
                <span v-if="row.type === 'number' && row.numCount > 0">
                  min={{ row.min }}，max={{ row.max }}，avg={{ row.avg }}（n={{ row.numCount }}）
                </span>
                <span v-else>—</span>
              </template>
            </el-table-column>
  
            <el-table-column label="去重值（截断显示）" min-width="420">
              <template #default="{ row }">
                <div class="values">
                  <el-tag v-for="(v, idx) in row.uniqueValuesPreview" :key="idx" size="small" class="tag">
                    {{ v }}
                  </el-tag>
                  <span v-if="row.uniqueValuesOverflow" class="more">
                    +{{ row.uniqueCount - row.uniqueValuesPreview.length }}
                  </span>
                </div>
              </template>
            </el-table-column>
  
            <el-table-column label="示例" min-width="260">
              <template #default="{ row }">
                <span class="muted">{{ row.sample }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed, ref } from 'vue'
  import { UploadFilled } from '@element-plus/icons-vue'
  import type { UploadFile, UploadFiles, UploadRequestOptions } from 'element-plus'
  
  type AnyRecord = Record<string, any>
  type FieldType = 'number' | 'string' | 'boolean' | 'null' | 'object' | 'mixed' | 'unknown'
  
  type FieldStat = {
    field: string
    type: FieldType
    count: number
    missing: number
    uniqueCount: number
    uniqueValuesPreview: string[]
    uniqueValuesOverflow: boolean
    sample: string
    numCount: number
    min?: number
    max?: number
    avg?: number
  }
  
  const rows = ref<AnyRecord[]>([])
  const rawText = ref('')
  const fileName = ref('')
  const errorMsg = ref('')
  
  const keyword = ref('')
  const onlyCategorical = ref(false)
  const typeFilter = ref<FieldType | ''>('')
  
  const treatNumericStringAsNumber = ref(true)
  const geoJsonUseProperties = ref(true)
  
  const previewLimit = 20
  
  function resetAll() {
    rows.value = []
    rawText.value = ''
    fileName.value = ''
    errorMsg.value = ''
    keyword.value = ''
    onlyCategorical.value = false
    typeFilter.value = ''
  }
  
  /** 拦截 el-upload 的真实上传行为 */
  function dummyRequest(options: UploadRequestOptions) {
    // 这里必须“立即成功”，否则 el-upload 会一直 loading
    options.onSuccess?.({}, options.file)
  }
  
  function handleExceed() {
    errorMsg.value = '一次只允许上传 1 个文件，请先清空再上传'
  }
  
  function isPlainObject(v: any): v is Record<string, any> {
    return v !== null && typeof v === 'object' && !Array.isArray(v)
  }
  
  function isMissing(v: any) {
    return v === null || v === undefined || (typeof v === 'string' && v.trim() === '')
  }
  
  function looksNumericString(v: any) {
    if (typeof v !== 'string') return false
    const s = v.trim()
    if (!s) return false
    return /^[-+]?(\d+(\.\d+)?|\.\d+)(e[-+]?\d+)?$/i.test(s)
  }
  
  function asNumberMaybe(v: any): number | null {
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (treatNumericStringAsNumber.value && looksNumericString(v)) {
      const n = Number(String(v).trim())
      return Number.isFinite(n) ? n : null
    }
    return null
  }
  
  function detectType(values: any[]): FieldType {
    const present = values.filter(v => !isMissing(v))
    if (present.length === 0) return 'null'
  
    const types = new Set<string>()
    for (const v of present) {
      const n = asNumberMaybe(v)
      if (n !== null) types.add('number')
      else if (typeof v === 'string') types.add('string')
      else if (typeof v === 'boolean') types.add('boolean')
      else if (v && typeof v === 'object') types.add('object')
      else types.add('unknown')
    }
    return types.size === 1 ? (Array.from(types)[0] as FieldType) : 'mixed'
  }
  
  function toPreviewString(v: any): string {
    if (isMissing(v)) return '(missing)'
    const n = asNumberMaybe(v)
    if (n !== null) return String(n)
    if (typeof v === 'string') return v
    if (typeof v === 'boolean') return v ? 'true' : 'false'
    try {
      return JSON.stringify(v)
    } catch {
      return String(v)
    }
  }
  
  function pickArrayContainer(obj: Record<string, any>): any[] | null {
    const candidates = ['data', 'rows', 'list', 'items', 'features', 'result', 'records']
    for (const k of candidates) if (Array.isArray(obj[k])) return obj[k]
    if (obj.type === 'FeatureCollection' && Array.isArray(obj.features)) return obj.features
    return null
  }
  
  function normalizeToRows(parsed: any): AnyRecord[] {
    if (Array.isArray(parsed)) return parsed.filter(isPlainObject) as AnyRecord[]
  
    if (isPlainObject(parsed)) {
      const inner = pickArrayContainer(parsed)
      if (inner) {
        // GeoJSON：可选用 properties
        if (geoJsonUseProperties.value && parsed.type === 'FeatureCollection') {
          return inner
            .map((f: any) => (isPlainObject(f) ? (f.properties ?? f) : null))
            .filter(isPlainObject) as AnyRecord[]
        }
        return inner.filter(isPlainObject) as AnyRecord[]
      }
      return [parsed]
    }
  
    throw new Error('JSON 顶层必须是数组或对象')
  }
  
  function readText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(new Error('读取文件失败'))
      reader.readAsText(file, 'utf-8')
    })
  }
  
  /** 关键：用 on-change，选中文件立刻解析 */
  async function handleFileChange(uploadFile: UploadFile, _files: UploadFiles) {
    errorMsg.value = ''
    rows.value = []
    rawText.value = ''
    fileName.value = ''
  
    const f = uploadFile.raw
    if (!f) {
      errorMsg.value = '未获取到文件对象（uploadFile.raw 为空）'
      return
    }
  
    try {
      const text = await readText(f)
      rawText.value = text
      const parsed = JSON.parse(text)
      const normalized = normalizeToRows(parsed)
  
      if (!normalized.length) throw new Error('未找到可用的数据对象（数组为空或没有对象项）')
  
      rows.value = normalized
      fileName.value = f.name
    } catch (e: any) {
      errorMsg.value = e?.message || '解析失败'
    }
  }
  
  const allFields = computed(() => {
    const set = new Set<string>()
    for (const r of rows.value) Object.keys(r || {}).forEach(k => set.add(k))
    return Array.from(set)
  })
  
  const stats = computed<FieldStat[]>(() => {
    const rs = rows.value || []
    const fields = allFields.value
  
    return fields
      .map((field) => {
        const colValues = rs.map(r => (r ? r[field] : undefined))
        const count = colValues.length
        const missing = colValues.filter(isMissing).length
        const type = detectType(colValues)
  
        const uniqSet = new Set<string>()
        for (const v of colValues) {
          if (isMissing(v)) continue
          uniqSet.add(toPreviewString(v))
        }
        const uniqueValuesAll = Array.from(uniqSet)
        const uniqueValuesPreview = uniqueValuesAll.slice(0, previewLimit)
        const uniqueValuesOverflow = uniqueValuesAll.length > uniqueValuesPreview.length
  
        let min: number | undefined
        let max: number | undefined
        let avg: number | undefined
        let numCount = 0
  
        if (type === 'number') {
          const nums = colValues.map(asNumberMaybe).filter((v): v is number => v !== null)
          numCount = nums.length
          if (nums.length) {
            min = Math.min(...nums)
            max = Math.max(...nums)
            avg = Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(6))
          }
        }
  
        const sample = (() => {
          const first = colValues.find(v => !isMissing(v))
          return first === undefined ? '(none)' : toPreviewString(first)
        })()
  
        return {
          field,
          type,
          count,
          missing,
          uniqueCount: uniqSet.size,
          uniqueValuesPreview,
          uniqueValuesOverflow,
          sample,
          numCount,
          min,
          max,
          avg,
        }
      })
      .sort((a, b) => b.uniqueCount - a.uniqueCount)
  })
  
  const filtered = computed(() => {
    const kw = keyword.value.trim().toLowerCase()
    let arr = stats.value
    if (kw) arr = arr.filter(s => s.field.toLowerCase().includes(kw))
    if (typeFilter.value) arr = arr.filter(s => s.type === typeFilter.value)
    if (onlyCategorical.value) arr = arr.filter(s => s.type !== 'number')
    return arr
  })
  </script>
  
  <style scoped>
  .page { padding: 16px; }
  .header { margin-bottom: 12px; }
  .title { font-size: 18px; font-weight: 600; }
  .desc { margin-top: 6px; color: #606266; font-size: 13px; }
  .card { border-radius: 10px; }
  .uploader { width: 100%; }
  .actions {
    margin-top: 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }
  .mt12 { margin-top: 12px; }
  .mt16 { margin-top: 16px; }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }
  .spacer { flex: 1; }
  .values { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .tag { max-width: 260px; }
  .more { color: #909399; font-size: 12px; }
  .muted { color: #909399; }
  </style>