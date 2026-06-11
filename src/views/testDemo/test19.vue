<template>
    <div class="page-wrap">
      <el-card class="card">
        <template #header>
          <div class="card-header">
            <div class="title">GLOF 字段去重提取</div>
            <div class="actions">
              <el-button type="primary" :disabled="!result" @click="downloadResult">下载结果 JSON</el-button>
              <el-button :disabled="!raw.length" @click="resetAll">清空</el-button>
            </div>
          </div>
        </template>
  
        <div class="uploader">
          <div class="left">
            <el-upload
              drag
              :show-file-list="false"
              accept=".json,application/json"
              :auto-upload="false"
              :on-change="handleUploadChange"
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                将 <b>JSON</b> 文件拖拽到此处，或 <em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">要求：数组结构，每个湖泊对象内含 data[] 事件列表</div>
              </template>
            </el-upload>
  
            <div class="or">或</div>
  
            <el-input
              v-model="jsonText"
              type="textarea"
              :rows="8"
              placeholder="也可粘贴 JSON 文本到此处，然后点击下方『解析』"
            />
            <div class="btn-row">
              <el-button type="primary" @click="parseJsonText" :disabled="!jsonText.trim()">解析粘贴的 JSON</el-button>
            </div>
          </div>
  
          <div class="right">
            <el-descriptions title="文件信息" :column="1" size="small" v-if="fileInfo">
              <el-descriptions-item label="文件名">{{ fileInfo.name }}</el-descriptions-item>
              <el-descriptions-item label="大小">{{ formatSize(fileInfo.size) }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag type="success" v-if="raw.length">已载入</el-tag>
                <el-tag v-else type="info">未载入</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="湖泊条目数">
                <el-tag v-if="raw.length">{{ raw.length }}</el-tag>
                <span v-else>—</span>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </el-card>
  
      <el-card class="card" v-loading="loading" element-loading-text="解析中…">
        <template #header>
          <div class="card-header">
            <div class="title">去重结果</div>
            <div class="sub">Country / Province / River_Basin / Driver_lake / Driver_GLOF / 年月日 / Year_approx</div>
          </div>
        </template>
  
        <div v-if="result" class="result-grid">
          <div class="group">
            <div class="group-title">顶层字段</div>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="Country">
                <TagList :items="result.Country" />
              </el-descriptions-item>
              <el-descriptions-item label="Province">
                <TagList :items="result.Province" />
              </el-descriptions-item>
              <el-descriptions-item label="River_Basin">
                <TagList :items="result.River_Basin" />
              </el-descriptions-item>
              <el-descriptions-item label="Driver_lake">
                <TagList :items="result.Driver_lake" />
              </el-descriptions-item>
            </el-descriptions>
          </div>
  
          <div class="group">
            <div class="group-title">事件层（data[]）</div>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="Driver_GLOF">
                <TagList :items="result.Driver_GLOF" />
              </el-descriptions-item>
              <el-descriptions-item label="Year_exact">
                <TagList :items="(result.Year_exact || []).map(String)" />
              </el-descriptions-item>
              <el-descriptions-item label="Month">
                <TagList :items="(result.Month || []).map(String)" />
              </el-descriptions-item>
              <el-descriptions-item label="Day">
                <TagList :items="(result.Day || []).map(String)" />
              </el-descriptions-item>
              <el-descriptions-item label="Year_approx">
                <TagList :items="result.Year_approx" />
              </el-descriptions-item>
            </el-descriptions>
          </div>
  
          <div class="group" v-if="result._date_unparsed_samples?.length">
            <div class="group-title">
              未解析的 Date 样例
              <el-tag size="small" type="warning" class="ml-8">{{ result._date_unparsed_samples.length }}</el-tag>
            </div>
            <el-alert
              type="warning"
              :closable="false"
              description="这些样例未被当前解析器识别；如果需要我可以按样例扩展规则，让它们也能被拆解。"
              class="mb-12"
            />
            <el-table :data="result._date_unparsed_samples.map(s => ({ sample: s }))" size="small" border>
              <el-table-column prop="sample" label="Date 样例" />
            </el-table>
          </div>
        </div>
  
        <el-empty v-else description="请先上传或粘贴 JSON，然后等待解析结果" />
      </el-card>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, h, defineComponent } from 'vue'
  import { ElMessage, ElTag } from 'element-plus'
  import { UploadFilled } from '@element-plus/icons-vue'
  
  type LakeEvent = { Date?: string | null; Driver_GLOF?: string | null }
  type LakeRecord = { Country?: string; Province?: string; River_Basin?: string; Driver_lake?: string; data?: LakeEvent[] }
  
  type SummaryResult = {
    Country: string[]; Province: string[]; River_Basin: string[]; Driver_lake: string[];
    Driver_GLOF: string[]; Year_exact: number[]; Month: number[]; Day: number[];
    Year_approx: string[]; _date_unparsed_samples: string[];
  }
  
  const raw = ref<LakeRecord[]>([])
  const result = ref<SummaryResult | null>(null)
  const loading = ref(false)
  const jsonText = ref('')
  const fileInfo = ref<{ name: string; size: number } | null>(null)
  
  function handleUploadChange(file: any) {
    const f: File = file.raw || file
    if (!f) return
    fileInfo.value = { name: f.name, size: f.size }
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || '[]'))
        handleParsedArray(data)
      } catch (e: any) {
        ElMessage.error('JSON 解析失败：' + (e?.message || '未知错误'))
      }
    }
    reader.readAsText(f, 'utf-8')
  }
  
  function parseJsonText() {
    try {
      const data = JSON.parse(jsonText.value)
      fileInfo.value = { name: 'pasted.json', size: new Blob([jsonText.value]).size }
      handleParsedArray(data)
    } catch (e: any) {
      ElMessage.error('JSON 解析失败：' + (e?.message || '未知错误'))
    }
  }
  
  function handleParsedArray(data: unknown) {
    if (!Array.isArray(data)) {
      ElMessage.error('JSON 顶层必须是数组')
      return
    }
    loading.value = true
    requestAnimationFrame(() => {
      try {
        raw.value = data as LakeRecord[]
        result.value = summarize(raw.value)
        ElMessage.success('解析完成')
      } catch (e: any) {
        ElMessage.error('解析出错：' + (e?.message || '未知错误'))
        result.value = null
      } finally {
        loading.value = false
      }
    })
  }
  
  function resetAll() {
    raw.value = []
    result.value = null
    jsonText.value = ''
    fileInfo.value = null
  }
  
  function formatSize(size: number) {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / 1024 / 1024).toFixed(1)} MB`
  }
  
  function downloadResult() {
    if (!result.value) return
    const blob = new Blob([JSON.stringify(result.value, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'unique_fields_summary.json'
    a.click()
    URL.revokeObjectURL(url)
  }
  
  /** Date 解析器 */
  function parseDate(s?: string | null) {
    if (!s) return { y: null, m: null, d: null, ya: 'unknown' }
    const str = String(s).trim()
  
    let m = str.match(/^(\d{4})[-/\.](\d{1,2})[-/\.](\d{1,2})$/)
    if (m) return { y: +m[1], m: +m[2], d: +m[3], ya: null }
  
    m = str.match(/^(\d{4})[-/\.](\d{1,2})$/)
    if (m) return { y: +m[1], m: +m[2], d: null, ya: null }
  
    m = str.match(/^(\d{4})$/)
    if (m) return { y: +m[1], m: null, d: null, ya: null }
  
    m = str.match(/^(?:c\.|ca\.|circa)\s*(\d{4})$/i)
    if (m) return { y: null, m: null, d: null, ya: `circa ${+m[1]}` }
  
    m = str.match(/^(\d{4})s$/)
    if (m) return { y: null, m: null, d: null, ya: `${+m[1]}s decade` }
  
    m = str.match(/^(\d{4})\s*[–-]\s*(\d{4})$/)
    if (m) return { y: null, m: null, d: null, ya: `range ${m[1]}-${m[2]}` }
  
    m = str.match(/^(?:before|<|<=)\s*(\d{4})$/i)
    if (m) return { y: null, m: null, d: null, ya: `before ${+m[1]}` }
  
    m = str.match(/^(?:after|>|>=)\s*(\d{4})$/i)
    if (m) return { y: null, m: null, d: null, ya: `after ${+m[1]}` }
  
    m = str.match(/^(\d{4})\s+([A-Za-z]+)(?:\s+(\d{1,2}))?$/)
    if (m) {
      const y = +m[1], day = m[3] ? +m[3] : null
      const monMap: Record<string, number> = {
        jan:1,january:1,feb:2,february:2,mar:3,march:3,apr:4,april:4,
        may:5,jun:6,june:6,jul:7,july:7,aug:8,august:8,sep:9,sept:9,september:9,
        oct:10,october:10,nov:11,november:11,dec:12,december:12
      }
      const mo = monMap[m[2].toLowerCase()]
      if (mo) return { y, m: mo, d: day, ya: null }
    }
  
    return { y: null, m: null, d: null, ya: `unparsed:${str}` }
  }
  
  function summarize(arr: LakeRecord[]): SummaryResult {
    const sCountry = new Set<string>(), sProvince = new Set<string>(), sBasin = new Set<string>()
    const sDriverLake = new Set<string>(), sDriverGlof = new Set<string>()
    const sY = new Set<number>(), sM = new Set<number>(), sD = new Set<number>(), sYA = new Set<string>()
    const unparsed: string[] = []
  
    for (const lake of arr) {
      if (lake.Country) sCountry.add(lake.Country)
      if (lake.Province) sProvince.add(lake.Province)
      if (lake.River_Basin) sBasin.add(lake.River_Basin)
      if (lake.Driver_lake) sDriverLake.add(lake.Driver_lake)
  
      for (const ev of lake.data || []) {
        if (ev.Driver_GLOF) sDriverGlof.add(ev.Driver_GLOF)
        const { y, m, d, ya } = parseDate(ev.Date)
        if (y !== null) sY.add(y)
        if (m !== null) sM.add(m)
        if (d !== null) sD.add(d)
        if (ya) {
          if (ya.startsWith('unparsed:')) unparsed.push(ya.replace(/^unparsed:/, ''))
          else sYA.add(ya)
        }
      }
    }
  
    const sort = <T extends string|number>(s: Set<T>) =>
      Array.from(s).sort((a,b)=> (typeof a==='number' && typeof b==='number') ? a-b : String(a).localeCompare(String(b)))
  
    return {
      Country: sort(sCountry), Province: sort(sProvince), River_Basin: sort(sBasin), Driver_lake: sort(sDriverLake),
      Driver_GLOF: sort(sDriverGlof), Year_exact: sort(sY) as number[], Month: sort(sM) as number[], Day: sort(sD) as number[],
      Year_approx: sort(sYA), _date_unparsed_samples: unparsed.slice(0,200)
    }
  }
  
  /** ✅ 小 TagList 子组件（无 JSX，使用 render 函数） */
  const TagList = defineComponent({
    name: 'TagList',
    props: { items: { type: Array as () => string[], required: true } },
    setup(props) {
      return () =>
        h('div', { class: 'tag-list' },
          (props.items?.length
            ? props.items.map((t, i) => h(ElTag, { key: i, class: 'mr-6 mb-6', size: 'small' }, () => t || '—'))
            : [h('span', null, '—')])
        )
    }
  })
  </script>
  
  <style scoped>
  .page-wrap { display: grid; gap: 16px; padding: 12px; }
  .card-header { display: flex; align-items: center; justify-content: space-between; }
  .title { font-weight: 600; }
  .sub { color: var(--el-text-color-secondary); font-size: 12px; }
  .card { border-radius: 14px; }
  .uploader { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 16px; }
  .left,.right { display:flex; flex-direction:column; gap:12px; }
  .or { text-align:center; font-size:12px; color:var(--el-text-color-secondary); }
  .btn-row { display:flex; gap:8px; }
  .result-grid { display:grid; gap:16px; }
  .group-title { font-weight:600; margin-bottom:8px; }
  .mb-12 { margin-bottom:12px; }
  .ml-8 { margin-left:8px; }
  .tag-list { display:flex; flex-wrap:wrap; }
  .mr-6 { margin-right:6px; }
  .mb-6 { margin-bottom:6px; }
  </style>