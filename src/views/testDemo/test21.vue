<template>
    <div class="bioox-viz">
      <!-- 顶部工具栏 -->
      <div class="toolbar">
        <div class="title">生物氧化过程：流程图 & 曲线图（示例生成）</div>
  
        <div class="actions">
          <label class="field">
            样本点：
            <input v-model.number="cfg.samples" class="input" type="number" min="50" max="2000" />
          </label>
  
          <label class="field">
            扰动区间：
            <input v-model.number="cfg.disturbStart" class="input" type="number" min="0" :max="cfg.samples - 1" />
            <span class="sep">~</span>
            <input v-model.number="cfg.disturbEnd" class="input" type="number" min="0" :max="cfg.samples - 1" />
          </label>
  
          <button class="btn" @click="regenerate()">生成示例数据</button>
          <button class="btn ghost" @click="toggleHelp()">说明</button>
        </div>
      </div>
  
      <!-- 主体：左流程图 / 右图表 -->
      <div class="grid">
        <!-- 左侧：流程图 -->
        <div class="panel">
          <div class="panel-hd">
            <div class="panel-title">流程图（图1~图4）</div>
            <div class="tabs">
              <button
                v-for="t in flowTabs"
                :key="t.key"
                class="tab"
                :class="{ active: activeFlowKey === t.key }"
                @click="activeFlowKey = t.key"
              >
                {{ t.label }}
              </button>
            </div>
          </div>
  
          <div class="panel-bd flow-wrap">
            <FlowSvg
              v-model:activeNodeId="selectedNodeId"
              :title="currentFlow.title"
              :nodes="currentFlow.nodes"
              :edges="currentFlow.edges"
            />
            <div class="flow-side">
              <div class="side-title">节点说明</div>
              <div v-if="selectedNode" class="side-body">
                <div class="side-node-title">{{ selectedNode.title }}</div>
                <div class="side-node-detail">{{ selectedNode.detail }}</div>
              </div>
              <div v-else class="side-empty">点击左侧流程节点查看说明</div>
  
              <div v-if="helpVisible" class="help">
                <div class="help-title">对应说明书的图示</div>
                <ul class="help-ul">
                  <li>图1：总体流程（采集/平滑 → 算子&模型 → 阈值&状态 → 指令&修正） [oai_citation:4‡一种基于控制模型的生物氧化过程智能优化方法.docx](sediment://file_0000000001187208a5e86fbc0c71a10e)</li>
                  <li>图5/图6：算子曲线 + 阈值组（含 200~260 的局部特征描述） [oai_citation:5‡一种基于控制模型的生物氧化过程智能优化方法.docx](sediment://file_0000000001187208a5e86fbc0c71a10e)  [oai_citation:6‡一种基于控制模型的生物氧化过程智能优化方法.docx](sediment://file_0000000001187208a5e86fbc0c71a10e)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
  
        <!-- 右侧：图表 -->
        <div class="panel">
          <div class="panel-hd">
            <div class="panel-title">折线图（图5、图6）& 柱状图（状态分布）</div>
            <div class="hint">
              折线图：算子时间序列 + 阈值线；柱状图：状态计数（按阈值分区统计）
            </div>
          </div>
  
          <div class="panel-bd charts">
            <div class="chart-card">
              <div class="chart-title">图5：生物氧化耦合偏差算子（示例）</div>
              <div ref="chartBioRef" class="chart"></div>
            </div>
  
            <div class="chart-card">
              <div class="chart-title">图6：液位冒槽风险算子（示例）</div>
              <div ref="chartLvlRef" class="chart"></div>
            </div>
  
            <div class="chart-card">
              <div class="chart-title">柱状图：状态分布统计（示例）</div>
              <div ref="chartBarRef" class="chart"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
  import * as echarts from 'echarts'
  
  /** -----------------------------
   *  说明书结构映射（用于流程图/曲线图）
   *  - 图1~图4：流程
   *  - 图5：耦合偏差算子曲线 + 阈值组
   *  - 图6：液位风险算子曲线 + 阈值组
   * 相关描述见： [oai_citation:7‡一种基于控制模型的生物氧化过程智能优化方法.docx](sediment://file_0000000001187208a5e86fbc0c71a10e)  [oai_citation:8‡一种基于控制模型的生物氧化过程智能优化方法.docx](sediment://file_0000000001187208a5e86fbc0c71a10e)  [oai_citation:9‡一种基于控制模型的生物氧化过程智能优化方法.docx](sediment://file_0000000001187208a5e86fbc0c71a10e)
   * ----------------------------- */
  
  interface FlowNode {
    id: string
    title: string
    detail: string
    x: number
    y: number
    w: number
    h: number
  }
  
  interface FlowEdge {
    from: string
    to: string
    label?: string
  }
  
  interface FlowDef {
    title: string
    nodes: FlowNode[]
    edges: FlowEdge[]
  }
  
  const cfg = reactive({
    samples: 400,
    disturbStart: 200,
    disturbEnd: 260,
    noise: 0.06,
  })
  
  const helpVisible = ref(false)
  const toggleHelp = () => {
    helpVisible.value = !helpVisible.value
  }
  
  /** ============ 流程图定义（图1~图4） ============ */
  const flowTabs = [
    { key: 'fig1', label: '图1 总流程' },
    { key: 'fig2', label: '图2 采集&双层平滑' },
    { key: 'fig3', label: '图3 控制模型形成' },
    { key: 'fig4', label: '图4 状态&指令生成' },
  ] as const
  
  type FlowKey = typeof flowTabs[number]['key']
  const activeFlowKey = ref<FlowKey>('fig1')
  
  const mkNode = (
    id: string,
    title: string,
    detail: string,
    pos: { x: number; y: number }
  ): FlowNode => ({
    id,
    title,
    detail,
    x: pos.x,
    y: pos.y,
    w: 250,
    h: 66,
  })
  
  const flowDefs: Record<FlowKey, FlowDef> = {
    fig1: {
      title: '图1：方法总体流程（S1~S4）',
      nodes: [
        mkNode(
          'S1',
          'S1 采集 + 质量校验 + 双层平滑',
          '采集多源监测数据并进行质量校验、双层平滑，得到平滑监测序列集合。',
          { x: 40, y: 40 }
        ),
        mkNode(
          'S2',
          'S2 构建算子 + 生成响应因子 + 控制模型',
          '基于平滑序列构建“耦合偏差算子/液位风险算子”，并生成控制响应因子组形成控制模型。',
          { x: 40, y: 140 }
        ),
        mkNode(
          'S3',
          'S3 稳定性统计 → 阈值组 → 状态划分 → 指令',
          '对算子做稳定性统计形成阈值组，划分运行状态，并生成优化控制指令。',
          { x: 40, y: 240 }
        ),
        mkNode(
          'S4',
          'S4 下发执行 + 再采集 + 模型修正',
          '指令下发至通风/给料/排放执行机构；再采集并更新算子与模型，实现修正迭代。',
          { x: 40, y: 340 }
        ),
      ],
      edges: [
        { from: 'S1', to: 'S2' },
        { from: 'S2', to: 'S3' },
        { from: 'S3', to: 'S4' },
        { from: 'S4', to: 'S1', label: '反馈修正' },
      ],
    },
  
    fig2: {
      title: '图2：监测数据采集与双层平滑处理',
      nodes: [
        mkNode('D1', '采集监测数据（带时间标记）', '温度/电位/液位/通风/进出流量等统一时间标记形成序列。', { x: 40, y: 40 }),
        mkNode('D2', '质量校验：有效性 + 连续性', '基于物理允许范围与变化速度限制剔除异常点。', { x: 40, y: 140 }),
        mkNode('D3', '第一滑动窗口：中位值平滑', '先做中位平滑，削减孤立尖峰干扰。', { x: 40, y: 240 }),
        mkNode('D4', '第二滑动窗口：算术平均平滑', '再做滑动平均，抑制高频波动。', { x: 40, y: 340 }),
        mkNode('D5', '输出：平滑监测序列集合', '得到温度/电位/液位/通风/进出流量等平滑序列集合。', { x: 40, y: 440 }),
      ],
      edges: [
        { from: 'D1', to: 'D2' },
        { from: 'D2', to: 'D3' },
        { from: 'D3', to: 'D4' },
        { from: 'D4', to: 'D5' },
      ],
    },
  
    fig3: {
      title: '图3：形成生物氧化过程控制模型',
      nodes: [
        mkNode('M1', '输入：平滑监测序列集合', '来自图2的平滑数据序列。', { x: 40, y: 40 }),
        mkNode('M2', '构建：耦合偏差算子', '综合温度/电位/通风偏离形成连续量化偏差输入。', { x: 40, y: 140 }),
        mkNode('M3', '构建：液位冒槽风险算子', '综合液位位置、趋势与进出流量不平衡形成风险输入。', { x: 40, y: 240 }),
        mkNode('M4', '指数放大：控制响应因子组', '由两类算子生成通风/给料/排放控制响应因子组。', { x: 40, y: 340 }),
        mkNode('M5', '联合表达：控制模型', '将算子与响应因子组联合，形成控制模型输出。', { x: 40, y: 440 }),
      ],
      edges: [
        { from: 'M1', to: 'M2' },
        { from: 'M1', to: 'M3' },
        { from: 'M2', to: 'M4' },
        { from: 'M3', to: 'M4' },
        { from: 'M4', to: 'M5' },
      ],
    },
  
    fig4: {
      title: '图4：状态划分与智能优化控制指令生成',
      nodes: [
        mkNode('C1', '输入：两类算子序列', '耦合偏差算子 + 液位风险算子（连续历史）。', { x: 40, y: 40 }),
        mkNode('C2', '稳定性统计处理', '计算统计平均值与偏离量，形成阈值组。', { x: 40, y: 140 }),
        mkNode('C3', '阈值组：偏差阈值/液位阈值', '得到耦合偏差运行阈值组 & 液位运行状态阈值组。', { x: 40, y: 240 }),
        mkNode('C4', '状态划分', '划分“稳定/轻度/重度/保护”等区间（含液位预警等级）。', { x: 40, y: 340 }),
        mkNode('C5', '生成优化控制指令', '调用响应因子：通风上调、给料下调、排放上调、暂停给料等。', { x: 40, y: 440 }),
      ],
      edges: [
        { from: 'C1', to: 'C2' },
        { from: 'C2', to: 'C3' },
        { from: 'C3', to: 'C4' },
        { from: 'C4', to: 'C5' },
      ],
    },
  }
  
  const currentFlow = computed(() => flowDefs[activeFlowKey.value])
  
  const selectedNodeId = ref<string>('')
  const selectedNode = computed(() => currentFlow.value.nodes.find(n => n.id === selectedNodeId.value))
  
  /** ============ Flow SVG 组件（内嵌） ============ */
  const FlowSvg = defineComponent({
    name: 'FlowSvg',
    props: {
      title: { type: String, required: true },
      nodes: { type: Array as () => FlowNode[], required: true },
      edges: { type: Array as () => FlowEdge[], required: true },
      activeNodeId: { type: String, default: '' },
    },
    emits: ['update:activeNodeId'],
    setup(props, { emit }) {
      const padding = 24
      const svgW = computed(() => {
        const maxX = Math.max(...props.nodes.map(n => n.x + n.w), 0)
        return maxX + padding
      })
      const svgH = computed(() => {
        const maxY = Math.max(...props.nodes.map(n => n.y + n.h), 0)
        return maxY + padding
      })
  
      const nodeMap = computed(() => {
        const m = new Map<string, FlowNode>()
        props.nodes.forEach(n => m.set(n.id, n))
        return m
      })
  
      const midBottom = (n: FlowNode) => ({ x: n.x + n.w / 2, y: n.y + n.h })
      const midTop = (n: FlowNode) => ({ x: n.x + n.w / 2, y: n.y })
  
      const edgePath = (e: FlowEdge) => {
        const a = nodeMap.value.get(e.from)
        const b = nodeMap.value.get(e.to)
        if (!a || !b) return ''
        const p1 = midBottom(a)
        const p2 = midTop(b)
  
        // 简单折线路由：下 → 中间 → 上（避免直线穿过节点）
        const midY = (p1.y + p2.y) / 2
        return `M ${p1.x} ${p1.y} L ${p1.x} ${midY} L ${p2.x} ${midY} L ${p2.x} ${p2.y}`
      }
  
      const edgeLabelPos = (e: FlowEdge) => {
        const a = nodeMap.value.get(e.from)
        const b = nodeMap.value.get(e.to)
        if (!a || !b) return { x: 0, y: 0 }
        const p1 = midBottom(a)
        const p2 = midTop(b)
        return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 - 6 }
      }
  
      const clickNode = (id: string) => emit('update:activeNodeId', id)
  
      return () =>
        h('div', { class: 'flow-svg' }, [
          h('div', { class: 'flow-title' }, props.title),
          h(
            'svg',
            {
              class: 'svg',
              width: svgW.value,
              height: svgH.value,
              viewBox: `0 0 ${svgW.value} ${svgH.value}`,
            },
            [
              h('defs', null, [
                h(
                  'marker',
                  { id: 'arrow', markerWidth: 10, markerHeight: 10, refX: 9, refY: 3, orient: 'auto' },
                  [h('path', { d: 'M0,0 L10,3 L0,6 Z', fill: 'currentColor' })]
                ),
              ]),
              // edges
              ...props.edges.map(e =>
                h('g', { key: `${e.from}-${e.to}` }, [
                  h('path', {
                    d: edgePath(e),
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeOpacity: 0.55,
                    strokeWidth: 2,
                    markerEnd: 'url(#arrow)',
                  }),
                  e.label
                    ? h(
                        'text',
                        { x: edgeLabelPos(e).x, y: edgeLabelPos(e).y, class: 'edge-label' },
                        e.label
                      )
                    : null,
                ])
              ),
              // nodes
              ...props.nodes.map(n => {
                const isActive = n.id === props.activeNodeId
                return h(
                  'g',
                  { key: n.id, class: 'node', onClick: () => clickNode(n.id), style: { cursor: 'pointer' } },
                  [
                    h('rect', {
                      x: n.x,
                      y: n.y,
                      width: n.w,
                      height: n.h,
                      rx: 12,
                      ry: 12,
                      class: isActive ? 'node-rect active' : 'node-rect',
                    }),
                    h(
                      'text',
                      { x: n.x + n.w / 2, y: n.y + 28, textAnchor: 'middle', class: 'node-title' },
                      n.title
                    ),
                  ]
                )
              }),
            ]
          ),
        ])
    },
  })
  
  /** ============ 图表：数据模拟（折线 + 阈值 + 状态统计） ============ */
  interface SeriesPack {
    x: number[]
    bio: number[]
    lvl: number[]
    bioThr: { stable: number; deviation: number; protect: number }
    lvlThr: { normal: number; warn: number; severe: number; protect: number }
    bioStateCounts: Record<string, number>
    lvlStateCounts: Record<string, number>
  }
  
  function clampInt(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, Math.trunc(v)))
  }
  
  /** 轻量可复现随机数（LCG） */
  function createRng(seed = 20251214) {
    let s = seed >>> 0
    return () => {
      s = (1664525 * s + 1013904223) >>> 0
      return s / 0xffffffff
    }
  }
  
  function simulateData(samples: number, disturbStart: number, disturbEnd: number): SeriesPack {
    const n = Math.max(50, Math.min(samples, 2000))
    const a = clampInt(disturbStart, 0, n - 1)
    const b = clampInt(disturbEnd, 0, n - 1)
    const ds = Math.min(a, b)
    const de = Math.max(a, b)
  
    const rnd = createRng(20251214 + n * 7 + ds * 13 + de * 17)
    const x = Array.from({ length: n }, (_, i) => i)
  
    // 说明书示意：中后段扰动抬升、局部放大关注 200~260（这里按你的 cfg 映射） [oai_citation:10‡一种基于控制模型的生物氧化过程智能优化方法.docx](sediment://file_0000000001187208a5e86fbc0c71a10e)  [oai_citation:11‡一种基于控制模型的生物氧化过程智能优化方法.docx](sediment://file_0000000001187208a5e86fbc0c71a10e)
    const bio = x.map(i => {
      const base = 0.35 + 0.03 * Math.sin(i / 9)
      const noise = (rnd() - 0.5) * cfg.noise
      const disturb = i >= ds && i <= de ? 0.55 + 0.10 * Math.sin(i / 4) : 0
      const relax = i > de ? Math.max(0, 0.35 * Math.exp(-(i - de) / 60)) : 0
      return base + disturb + relax + noise
    })
  
    const lvl = x.map(i => {
      const base = 0.28 + 0.02 * Math.cos(i / 11)
      const noise = (rnd() - 0.5) * cfg.noise
      const spike = i >= ds && i <= de ? 0.75 * Math.max(0, Math.sin((i - ds) / 6)) : 0
      const after = i > de ? 0.18 * Math.exp(-(i - de) / 45) : 0
      return base + spike + after + noise
    })
  
    // 阈值组（示意）：用于分区/统计；真实工程中来自稳定性统计处理 [oai_citation:12‡一种基于控制模型的生物氧化过程智能优化方法.docx](sediment://file_0000000001187208a5e86fbc0c71a10e)
    const bioThr = { stable: 0.55, deviation: 0.75, protect: 0.95 }
    const lvlThr = { normal: 0.45, warn: 0.65, severe: 0.85, protect: 1.05 }
  
    const bioState = (v: number) => {
      if (v <= bioThr.stable) return '稳定'
      if (v <= bioThr.deviation) return '轻度偏离'
      if (v <= bioThr.protect) return '重度偏离'
      return '保护'
    }
  
    const lvlState = (v: number) => {
      if (v <= lvlThr.normal) return '正常'
      if (v <= lvlThr.warn) return '预警'
      if (v <= lvlThr.severe) return '严重预警'
      return '保护'
    }
  
    const bioStateCounts: Record<string, number> = { 稳定: 0, 轻度偏离: 0, 重度偏离: 0, 保护: 0 }
    const lvlStateCounts: Record<string, number> = { 正常: 0, 预警: 0, 严重预警: 0, 保护: 0 }
  
    for (let i = 0; i < n; i++) {
      bioStateCounts[bioState(bio[i])]++
      lvlStateCounts[lvlState(lvl[i])]++
    }
  
    return { x, bio, lvl, bioThr, lvlThr, bioStateCounts, lvlStateCounts }
  }
  
  /** ============ 图表渲染（ECharts） ============ */
  const chartBioRef = ref<HTMLDivElement | null>(null)
  const chartLvlRef = ref<HTMLDivElement | null>(null)
  const chartBarRef = ref<HTMLDivElement | null>(null)
  
  let bioChart: echarts.ECharts | null = null
  let lvlChart: echarts.ECharts | null = null
  let barChart: echarts.ECharts | null = null
  
  let ro: ResizeObserver | null = null
  
  const pack = ref<SeriesPack | null>(null)
  
  function makeLineOption(title: string, x: number[], y: number[], thrLines: { name: string; value: number }[]) {
    return {
      title: { text: title, left: 10, top: 8, textStyle: { fontSize: 12 } },
      tooltip: { trigger: 'axis' },
      grid: { left: 48, right: 18, top: 40, bottom: 36 },
      xAxis: { type: 'category', data: x.map(String), boundaryGap: false, axisLabel: { interval: 'auto' } },
      yAxis: { type: 'value', scale: true },
      series: [
        {
          name: '算子值',
          type: 'line',
          data: y,
          showSymbol: false,
          smooth: 0.18,
          markLine: {
            symbol: ['none', 'none'],
            label: { show: true, formatter: (p: any) => p?.name ?? '' },
            data: thrLines.map(t => ({ yAxis: t.value, name: t.name })),
          },
        },
      ],
    }
  }
  
  function makeBarOption(bioCounts: Record<string, number>, lvlCounts: Record<string, number>) {
    const cats = ['稳定/正常', '轻度偏离/预警', '重度偏离/严重预警', '保护/保护']
    const bio = [bioCounts['稳定'], bioCounts['轻度偏离'], bioCounts['重度偏离'], bioCounts['保护']]
    const lvl = [lvlCounts['正常'], lvlCounts['预警'], lvlCounts['严重预警'], lvlCounts['保护']]
  
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { top: 8 },
      grid: { left: 48, right: 18, top: 44, bottom: 36 },
      xAxis: { type: 'category', data: cats },
      yAxis: { type: 'value' },
      series: [
        { name: '耦合偏差状态计数', type: 'bar', data: bio },
        { name: '液位风险状态计数', type: 'bar', data: lvl },
      ],
    }
  }
  
  function renderCharts(p: SeriesPack) {
    if (chartBioRef.value && !bioChart) bioChart = echarts.init(chartBioRef.value)
    if (chartLvlRef.value && !lvlChart) lvlChart = echarts.init(chartLvlRef.value)
    if (chartBarRef.value && !barChart) barChart = echarts.init(chartBarRef.value)
  
    bioChart?.setOption(
      makeLineOption('耦合偏差算子 vs 阈值组', p.x, p.bio, [
        { name: '稳定阈值', value: p.bioThr.stable },
        { name: '偏离阈值', value: p.bioThr.deviation },
        { name: '保护阈值', value: p.bioThr.protect },
      ]),
      true
    )
  
    lvlChart?.setOption(
      makeLineOption('液位冒槽风险算子 vs 阈值组', p.x, p.lvl, [
        { name: '正常阈值', value: p.lvlThr.normal },
        { name: '预警阈值', value: p.lvlThr.warn },
        { name: '严重预警阈值', value: p.lvlThr.severe },
        { name: '保护阈值(示意)', value: p.lvlThr.protect },
      ]),
      true
    )
  
    barChart?.setOption(makeBarOption(p.bioStateCounts, p.lvlStateCounts), true)
  }
  
  function regenerate() {
    const p = simulateData(cfg.samples, cfg.disturbStart, cfg.disturbEnd)
    pack.value = p
    nextTick(() => renderCharts(p))
  }
  
  watch(
    () => [cfg.samples, cfg.disturbStart, cfg.disturbEnd],
    () => {
      // 输入变化时不自动刷（避免频繁 init），你也可以改成自动 regenerate()
    }
  )
  
  onMounted(() => {
    regenerate()
  
    ro = new ResizeObserver(() => {
      bioChart?.resize()
      lvlChart?.resize()
      barChart?.resize()
    })
    if (chartBioRef.value) ro.observe(chartBioRef.value)
    if (chartLvlRef.value) ro.observe(chartLvlRef.value)
    if (chartBarRef.value) ro.observe(chartBarRef.value)
  })
  
  onBeforeUnmount(() => {
    ro?.disconnect()
    ro = null
    bioChart?.dispose()
    lvlChart?.dispose()
    barChart?.dispose()
    bioChart = null
    lvlChart = null
    barChart = null
  })
  </script>
  
  <style scoped>
  .bioox-viz {
    padding: 16px;
    color: #e9eef7;
    background: #0b1220;
    min-height: 100vh;
    box-sizing: border-box;
  }
  
  .toolbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 14px;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    background: rgba(255,255,255,0.03);
  }
  
  .title {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.2px;
  }
  
  .actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  
  .field {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: rgba(233,238,247,0.85);
  }
  
  .sep {
    opacity: 0.55;
  }
  
  .input {
    width: 86px;
    padding: 6px 8px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04);
    color: #e9eef7;
    outline: none;
  }
  
  .btn {
    padding: 8px 12px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(255,255,255,0.08);
    color: #e9eef7;
    cursor: pointer;
    user-select: none;
  }
  .btn:hover { background: rgba(255,255,255,0.12); }
  .btn.ghost { background: transparent; }
  
  .grid {
    margin-top: 14px;
    display: grid;
    grid-template-columns: 1.05fr 1.35fr;
    gap: 14px;
  }
  
  .panel {
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    background: rgba(255,255,255,0.03);
    overflow: hidden;
  }
  
  .panel-hd {
    padding: 12px 12px 10px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  
  .panel-title {
    font-size: 14px;
    font-weight: 700;
  }
  
  .hint {
    margin-top: 6px;
    font-size: 12px;
    opacity: 0.65;
  }
  
  .panel-bd {
    padding: 12px;
  }
  
  .tabs {
    margin-top: 10px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .tab {
    padding: 7px 10px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04);
    color: rgba(233,238,247,0.9);
    cursor: pointer;
  }
  .tab.active {
    background: rgba(255,255,255,0.12);
    border-color: rgba(255,255,255,0.18);
  }
  
  .flow-wrap {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 12px;
    align-items: start;
  }
  
  .flow-side {
    padding: 10px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(0,0,0,0.18);
    min-height: 520px;
  }
  
  .side-title {
    font-weight: 700;
    font-size: 13px;
    margin-bottom: 8px;
  }
  
  .side-body {
    font-size: 13px;
    line-height: 1.55;
    opacity: 0.92;
  }
  
  .side-node-title {
    font-weight: 700;
    margin-bottom: 6px;
  }
  
  .side-node-detail {
    opacity: 0.88;
  }
  
  .side-empty {
    font-size: 13px;
    opacity: 0.6;
    margin-top: 18px;
  }
  
  .help {
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid rgba(255,255,255,0.07);
    font-size: 12px;
    opacity: 0.9;
  }
  
  .help-title {
    font-weight: 700;
    margin-bottom: 6px;
  }
  
  .help-ul {
    margin: 0;
    padding-left: 16px;
    opacity: 0.85;
  }
  .help-ul li { margin: 6px 0; }
  
  .flow-svg {
    width: 100%;
    overflow: auto;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(0,0,0,0.18);
    padding: 10px;
  }
  
  .flow-title {
    font-weight: 700;
    font-size: 13px;
    margin-bottom: 10px;
    opacity: 0.9;
  }
  
  .svg {
    color: rgba(233,238,247,0.9);
  }
  
  .node-rect {
    fill: rgba(255,255,255,0.06);
    stroke: rgba(255,255,255,0.18);
    stroke-width: 1.2;
  }
  .node-rect.active {
    fill: rgba(255,255,255,0.12);
    stroke: rgba(255,255,255,0.35);
    stroke-width: 1.6;
  }
  
  .node-title {
    fill: rgba(233,238,247,0.92);
    font-size: 12px;
    font-weight: 700;
    pointer-events: none;
  }
  
  .edge-label {
    fill: rgba(233,238,247,0.8);
    font-size: 11px;
  }
  
  .charts {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .chart-card {
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    background: rgba(0,0,0,0.18);
    overflow: hidden;
  }
  
  .chart-title {
    padding: 10px 12px;
    font-size: 13px;
    font-weight: 700;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    opacity: 0.92;
  }
  
  .chart {
    height: 280px;
    width: 100%;
  }
  </style>