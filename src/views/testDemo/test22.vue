<template>
    <div class="fem-page">
      <div class="panel left">
        <div class="title">有限元分析模型查看器（动态生成）</div>
  
        <el-form label-width="96px" class="form">
          <el-form-item label="技术方案">
            <el-select v-model="form.scheme" style="width: 100%">
              <el-option v-for="s in schemes" :key="s.key" :label="s.label" :value="s.key" />
            </el-select>
          </el-form-item>
  
          <el-form-item label="曲率半径R">
            <el-slider
              v-model="form.radius"
              :min="radiusLimit.min"
              :max="radiusLimit.max"
              :step="0.1"
              :disabled="radiusLimit.locked"
              show-input
            />
            <div class="hint">
              <div>适配范围：{{ radiusLimit.text }}</div>
              <div>换型时间：{{ schemeMeta.changeoverMinText }}</div>
            </div>
          </el-form-item>
  
          <el-form-item label="板尺寸(mm)">
            <div class="row">
              <el-input-number v-model="form.width" :min="50" :max="500" :step="10" controls-position="right" />
              <span class="sep">×</span>
              <el-input-number v-model="form.height" :min="50" :max="500" :step="10" controls-position="right" />
            </div>
          </el-form-item>
  
          <el-form-item label="网格密度">
            <el-slider v-model="form.segments" :min="10" :max="120" :step="2" show-input />
          </el-form-item>
  
          <el-form-item label="压力(归一)">
            <el-slider v-model="form.pressure" :min="0.1" :max="2.0" :step="0.1" show-input />
          </el-form-item>
  
          <el-form-item label="显示">
            <el-switch v-model="form.wireframe" active-text="线框" />
          </el-form-item>
  
          <el-form-item>
            <el-button type="primary" @click="regenerate">重新生成模型</el-button>
            <el-button @click="mockSolveAndApply">模拟求解并上色</el-button>
          </el-form-item>
  
          <el-alert
            type="info"
            show-icon
            :closable="false"
            title="说明：当前为“查看器 + 动态生成器”骨架。你接真实 FEM 求解后，只要把结果场（每个节点/单元的应力标量）喂给 applyField() 即可。"
          />
        </el-form>
      </div>
  
      <div class="panel mid">
        <div class="subTitle">模型视图</div>
        <div ref="viewerEl" class="viewer"></div>
      </div>
  
      <div class="panel right">
        <div class="subTitle">适应性 / 换型效率对比</div>
        <div ref="chartEl" class="chart"></div>
  
        <div class="card">
          <div class="cardTitle">数据来源（文档摘录）</div>
          <div class="cardText">
            模型仿形：固定单一曲率，换型 &gt;30min；气囊压差：R±0.5，~15min；研发装置：R1-平面（全适应），~5min。
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
  import * as THREE from "three";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
  import * as echarts from "echarts";
  
  type SchemeKey = "mold" | "airbag" | "device";
  
  const schemes: Array<{ key: SchemeKey; label: string }> = [
    { key: "mold", label: "模型仿形" },
    { key: "airbag", label: "气囊压差" },
    { key: "device", label: "本项目研发装置" },
  ];
  
  const form = reactive({
    scheme: "device" as SchemeKey,
    radius: 3.0, // 曲率半径（示意）
    width: 220,
    height: 120,
    segments: 60,
    pressure: 1.0,
    wireframe: false,
  });
  
  const viewerEl = ref<HTMLDivElement | null>(null);
  const chartEl = ref<HTMLDivElement | null>(null);
  
  // -------------------------
  // 方案元数据（来自“适应性及换型效率测试”）
  // -------------------------
  const schemeMeta = computed(() => {
    if (form.scheme === "mold") {
      return {
        curveText: "固定单一曲率",
        changeoverMin: 30, // 文档是 >30，这里用 30 作为柱状图展示基准
        changeoverMinText: "> 30 min",
        uniformity: 0.55, // 接触均匀性差 -> 应力更集中（示意）
      };
    }
    if (form.scheme === "airbag") {
      return {
        curveText: "R ± 0.5",
        changeoverMin: 15,
        changeoverMinText: "~ 15 min",
        uniformity: 0.75,
      };
    }
    return {
      curveText: "R1 - 平面（全适应）",
      changeoverMin: 5,
      changeoverMinText: "~ 5 min",
      uniformity: 0.9,
    };
  });
  
  // 曲率输入限制：把“适配范围”映射成 UI 约束（示意实现）
  const radiusLimit = computed(() => {
    if (form.scheme === "mold") {
      // 固定单一曲率：锁定 R（视为某个固定半径）
      return {
        min: form.radius,
        max: form.radius,
        locked: true,
        text: "固定单一曲率（R 锁定）",
      };
    }
    if (form.scheme === "airbag") {
      // R±0.5：以当前 R 为中心的可调窗口（你也可以换成“目标R”字段）
      const min = Math.max(0.6, Number((form.radius - 0.5).toFixed(1)));
      const max = Number((form.radius + 0.5).toFixed(1));
      return {
        min,
        max,
        locked: false,
        text: `R ∈ [${min}, ${max}]`,
      };
    }
    // 研发装置：R1-平面（∞），这里用一个大值当“近似平面”
    return {
      min: 1.0,
      max: 30.0,
      locked: false,
      text: "R ≥ 1；R 越大越接近平面",
    };
  });
  
  watch(
    () => form.scheme,
    () => {
      // 切换方案时，让 R 自动落在可用范围内
      if (radiusLimit.value.locked) return;
      if (form.radius < radiusLimit.value.min) form.radius = radiusLimit.value.min;
      if (form.radius > radiusLimit.value.max) form.radius = radiusLimit.value.max;
      regenerate();
      renderChart();
    }
  );
  
  // -------------------------
  // Three.js viewer
  // -------------------------
  let renderer: THREE.WebGLRenderer | null = null;
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let controls: OrbitControls | null = null;
  let mesh: THREE.Mesh | null = null;
  let animId = 0;
  
  function disposeMesh(m: THREE.Mesh) {
    const geo = m.geometry;
    const mat = m.material as THREE.Material;
    geo.dispose();
    mat.dispose();
    scene?.remove(m);
  }
  
  function initThree() {
    if (!viewerEl.value) return;
  
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1220);
  
    const w = viewerEl.value.clientWidth;
    const h = viewerEl.value.clientHeight;
  
    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 5000);
    camera.position.set(0, 160, 260);
  
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    viewerEl.value.innerHTML = "";
    viewerEl.value.appendChild(renderer.domElement);
  
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
  
    const light1 = new THREE.DirectionalLight(0xffffff, 1.1);
    light1.position.set(200, 300, 200);
    scene.add(light1);
  
    const amb = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(amb);
  
    const grid = new THREE.GridHelper(600, 20, 0x2b354a, 0x1b2333);
    grid.position.y = -60;
    scene.add(grid);
  
    window.addEventListener("resize", onResize);
  }
  
  function onResize() {
    if (!viewerEl.value || !renderer || !camera) return;
    const w = viewerEl.value.clientWidth;
    const h = viewerEl.value.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  
  function makeBentPlateGeometry(widthMm: number, heightMm: number, seg: number, radius: number) {
    // 单位：这里把 mm 当作“场景单位”，只做相对展示
    const geo = new THREE.PlaneGeometry(widthMm, heightMm, seg, Math.max(10, Math.floor(seg / 2)));
    geo.rotateX(-Math.PI / 2); // 让面朝上（XZ 平面）
  
    // 沿 X 方向“弯成圆柱面”：z = R - sqrt(R^2 - x^2)
    // 为避免 sqrt 负数，要求 R >= width/2
    const R = Math.max(radius, widthMm / 2 + 1e-3);
    const pos = geo.attributes.position as THREE.BufferAttribute;
  
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
  
      // 原 plane 在 XZ 平面，y 为 0；我们用 y 作为“隆起/弯曲”高度
      const absx = Math.min(Math.abs(x), R - 1e-3);
      const lift = R - Math.sqrt(Math.max(0, R * R - absx * absx)); // 0.. 近似弧高
      pos.setY(i, lift);
  
      // 保留 z（长度方向）不变
      pos.setZ(i, z);
    }
  
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }
  
  function ensureColorAttribute(geo: THREE.BufferGeometry) {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }
  
  function colorizeByScalar(geo: THREE.BufferGeometry, field: Float32Array, vmin?: number, vmax?: number) {
    const cAttr = geo.getAttribute("color") as THREE.BufferAttribute;
    const n = cAttr.count;
  
    let min = Number.isFinite(vmin as number) ? (vmin as number) : Infinity;
    let max = Number.isFinite(vmax as number) ? (vmax as number) : -Infinity;
  
    if (!Number.isFinite(vmin as number) || !Number.isFinite(vmax as number)) {
      for (let i = 0; i < n; i++) {
        const v = field[i];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      if (max - min < 1e-9) {
        max = min + 1e-9;
      }
    }
  
    for (let i = 0; i < n; i++) {
      const t = (field[i] - min) / (max - min);
      // 蓝 -> 红（HSL 近似）
      const color = new THREE.Color();
      color.setHSL((1 - t) * 0.66, 1.0, 0.5);
      cAttr.setXYZ(i, color.r, color.g, color.b);
    }
    cAttr.needsUpdate = true;
  }
  
  function regenerate() {
    if (!scene) return;
  
    if (mesh) {
      disposeMesh(mesh);
      mesh = null;
    }
  
    const geo = makeBentPlateGeometry(form.width, form.height, form.segments, form.radius);
    ensureColorAttribute(geo);
  
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      metalness: 0.1,
      roughness: 0.85,
      wireframe: form.wireframe,
    });
  
    mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = -20;
    scene.add(mesh);
  
    // 初始上色（默认先用一份 mock 结果）
    mockSolveAndApply();
  }
  
  function mockSolveAndApply() {
    if (!mesh) return;
  
    const geo = mesh.geometry as THREE.BufferGeometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
  
    const uniformity = schemeMeta.value.uniformity; // 方案影响“应力集中”
    const p = form.pressure;
  
    const field = new Float32Array(pos.count);
  
    // 伪“von Mises”：用一个中心高斯 + 边缘项，按 uniformity 调整集中程度
    // uniformity 越低 -> 集中越强（峰更尖）
    const sharp = 1 + (1 - uniformity) * 6; // 1..7
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const r2 = (x * x + z * z) / (Math.max(form.width, form.height) ** 2);
  
      const center = Math.exp(-r2 * 30 * sharp);
      const edge = Math.pow(Math.abs(x) / (form.width / 2), 2) * 0.6;
  
      // 压力 p 线性放大
      field[i] = p * (center * (2.2 - uniformity) + edge * (1.2 - uniformity * 0.6));
    }
  
    colorizeByScalar(geo, field);
  }
  
  function animate() {
    animId = requestAnimationFrame(animate);
    controls?.update();
    renderer?.render(scene!, camera!);
  }
  
  // -------------------------
  // ECharts chart (来自“适应性及换型效率测试”)
  // -------------------------
  let chart: echarts.ECharts | null = null;
  
  function renderChart() {
    if (!chartEl.value) return;
    if (!chart) {
      chart = echarts.init(chartEl.value);
    }
  
    const option: echarts.EChartsOption = {
      tooltip: { trigger: "axis" },
      grid: { left: 40, right: 18, top: 24, bottom: 40 },
      xAxis: {
        type: "category",
        data: ["模型仿形", "气囊压差", "研发装置"],
        axisLabel: { interval: 0 },
      },
      yAxis: { type: "value", name: "换型时间(min)" },
      series: [
        {
          type: "bar",
          data: [30, 15, 5], // 文档：>30 / ~15 / ~5（这里用于可视化基准）
        },
      ],
    };
  
    chart.setOption(option);
    chart.resize();
  }
  
  onMounted(() => {
    initThree();
    regenerate();
    renderChart();
    animate();
  });
  
  onBeforeUnmount(() => {
    cancelAnimationFrame(animId);
    window.removeEventListener("resize", onResize);
  
    if (mesh) disposeMesh(mesh);
    mesh = null;
  
    controls?.dispose();
    controls = null;
  
    renderer?.dispose();
    renderer = null;
  
    chart?.dispose();
    chart = null;
  });
  
  // wireframe 切换时直接更新材质
  watch(
    () => form.wireframe,
    (v) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.wireframe = v;
      mat.needsUpdate = true;
    }
  );
  
  // 任何关键参数变化 -> 重建网格（你也可以做更细的增量更新）
  watch(
    () => [form.radius, form.width, form.height, form.segments, form.pressure] as const,
    () => regenerate(),
    { deep: true }
  );
  </script>
  
  <style scoped>
  .fem-page {
    height: 100%;
    min-height: 620px;
    display: grid;
    grid-template-columns: 340px 1fr 360px;
    gap: 12px;
    padding: 12px;
    background: #0a1020;
  }
  
  .panel {
    background: #0f1a2e;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .left {
    padding: 12px;
  }
  .mid,
  .right {
    padding: 12px;
  }
  
  .title {
    font-size: 16px;
    font-weight: 700;
    color: #eaf0ff;
    margin-bottom: 10px;
  }
  .subTitle {
    font-size: 14px;
    font-weight: 700;
    color: #eaf0ff;
    margin-bottom: 8px;
  }
  
  .form :deep(.el-form-item__label) {
    color: rgba(234, 240, 255, 0.75);
  }
  .form :deep(.el-input__wrapper),
  .form :deep(.el-slider__runway) {
    background: rgba(255, 255, 255, 0.06);
  }
  
  .hint {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.4;
    color: rgba(234, 240, 255, 0.7);
  }
  
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .sep {
    color: rgba(234, 240, 255, 0.5);
  }
  
  .viewer {
    flex: 1;
    min-height: 520px;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  
  .chart {
    height: 320px;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  
  .card {
    margin-top: 12px;
    padding: 10px 10px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  .cardTitle {
    font-size: 13px;
    font-weight: 700;
    color: rgba(234, 240, 255, 0.9);
    margin-bottom: 6px;
  }
  .cardText {
    font-size: 12px;
    color: rgba(234, 240, 255, 0.7);
    line-height: 1.5;
  }
  </style>