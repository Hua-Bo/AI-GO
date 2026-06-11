# test26 WMS 可视化 — 前端使用手册

> 对应页面：`src/views/testDemo/test26.vue`  
> 访问地址：`http://localhost:5173/#/test26` 或 `http://localhost:5173/#/ncwms`  
> 后端手册：`ncWMS2_使用手册(1).md`（服务端部署与 WMS 协议）

---

## 一、页面功能概览

本页面基于 **Mapbox GL** 叠加 **WMS 栅格图层**，支持多数据源切换：

| 数据源 | 服务 | 协议 | 配色方式 |
|--------|------|------|----------|
| MFWAM 海浪预报 | ncWMS2 `:8082` | WMS 1.3.0 | 前端传 `colorscalerange` + `palette` |
| GEBCO 海底地形 | ncWMS2 `:8082` | WMS 1.3.0 | 前端传配色参数（专用色板） |
| IBCAO 北极地形 | GeoServer `:8081` | WMS 1.1.0 + **EPSG:3413** | 服务端 SLD + 前端坐标转换贴图 |

---

## 二、快速上手

### 2.1 启动项目

```bash
npm run dev
```

浏览器打开 `http://localhost:5173/#/test26`。

### 2.2 面板操作

左上角 **可视化设置** 面板：

1. **数据源** — 选择数据集（海浪 / GEBCO / IBCAO）
2. **要素选择** — 选择具体 WMS 图层（如 `mfwam/VHM0`）
3. **时间选择** — 仅时序图层显示（如海浪预报）
4. **垂向分层** — 仅含 elevation 维度的图层显示
5. **投影选择** — 赤道瓦片 / 北极极地 / 南极极地

右下角 **ColorBar** 为色标图例（GeoServer 图层不显示，由服务端自带图例）。

---

## 三、架构说明

```
┌─────────────┐     GetCapabilities / GetMetadata      ┌──────────────┐
│  test26.vue │ ──────────────────────────────────────►│   ncWMS2     │
│  (Mapbox)   │     GetMap（瓦片/单图，含配色参数）      │  GeoServer   │
└─────────────┘ ◄────────────────────────────────────── └──────────────┘
       │
       │ 开发环境经 Vite 代理（避免 CORS）
       ▼
 /ncwms2/wms  →  http://192.168.1.17:8082/ncwms2/wms
 /geoserver/  →  http://192.168.1.17:8081/geoserver/
```

### 3.1 渲染模式

| 投影 | Mapbox 源类型 | WMS 坐标系 |
|------|---------------|------------|
| 赤道 EPSG:4326 | `raster` 瓦片 | EPSG:3857 + `{bbox-epsg-3857}` |
| 北极 EPSG:32661 | `image` 单图 | 投影坐标 bbox |
| 南极 EPSG:32761 | `image` 单图 | 投影坐标 bbox |

> **重要**：瓦片 URL 中 `bbox={bbox-epsg-3857}` 不能被 URL 编码，否则 Mapbox 无法替换占位符。

---

## 四、ncWMS 配色配置（核心）

ncWMS 采用 **服务端渲染配色**：颜色在 WMS 请求参数中指定，返回的 PNG 已着色，前端不做像素级上色。

### 4.1 三个核心参数

在 `buildNcwmsParams()` 中拼入 GetMap URL：

| 参数 | 说明 | 示例 |
|------|------|------|
| `colorscalerange` | 数值映射范围 `min,max` | `0,8`（波高）、`-8000,5000`（地形） |
| `palette` | ncWMS 内置色板名 | `default`、`div-RdBu` |
| `NUMCOLORBANDS` | 色带分段数，越大越平滑 | `20` |

完整请求示例（海浪有效波高）：

```
/ncwms2/wms?service=WMS&version=1.3.0&request=GetMap
&layers=mfwam/VHM0
&styles=raster/default
&format=image/png&transparent=true
&colorscalerange=0,8
&palette=default
&NUMCOLORBANDS=20
&crs=EPSG:3857
&bbox={bbox-epsg-3857}
&width=256&height=256
```

### 4.2 色标范围从哪来

切换图层时自动调用：

```
GET /ncwms2/wms?service=WMS&version=1.3.0&request=GetMetadata
    &item=layerDetails&layerName=mfwam/VHM0
```

返回 JSON 中的 `scaleRange` 写入 `colorMin` / `colorMax`，再传给 `colorscalerange`。

GEBCO 图层使用代码中手动配置的范围：

```ts
const GEBCO_SCALE = [-8000, 5000]
const GEBCO_PALETTE = 'div-RdBu'
```

### 4.3 可选色板列表

通过 `GetMetadata` 的 `palettes` 字段获取，常见值：

- `default` — 默认顺序色板（海浪常用）
- `div-RdBu` — 红蓝发散色板（地形常用）
- `seq-OrRd` — 橙红顺序色板
- `div-Spectral` — 光谱发散色板

完整列表以服务端返回为准。

### 4.4 其他可用配色参数（手册 5.3 节，当前未接入 UI）

| 参数 | 说明 |
|------|------|
| `LOGSCALE=true` | 对数色标 |
| `ABOVEMAXCOLOR` | 超上限颜色，如 `0xFF0000FF` |
| `BELOWMINCOLOR` | 低下限颜色，如 `0x0000FFFF` |
| `OPACITY` | 透明度 0–100 |

在 `buildNcwmsParams()` 中追加即可生效。

### 4.5 获取服务端图例

与地图配色完全一致：

```
GET /ncwms2/wms?service=WMS&version=1.3.0&request=GetLegendGraphic
&layers=mfwam/VHM0&styles=raster/default
&colorscalerange=0,8&NUMCOLORBANDS=20
&width=24&height=200&format=image/png
```

### 4.6 ColorBar 与 WMS 配色的关系

| 组件 | 作用 |
|------|------|
| WMS `palette` + `colorscalerange` | **真正决定地图颜色** |
| 页面 `ColorBar` | 仅展示近似图例，色带来自前端 `WAVE_PALETTE` / `BATHYMETRY_PALETTE` |

二者名称相近但独立；若需图例与地图完全一致，应使用 `GetLegendGraphic` 图片。

---

## 五、GeoServer（IBCAO）渲染与配色

### 5.1 为何不用 EPSG:3857 瓦片

北极数据若直接用 `ibcao_4326` + Web Mercator 瓦片，会在地图边缘产生**圆弧/扇贝形畸变**（投影不匹配）。

当前方案：使用原生 **`cite:ibcao_3413`（EPSG:3413 北极立体投影）** 请求单张 WMS 图，再将四角坐标转换到 WGS84，用 Mapbox `image` 源贴图。

### 5.2 WMS 请求

```
/geoserver/cite/wms?service=WMS&version=1.1.0&request=GetMap
&layers=cite%3Aibcao_3413
&styles=ibcao_bathymetry
&bbox=-4060480,-4060480,4060480,4060480
&width=800&height=800
&srs=EPSG:3413
&format=image/png&transparent=true
```

### 5.3 坐标转换（核心）

EPSG:3413 bbox 四角经 `gdaltransform` 转为 Mapbox `image` 源 `coordinates`（顺序：左上、右上、右下、左下）：

| 投影角 (x, y) | WGS84 [lng, lat] |
|---------------|------------------|
| (-4060480, 4060480) | [-180, 40.246] |
| (4060480, 4060480) | [90, 40.246] |
| (4060480, -4060480) | [0, 40.246] |
| (-4060480, -4060480) | [-90, 40.246] |

在地图上呈现为**菱形贴图**，覆盖北极区域，避免瓦片畸变。

### 5.4 配色

IBCAO **不传** ncWMS 配色参数，由 GeoServer `ibcao_bathymetry` SLD 控制。修改配色需在 GeoServer 管理端调整样式。

---

## 六、开发环境代理（CORS）

浏览器不允许 `localhost:5173` 直接请求 `192.168.1.17`，因此在 `vite.config.ts` 配置代理：

```ts
server: {
  proxy: {
    '/geoserver': { target: 'http://192.168.1.17:8081', changeOrigin: true },
    '/ncwms2':   { target: 'http://192.168.1.17:8082', changeOrigin: true },
  },
},
```

页面中使用相对路径：

```ts
const NCWMS_BASE = '/ncwms2/wms'
const GEOSERVER_WMS_BASE = '/geoserver/cite/wms'
```

修改 `vite.config.ts` 后需 **重启** `npm run dev`。

---

## 七、如何修改配色

### 7.1 修改海浪图层默认色标

在 `applyLayerScale()` 中，非 GEBCO 图层使用 `GetMetadata.scaleRange` 自动设置。若要覆盖某图层：

```ts
if (layerName === 'mfwam/VHM0') {
  applyScaleRange(0, 10, 'm')  // 手动改为 0~10
  return
}
```

### 7.2 修改 GEBCO 配色

编辑常量：

```ts
const GEBCO_SCALE = [-8000, 5000]   // 色标范围
const GEBCO_PALETTE = 'div-RdBu'    // 色板名
```

### 7.3 修改色带平滑度

在 `buildNcwmsParams()` 中修改：

```ts
'NUMCOLORBANDS=20',  // 改为 50 或 250
```

### 7.4 修改渲染样式

```ts
'styles=raster/default',           // 栅格平滑
// 或
'styles=default-scalar/default',   // 与 godiva3 一致
'styles=colored_contours/default', // 等值填色
```

### 7.5 强制刷新瓦片

`refreshLayer()` 中 `layerVersion++` 会在 URL 追加 `_v=N`，避免 Mapbox 缓存旧配色。

---

## 八、新增数据源

### 8.1 新增 ncWMS 图层

无需改代码，GetCapabilities 自动发现。确保图层名格式为 `dataset/variable` 且 `queryable="1"`。

### 8.2 新增 GeoServer 图层

在 `STATIC_LAYERS` 中添加：

```ts
{
  value: 'cite:your_layer',
  label: '显示名称',
  dataset: 'your_dataset',
  provider: 'geoserver',
  wmsStyle: 'your_style',
  imageBbox: '-180,60,180,90',      // 极地单图用
  imageCoords: [[-180,60],[180,60],[180,90],[-180,90]],
  viewCenter: [0, 75],
  viewZoom: 2,
}
```

并在 `DATA_SOURCE_LABELS` 和 `PREFERRED_LAYER` 中注册。

---

## 九、常见问题

### Q1：页面空白，Network 报 CORS 错误

- 确认 `vite.config.ts` 代理已配置
- 重启开发服务器
- 确认请求 URL 为 `/ncwms2/...` 而非 `http://192.168.1.17:...`

### Q2：瓦片 400 错误

- 检查 `bbox={bbox-epsg-3857}` 是否被编码为 `%7Bbbox-epsg-3857%7D`
- 必须用字符串拼接，不可用 `URLSearchParams` 处理 bbox

### Q3：配色与 godiva3 不一致

- 对比 `styles`、`colorscalerange`、`palette`、`NUMCOLORBANDS` 四个参数
- godiva3 默认用 `default-scalar/default` + `default` 色板 + 元数据 `scaleRange`

### Q4：切换图层后颜色没变

- 确认 `onFeatureChange` 调用了 `applyLayerScale` 和 `refreshLayer`
- 检查 `layerVersion` 是否递增

### Q5：IBCAO 地图边缘出现圆弧/圆孔

- 原因：曾用 EPSG:3857 瓦片渲染北极数据，投影不匹配
- 现用 `ibcao_3413` + EPSG:3413 单图 + `imageCoords` 坐标转换，应无此问题
- 确认图层为 `cite:ibcao_3413` 且 `forceImageOverlay: true`

---

## 十、关键代码索引

| 功能 | 函数 / 常量 | 文件位置 |
|------|-------------|----------|
| ncWMS 配色参数 | `buildNcwmsParams()` | test26.vue §九 |
| 色标范围 | `colorscalerange` computed | test26.vue §六 |
| 色板选择 | `wmsPalette` computed | test26.vue §六 |
| 元数据获取 | `fetchLayerMeta()` | test26.vue §八 |
| 瓦片 URL | `buildTileWmsUrl()` | test26.vue §九 |
| 图层刷新 | `refreshLayer()` | test26.vue §十 |
| Vite 代理 | `server.proxy` | vite.config.ts |

---

## 十一、生产环境部署注意

开发代理仅适用于 `npm run dev`。生产环境需任选其一：

1. **Nginx 反向代理** `/ncwms2` 和 `/geoserver` 到内网服务
2. **服务端开启 CORS** 响应头
3. **前后端同域部署**

并将 `NCWMS_BASE` / `GEOSERVER_WMS_BASE` 改为生产路径。
