# test26 WMS 可视化 — 前端接手文档

> **页面文件**：`src/views/testDemo/test26.vue`  
> **访问地址**：`http://localhost:5173/#/test26`（别名 `/ncwms`）  
> **路由配置**：`src/routers/index.ts`  
> **后端参考**：项目根目录 `ncWMS2_使用手册(1).md`（WMS 协议与部署）

本文档面向**接手维护的前端开发**，按「能跑起来 → 能改功能 → 能排错」组织，无需先读完全部代码。

---

## 0. 五分钟上手

### 0.1 环境要求

| 项 | 说明 |
|----|------|
| Node.js | 建议 18+ |
| 内网服务 | ncWMS `192.168.1.17:8082`、GeoServer `192.168.1.17:8081` 需可达 |
| Mapbox Token | 在 `useMapbox.ts` 中配置（项目已有） |
| 天地图 Token | 底图瓦片在 `useMapbox.ts` 中配置 |

### 0.2 启动

```bash
npm install
npm run dev
```

浏览器打开：**http://localhost:5173/#/test26**

### 0.3 第一次验证（建议按顺序做）

1. 左侧选 **GEBCO 海底地形** → 要素 `gebco/elevation`
2. 配色面板色板改为 **`seq-OrRd`**（橙红，对比最明显）
3. 点 **「应用配色」** → 海洋区域应变橙红色
4. 再改为 **`seq-Greens`** → 点应用 → 应变绿色系
5. 右下角竖条图例应与地图颜色一致（来自 ncWMS `GetLegendGraphic`）

若第 3 步无变化，直接看 [第九章 排错](#九常见问题与排错)。

### 0.4 页面在做什么（一句话）

用 **Mapbox GL** 叠加 **WMS 栅格图**；ncWMS 图层颜色由**服务端按 URL 参数渲染**后返回 PNG，前端只负责拼 URL、贴图、换瓦片，**不做像素级上色**。

---

## 一、功能与数据源

| 数据源 | 后端 | WMS 版本 | 图层发现方式 | 配色方式 |
|--------|------|----------|--------------|----------|
| MFWAM 海浪预报 | ncWMS2 `:8082` | 1.3.0 | GetCapabilities 自动发现 | 面板传参 + `styles=raster/色板名` |
| GEBCO 海底地形 | ncWMS2 `:8082` | 1.3.0 | GetCapabilities 自动发现 | 同上，默认 `div-RdBu` |
| IBCAO 北极地形 | GeoServer `:8081` | 1.1.0 | 代码静态配置 | GeoServer SLD，前端不传配色 |

---

## 二、相关文件地图

```
src/
├── views/testDemo/
│   ├── test26.vue                 ← 本页面（全部业务逻辑在此单文件）
│   └── test26_前端使用手册.md      ← 本文档
├── composables/mapbox/
│   └── useMapbox.ts               ← Mapbox 初始化、天地图底图
└── routers/index.ts               ← /test26、/ncwms 路由

vite.config.ts                     ← 开发代理（CORS）
ncWMS2_使用手册(1).md               ← 服务端 WMS 参数说明
```

**设计说明**：test26 是独立 Demo 页，逻辑集中在单文件，未拆 store / composable。改 WMS 相关功能优先改 `test26.vue`。

---

## 三、架构与数据流

```
┌──────────────────────────────────────────────────────────────────┐
│                         test26.vue                                │
│  ┌─────────────┐   GetCapabilities / GetMetadata   ┌───────────┐ │
│  │ 左侧面板     │ ────────────────────────────────► │  ncWMS2   │ │
│  │ 配色/时间/投影│   GetMap / GetLegendGraphic      │ GeoServer │ │
│  └─────────────┘ ◄──────────────────────────────── └───────────┘ │
│         │                                                         │
│         │ buildNcwmsParams() / buildTileWmsUrl()                  │
│         ▼                                                         │
│  ┌─────────────┐                                                  │
│  │ Mapbox GL   │  raster 瓦片 或 image 单图叠加                    │
│  │ + 天地图底图 │                                                  │
│  └─────────────┘                                                  │
└──────────────────────────────────────────────────────────────────┘
         │
         │ 开发环境：Vite 代理（避免 CORS）
         ▼
  /ncwms2/wms  →  http://192.168.1.17:8082/ncwms2/wms
  /geoserver/  →  http://192.168.1.17:8081/geoserver/
```

### 3.1 页面初始化流程

```
onMounted
  → initMap()                    // useMapbox，容器 #ncwms-map
  → map.on('load')
      → changeBaseMap(影像底图)
      → initPage()
          → fetchCapabilities()  // 拉 ncWMS 图层 + 合并 STATIC_LAYERS
          → 默认选 GEBCO 数据源
          → onDataSourceChange()
              → onFeatureChange()
                  → fetchLayerMeta()     // 色标范围、色板列表
                  → applyLayerScale()
                  → applyLayerPalette()
                  → refreshLayer()       // 真正上图
```

### 3.2 用户操作 → 代码入口

| 用户操作 | 触发函数 | 是否重新请求 WMS |
|----------|----------|------------------|
| 切换数据源 | `onDataSourceChange` | ✅ |
| 切换要素 | `onFeatureChange` | ✅ |
| 切换时间/垂向 | `onFilterChange` | ✅ |
| 切换投影 | `onProjectionChange` | ✅ |
| 改配色后点「应用配色」 | `applyColorConfig` → `refreshLayer` | ✅ |
| 仅改色板下拉（未点应用） | 无 | ❌（仅图例预览会变） |

---

## 四、左侧面板说明

| 控件 | 变量 | 说明 |
|------|------|------|
| 数据源 | `selectedDataSource` | 按 `dataset` 分组：`mfwam` / `gebco` / `ibcao` |
| 要素选择 | `selectedFeature` | WMS 图层名，如 `mfwam/VHM0`、`gebco/elevation` |
| 时间选择 | `selectedTime` | 仅 `timeDim` 图层显示 |
| 垂向分层 | `selectedElevation` | 仅 `elevDim` 图层显示 |
| 投影选择 | `selectedProjection` | 见 [第五章渲染模式](#五渲染模式) |
| 色板 | `selectedPalette` | ncWMS 色板名，写入 `styles=raster/{名}` |
| 最小值/最大值 | `colorMin` / `colorMax` | 拼成 `colorscalerange=min,max` |
| 色带分段 | `numColorBands` | 对应 `NUMCOLORBANDS`，5–250 |
| 对数色标 | `logScale` | 对应 `LOGSCALE=true` |
| 应用配色 | `applyColorConfig` | **必须点击**才会 `refreshLayer()` |

**GeoServer 图层（IBCAO）** 不显示配色面板（`showNcwmsColorConfig = false`）。

**右下角图例**：`<img :src="legendUrl">`，`legendUrl` 指向 ncWMS `GetLegendGraphic`，与地图瓦片配色一致。

---

## 五、渲染模式

| 投影选项 | Mapbox Source 类型 | WMS crs/srs | bbox |
|----------|-------------------|-------------|------|
| 赤道 EPSG:4326 | `raster` 瓦片 | `EPSG:3857` | `{bbox-epsg-3857}` |
| 北极 EPSG:32661 | `image` 单图 | `EPSG:32661` | `POLAR_BBOX` |
| 南极 EPSG:32761 | `image` 单图 | `EPSG:32761` | `POLAR_BBOX` |
| IBCAO（强制单图） | `image` 单图 | `EPSG:3413` | `IBCAO_3413_BBOX` |

判断逻辑：`shouldUseImageOverlay(layer)`  
→ `layer.forceImageOverlay === true` **或** `selectedProjection !== 'EPSG:4326'`

### 5.1 赤道瓦片（最常用）

```ts
// buildTileWmsUrl() 生成模板 URL，Mapbox 自动替换 bbox
`${NCWMS_BASE}?${buildNcwmsParams(...).join('&')}&crs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256&_v=${layerVersion}`
```

**硬性要求**：`{bbox-epsg-3857}` 不能被 URL 编码为 `%7Bbbox-epsg-3857%7D`，必须用字符串拼接，不要用 `URLSearchParams` 处理整段 URL。

### 5.2 IBCAO 北极贴图（EPSG:3413）

北极数据**不能**直接用 Web Mercator 瓦片，否则边缘出现圆弧畸变。

方案：

1. GeoServer 用原生 `EPSG:3413` 出一张 WMS 图
2. bbox 四角经 `gdaltransform` 预算为 WGS84 经纬度
3. Mapbox `image` 源 + `coordinates` 做透视贴图（地图上呈菱形）

预计算坐标见 `test26.vue` 中 `IBCAO_3413_COORDS`。选中 IBCAO 时会：

- `setBaseMapVisible(false)` 隐藏天地图
- `fitIbcaoView()` 飞到北极
- 地图背景色 `#b8cdb8`（`.arctic-image-mode`）

---

## 六、ncWMS 配色（最重要）

### 6.1 核心结论（必读）

本项目的 ncWMS 实例（`192.168.1.17:8082`）上：

| 传参方式 | 是否生效 |
|----------|----------|
| `styles=raster/div-RdBu` | ✅ **生效** |
| `palette=div-RdBu`（单独参数） | ❌ **无效**，出图完全一样 |

因此 `buildNcwmsParams()` 写法为：

```ts
`styles=raster/${selectedPalette.value}`,  // 色板写在这里
`colorscalerange=${colorscalerange.value}`,
`NUMCOLORBANDS=${numColorBands.value}`,
// 不要传 palette=xxx
```

### 6.2 `styles` 参数格式与前端限制（必读）

`styles` 由 **`{渲染方式}/{色板名}`** 两段组成，**不是**整串写死的：

```
styles = raster / div-RdBu
         └固定前缀  └可换，必须从服务端列表中选
```

#### 前端能控制的配色参数

| 参数 | 是否生效 | 说明 |
|------|----------|------|
| `styles=raster/{色板名}` | ✅ | **色板必须写在这里**；`{色板名}` 来自 `GetMetadata.palettes` |
| `colorscalerange=min,max` | ✅ | 数值映射范围，与色板配合决定最终颜色 |
| `NUMCOLORBANDS` | ✅ | 色带分段数，5–250，越大过渡越平滑 |
| `LOGSCALE=true` | ✅ | 对数色标 |
| `palette=xxx`（单独参数） | ❌ | **本实例无效**，出图与不加该参数完全相同（已实测） |
| 前端 CSS / Canvas 调色 | ❌ | 地图颜色由服务端 PNG 决定，前端不能二次上色 |
| 自定义任意 hex 色带 | ❌ | 只能用服务端内置色板名，不能传 `#FF0000` 之类 |

#### 色板列表从哪来、能否自定义

- 列表**不是前端写死的**，切换图层时 `fetchLayerMeta()` 读 `palettes` 字段填入下拉框。
- 当前 GEBCO 图层约 **94** 种色板；不同图层返回列表可能略有差异。
- 新增色板需**服务端**配置，前端只能选用已有名称。
- 色板名**大小写敏感**，必须与服务端完全一致（如 `div-RdBu`，不是 `div-rdbu`）。

#### 配色生效时机（UI 层面）

| 操作 | 图例是否变 | 地图是否变 |
|------|------------|------------|
| 仅改色板下拉 | ✅ 即时（`legendUrl` 响应式） | ❌ |
| 点「应用配色」 | ✅ | ✅（`refreshLayer()`） |
| 切换图层/时间/投影 | ✅ | ✅（自动 `refreshLayer()`） |

---

### 6.3 色板命名规则

| 前缀 / 后缀 | 类型 | 视觉规律 | 典型用途 |
|-------------|------|----------|----------|
| `default` | 默认顺序色 | 蓝 → 青 → 黄 → 红 | 海浪、温度等「值越大越暖」 |
| `div-*` | **发散色** | 中间浅色，两端两种对比色 | 地形（海沟负、陆地正）、距平 |
| `seq-*` | **顺序色** | 低值 → 高值单向渐变 | 波高、盐度、浓度 |
| `psu-*` | 感知均匀色 | matplotlib 风格，过渡平滑 | 科学出版、色盲友好 |
| `x-*` | 领域专用色 | 海洋/气候传统配色 | 海表温、Ncview 风格 |
| `*-inv` | **反转版** | 与同名色板颜色方向对调 | 需要反色时 |

**`-inv` 示例**：`div-RdBu` 为「高值红、低值蓝」；`div-RdBu-inv` 为「高值蓝、低值红」。

---

### 6.4 色板全表与视觉说明

> 完整列表以 `GetMetadata → palettes` 为准。下表为当前服务端全部 94 种色板及视觉描述，供前端选型参考。

#### 6.4.1 默认

| 色板名 | 视觉描述 |
|--------|----------|
| `default` | 蓝（低）→ 青 → 黄 → 橙 → 红（高），海洋标量场通用默认 |
| `default-inv` | 上述方向反转：红（低）→ … → 蓝（高） |

#### 6.4.2 发散色 `div-*`（中间浅、两端对比）

适合**有自然零点或参考值**的数据（如 GEBCO 地形 `-8000 ~ 5000`）：

| 色板名 | 视觉描述 |
|--------|----------|
| `div-RdBu` | **红（高）— 白（中）— 蓝（低）**，地形最常用 |
| `div-RdBu-inv` | 蓝（高）— 白 — 红（低） |
| `div-RdYlBu` | 红（高）— 黄 — 蓝（低） |
| `div-RdYlBu-inv` | 蓝（高）— 黄 — 红（低） |
| `div-RdYlGn` | 红（高）— 黄 — 绿（低） |
| `div-RdYlGn-inv` | 绿（高）— 黄 — 红（低） |
| `div-BrBG` | 棕（高）— 白 — 蓝绿（低） |
| `div-BrBG-inv` | 蓝绿（高）— 白 — 棕（低） |
| `div-BuRd` | 蓝（高）— 白 — 红（低） |
| `div-BuRd-inv` | 红（高）— 白 — 蓝（低） |
| `div-BuRd2` | 深蓝 — 白 — 深红，对比比 BuRd 更强 |
| `div-BuRd2-inv` | 深红 — 白 — 深蓝 |
| `div-PRGn` | 紫（高）— 白 — 绿（低） |
| `div-PRGn-inv` | 绿（高）— 白 — 紫（低） |
| `div-PiYG` | 粉（高）— 白 — 黄绿（低） |
| `div-PiYG-inv` | 黄绿（高）— 白 — 粉（低） |
| `div-PuOr` | 紫（高）— 白 — 橙（低） |
| `div-PuOr-inv` | 橙（高）— 白 — 紫（低） |
| `div-RdGy` | 红（高）— 白 — 灰（低），偏中性 |
| `div-RdGy-inv` | 灰（高）— 白 — 红（低） |
| `div-Spectral` | 红 → 橙 → 黄 → 绿 → 蓝，彩虹发散，对比极强 |
| `div-Spectral-inv` | 蓝 → 绿 → 黄 → 橙 → 红 |

#### 6.4.3 顺序色 `seq-*`（低 → 高单向渐变）

| 色板名 | 视觉描述 |
|--------|----------|
| `seq-Blues` | 白/浅蓝 → 深蓝 |
| `seq-Blues-inv` | 深蓝 → 浅蓝 |
| `seq-Greens` | 浅绿 → 深绿 |
| `seq-Greens-inv` | 深绿 → 浅绿 |
| `seq-OrRd` | 浅黄 → 橙 → 深红，**测试配色是否生效最直观** |
| `seq-OrRd-inv` | 深红 → 橙 → 浅黄 |
| `seq-Oranges` | 浅橙 → 深橙 |
| `seq-Oranges-inv` | 深橙 → 浅橙 |
| `seq-Reds` | 浅粉 → 深红 |
| `seq-Reds-inv` | 深红 → 浅粉 |
| `seq-Purples` | 浅紫 → 深紫 |
| `seq-Purples-inv` | 深紫 → 浅紫 |
| `seq-Greys` | 白 → 黑灰 |
| `seq-Greys-inv` | 黑灰 → 白 |
| `seq-GreysRev` | 黑 → 白（反向灰度） |
| `seq-GreysRev-inv` | 白 → 黑 |
| `seq-BuGn` | 蓝 → 青绿 |
| `seq-BuGn-inv` | 青绿 → 蓝 |
| `seq-GnBu` | 绿 → 蓝 |
| `seq-GnBu-inv` | 蓝 → 绿 |
| `seq-BuPu` | 蓝 → 紫 |
| `seq-BuPu-inv` | 紫 → 蓝 |
| `seq-PuBu` | 紫 → 蓝 |
| `seq-PuBu-inv` | 蓝 → 紫 |
| `seq-PuRd` | 紫 → 红 |
| `seq-PuRd-inv` | 红 → 紫 |
| `seq-RdPu` | 红 → 紫 |
| `seq-RdPu-inv` | 紫 → 红 |
| `seq-YlGn` | 黄 → 绿 |
| `seq-YlGn-inv` | 绿 → 黄 |
| `seq-YlGnBu` | 黄 → 绿 → 蓝 |
| `seq-YlGnBu-inv` | 蓝 → 绿 → 黄 |
| `seq-YlOrBr` | 黄 → 橙 → 棕 |
| `seq-YlOrBr-inv` | 棕 → 橙 → 黄 |
| `seq-YlOrRd` | 黄 → 橙 → 红 |
| `seq-YlOrRd-inv` | 红 → 橙 → 黄 |
| `seq-BkBu` | 黑 → 蓝 |
| `seq-BkBu-inv` | 蓝 → 黑 |
| `seq-BkGn` | 黑 → 绿 |
| `seq-BkGn-inv` | 绿 → 黑 |
| `seq-BkRd` | 黑 → 红 |
| `seq-BkRd-inv` | 红 → 黑 |
| `seq-BkYl` | 黑 → 黄 |
| `seq-BkYl-inv` | 黄 → 黑 |
| `seq-BuYl` | 蓝 → 黄 |
| `seq-BuYl-inv` | 黄 → 蓝 |
| `seq-Heat` | 黑 → 红 → 黄 → 白，热力图风格 |
| `seq-Heat-inv` | 白 → 黄 → 红 → 黑 |
| `seq-BlueHeat` | 蓝 → 红 → 黄，冷到热 |
| `seq-BlueHeat-inv` | 黄 → 红 → 蓝 |
| `seq-cubeYF` | 黄 → 绿 |
| `seq-cubeYF-inv` | 绿 → 黄 |

#### 6.4.4 感知均匀色 `psu-*`（科学可视化）

| 色板名 | 视觉描述 |
|--------|----------|
| `psu-viridis` | 紫 → 蓝绿 → 黄绿，色盲友好，现代默认感 |
| `psu-viridis-inv` | 黄绿 → 蓝绿 → 紫 |
| `psu-plasma` | 紫 → 粉 → 黄 |
| `psu-plasma-inv` | 黄 → 粉 → 紫 |
| `psu-inferno` | 黑 → 紫 → 橙 → 黄 |
| `psu-inferno-inv` | 黄 → 橙 → 紫 → 黑 |
| `psu-magma` | 黑 → 紫红 → 橙 → 白 |
| `psu-magma-inv` | 白 → 橙 → 紫红 → 黑 |

#### 6.4.5 专用色 `x-*`

| 色板名 | 视觉描述 |
|--------|----------|
| `x-Sst` | 海表温：蓝（冷）→ 白 → 红（暖） |
| `x-Sst-inv` | 红（冷）→ 白 → 蓝（暖） |
| `x-Rainbow` | 全彩虹，对比强，不推荐正式出版 |
| `x-Rainbow-inv` | 反向彩虹 |
| `x-Ncview` | Ncview 传统海洋配色 |
| `x-Ncview-inv` | Ncview 反转 |
| `x-Occam` | Occam 海洋模式习惯色 |
| `x-Occam-inv` | Occam 反转 |

---

### 6.5 渲染方式与色板的区别

`styles` 的 **`raster` 前缀**表示画法，**不等于**色板名。ncWMS 支持多种渲染方式，test26 配色面板**仅使用 `raster`**：

| styles 示例 | 画法 | 外观 | test26 是否接入 |
|-------------|------|------|----------------|
| `raster/div-RdBu` | 栅格平滑填色 | 连续色块 | ✅ 当前方案 |
| `colored_contours/default` | 等值线填色 | 一圈圈等值线 + 填色 | ❌ 需改 `buildNcwmsParams` |
| `default-vector/default` | 矢量箭头 | 箭头/流向 | ❌ |
| `vector_wind_barbs/default` | 风羽 | 气象风羽符号 | ❌ |

若要切换画法，需同时修改 `buildNcwmsParams()` 中的 `styles=` 逻辑，并确认图层在 GetCapabilities 中支持该 style。

---

### 6.6 推荐选用速查

| 场景 | 推荐色板 | 建议 colorscalerange |
|------|----------|----------------------|
| GEBCO 地形（海+陆） | `div-RdBu` | `-8000,5000`（代码默认） |
| MFWAM 海浪波高 | `default` 或 `seq-OrRd` | 用 `GetMetadata.scaleRange` |
| 验证配色是否生效 | `seq-OrRd` 或 `seq-Greens` | 任意，变化最明显 |
| 科学报告 / 色盲友好 | `psu-viridis` | 按数据范围 |
| 海表温 | `x-Sst` | 按数据范围 |
| 需要反色 | 同名加 `-inv` | 与原色板相同 |

---

### 6.7 完整 GetMap 示例（GEBCO）

```
/ncwms2/wms?service=WMS&version=1.3.0&request=GetMap
&layers=gebco/elevation
&styles=raster/seq-OrRd
&format=image/png&transparent=true
&colorscalerange=-8000,5000
&NUMCOLORBANDS=20
&crs=EPSG:3857
&bbox={bbox-epsg-3857}
&width=256&height=256
&_v=3
```

### 6.8 色标范围从哪来

切换 ncWMS 图层时调用：

```
GET /ncwms2/wms?service=WMS&version=1.3.0&request=GetMetadata
    &item=layerDetails&layerName=mfwam/VHM0
```

| 字段 | 用途 |
|------|------|
| `scaleRange` | 写入 `colorMin` / `colorMax` |
| `units` | 图例单位 |
| `palettes` | 填充色板下拉列表 |
| `defaultPalette` | 默认色板 |
| `nearestTimeIso` | 默认时间步 |

**GEBCO 例外**：不用元数据范围，用代码常量：

```ts
const GEBCO_SCALE: [number, number] = [-8000, 5000]
const GEBCO_PALETTE = 'div-RdBu'
```

### 6.9 图例请求

与地图完全一致，使用相同 `styles` 和 `colorscalerange`：

```
GET /ncwms2/wms?service=WMS&version=1.3.0&request=GetLegendGraphic
&layers=gebco/elevation
&styles=raster/seq-OrRd
&colorscalerange=-8000,5000
&NUMCOLORBANDS=20
&width=24&height=160&format=image/png
```

对应代码：`legendUrl` computed。

### 6.10 瓦片缓存刷新

`refreshLayer()` 开头执行 `layerVersion++`，URL 追加 `_v=N`，避免 Mapbox 复用旧配色瓦片。

---

## 七、GeoServer（IBCAO）

### 7.1 静态图层配置

在 `STATIC_LAYERS` 数组中，不经过 GetCapabilities：

```ts
{
  value: 'cite:ibcao_3413',
  label: 'IBCAO 北极海底地形（ibcao_3413）',
  dataset: 'ibcao',
  provider: 'geoserver',
  wmsStyle: 'ibcao_bathymetry',      // GeoServer 样式名
  imageSrs: 'EPSG:3413',
  imageBbox: '-4060480,-4060480,4060480,4060480',
  imageSize: [1024, 1024],
  imageCoords: IBCAO_3413_COORDS,    // 贴图四角
  forceImageOverlay: true,
}
```

### 7.2 WMS 请求示例

```
/geoserver/cite/wms?service=WMS&version=1.1.0&request=GetMap
&layers=cite%3Aibcao_3413
&styles=ibcao_bathymetry
&bbox=-4060480,-4060480,4060480,4060480
&width=1024&height=1024
&srs=EPSG:3413
&format=image/png&transparent=true
```

配色在 GeoServer 管理端改 SLD，前端不传 ncWMS 配色参数。

---

## 八、开发环境代理（CORS）

浏览器不允许 `localhost:5173` 直连 `192.168.1.17`，`vite.config.ts` 已配置：

```ts
server: {
  proxy: {
    '/geoserver': { target: 'http://192.168.1.17:8081', changeOrigin: true },
    '/ncwms2':   { target: 'http://192.168.1.17:8082', changeOrigin: true },
  },
},
```

页面内**必须用相对路径**：

```ts
const NCWMS_BASE = '/ncwms2/wms'
const GEOSERVER_WMS_BASE = '/geoserver/cite/wms'
```

修改 `vite.config.ts` 后必须**重启** `npm run dev`。

---

## 九、常见问题与排错

### Q1：页面空白 / Network 报 CORS

- [ ] 请求 URL 是否为 `/ncwms2/...`（不是 `http://192.168.1.17:...`）
- [ ] `vite.config.ts` 代理是否配置
- [ ] 修改代理后是否重启 dev server
- [ ] 内网 `8081`/`8082` 是否可达

### Q2：瓦片 400 / 地图无数据

- [ ] `bbox={bbox-epsg-3857}` 是否被编码（见 5.1）
- [ ] ncWMS 图层名是否含 `/`（如 `mfwam/VHM0`）
- [ ] 时序图层是否传了 `time` 参数

### Q3：改了色板但地图颜色不变（高频）

详见 [6.2 前端限制](#62-styles-参数格式与前端限制必读)。按顺序排查：

1. **是否点了「应用配色」**（仅改下拉不会刷新瓦片）
2. **Network 里 GetMap 是否含 `styles=raster/新色板名`**
3. **是否误用 `palette=` 参数**（本实例无效，必须用 `styles=raster/xxx`）
4. **色板名是否在服务端列表内**（见 [6.4 色板全表](#64-色板全表与视觉说明)）
5. **`layerVersion` 是否递增**（URL 应有 `_v=N`）
6. 用 **`seq-OrRd`** 测试（见 [6.6 推荐选用](#66-推荐选用速查)，对比最明显）

快速命令行验证（直连 ncWMS）：

```bash
# 应得到不同 MD5
curl -s "http://192.168.1.17:8082/ncwms2/wms?...&styles=raster/default&..." -o a.png
curl -s "http://192.168.1.17:8082/ncwms2/wms?...&styles=raster/seq-OrRd&..." -o b.png
md5 a.png b.png
```

### Q4：图例变了但地图没变

- 图例 `legendUrl` 随下拉**即时更新**（预览）
- 地图只有 `refreshLayer()` 后才更新
- 解决：点「应用配色」

### Q5：IBCAO 不显示 / 边缘圆弧

- [ ] 图层是否为 `cite:ibcao_3413`（不是 4326 瓦片版）
- [ ] `forceImageOverlay: true` 是否保留
- [ ] `imageCoords` 四角坐标是否正确
- [ ] WMS 请求是否 200 且返回 PNG
- [ ] 是否执行了 `fitIbcaoView()`

### Q6：配色与 godiva3 不一致

对比四项：`styles`、`colorscalerange`、`NUMCOLORBANDS`、`time`（时序图层）。  
godiva3 常用 `default-scalar/default` 样式族，本页默认 `raster/{palette}`。

---

## 十、常见改动任务

### 10.1 修改 GEBCO 默认配色

```ts
// test26.vue 顶部常量区
const GEBCO_SCALE: [number, number] = [-8000, 5000]
const GEBCO_PALETTE = 'div-RdBu'
```

### 10.2 覆盖某 ncWMS 图层的默认色标

在 `applyLayerScale()` 中加分支：

```ts
if (layerName === 'mfwam/VHM0') {
  applyScaleRange(0, 10, 'm')
  return
}
```

### 10.3 切换渲染样式（等值线等）

当前仅支持 `raster/{palette}`。若需等值填色，改 `buildNcwmsParams()`：

```ts
// 示例：等值填色（需服务端支持该 style）
`styles=colored_contours/default`,
```

### 10.4 新增 GeoServer 图层

1. 在 `STATIC_LAYERS` 添加 `LayerOption`
2. 在 `DATA_SOURCE_LABELS` 注册显示名
3. 在 `PREFERRED_LAYER` 注册默认要素
4. 极地/特殊投影需配置 `imageSrs` / `imageBbox` / `imageCoords`

### 10.5 新增 ncWMS 图层

一般**无需改代码**。确保 GetCapabilities 中图层 `queryable="1"` 且名称含 `/`。

### 10.6 改后端服务地址

| 环境 | 做法 |
|------|------|
| 开发 | 改 `vite.config.ts` 的 `target`，页面继续用 `/ncwms2/wms` |
| 生产 | Nginx 反代 `/ncwms2`、`/geoserver`，或改 `NCWMS_BASE` 为完整 URL + 服务端开 CORS |

---

## 十一、关键代码索引

| 功能 | 函数 / 变量 | 位置（test26.vue） |
|------|-------------|-------------------|
| 服务地址 | `NCWMS_BASE`、`GEOSERVER_WMS_BASE` | §一 |
| 图层列表 | `fetchCapabilities()` | §八 |
| 图层元数据 | `fetchLayerMeta()` | §八 |
| **ncWMS 配色参数** | `buildNcwmsParams()` | §九 |
| 色标范围 | `colorscalerange` computed | §六 |
| 色板状态 | `selectedPalette` | §六 |
| 应用配色 | `applyColorConfig()` | §十一 |
| 瓦片 URL | `buildTileWmsUrl()` | §九 |
| 单图 URL | `buildImageWmsUrl()` | §九 |
| 刷新图层 | `refreshLayer()` | §十 |
| 图例 URL | `legendUrl` computed | §六 |
| IBCAO 贴图坐标 | `IBCAO_3413_COORDS` | §四 |
| 静态图层 | `STATIC_LAYERS` | §四 |
| 路由 | `/test26`、`/ncwms` | `src/routers/index.ts` |
| Vite 代理 | `server.proxy` | `vite.config.ts` |
| Mapbox 底图 | `useMapbox()` | `src/composables/mapbox/useMapbox.ts` |

---

## 十二、生产环境部署

开发代理**仅**在 `npm run dev` 有效。上线任选其一：

1. **Nginx 反向代理**（推荐）

```nginx
location /ncwms2/ {
  proxy_pass http://192.168.1.17:8082/ncwms2/;
}
location /geoserver/ {
  proxy_pass http://192.168.1.17:8081/geoserver/;
}
```

2. **WMS 服务端配置 CORS**  
3. **前后端同域部署**

生产环境若不用反代，需把 `NCWMS_BASE` / `GEOSERVER_WMS_BASE` 改为实际可访问地址。

---

## 十三、接手检查清单

新同事接手时，建议逐项打勾：

- [ ] `npm run dev` 能打开 `/#/test26`
- [ ] GEBCO 图层能正常显示全球地形
- [ ] 色板改 `seq-OrRd` + 应用配色后地图明显变色
- [ ] Network 中 GetMap 含 `styles=raster/seq-OrRd`
- [ ] 右下角图例与地图颜色一致
- [ ] MFWAM 海浪图层能切换时间并刷新
- [ ] IBCAO 图层能显示北极菱形贴图
- [ ] 了解 `vite.config.ts` 代理与生产 Nginx 差异
- [ ] 读过本文 [6.1～6.6 配色限制与色板说明](#六ncwms-配色最重要)

---

## 十四、延伸阅读

| 文档 | 内容 |
|------|------|
| `ncWMS2_使用手册(1).md` | WMS 全参数、矢量箭头、动画 GIF、部署 |
| [Mapbox raster source](https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/#raster) | `{bbox-epsg-3857}` 瓦片 |
| [Mapbox image source](https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/#image) | IBCAO 贴图方案 |

---

*文档版本：与 test26.vue 配色修复（`styles=raster/色板名`）同步。如有接口变更，以实际 Network 请求为准。*
