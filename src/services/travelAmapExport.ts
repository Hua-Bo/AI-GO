import { ElMessage } from 'element-plus'
import { downloadBlob, safeFileName } from '@/services/travelExportApi'
import type { DetailedTravelGuide } from '@/types/travelTypes'

export interface AmapRoutePoint {
  day: number
  name: string
  address: string
  city: string
  type: string
  note: string
  lon?: number
  lat?: number
}

const geocodeCache = new Map<string, { lon: number; lat: number; label: string } | null>()

async function geocodePlace(query: string): Promise<{ lon: number; lat: number; label: string } | null> {
  const q = query.trim().replace(/\s+/g, ' ')
  if (!q) return null
  if (geocodeCache.has(q)) return geocodeCache.get(q) || null
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=zh&format=json`
    const res = await fetch(url)
    if (!res.ok) {
      geocodeCache.set(q, null)
      return null
    }
    const data = await res.json() as {
      results?: Array<{ name: string; latitude: number; longitude: number; admin1?: string; country?: string }>
    }
    const hit = data.results?.[0]
    if (!hit) {
      geocodeCache.set(q, null)
      return null
    }
    const result = {
      lon: hit.longitude,
      lat: hit.latitude,
      label: hit.admin1 ? `${hit.name}（${hit.admin1}）` : hit.name,
    }
    geocodeCache.set(q, result)
    return result
  } catch {
    geocodeCache.set(q, null)
    return null
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function escapeCsv(text: string): string {
  const s = String(text || '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/** 从攻略提取有序途经点（按天） */
export function collectAmapRoutePoints(guide: DetailedTravelGuide): AmapRoutePoint[] {
  const points: AmapRoutePoint[] = []
  const seen = new Set<string>()

  const push = (p: Omit<AmapRoutePoint, 'day'> & { day: number }) => {
    const key = `${p.day}-${p.name}-${p.city}`
    if (!p.name.trim() || seen.has(key)) return
    seen.add(key)
    points.push(p)
  }

  if (guide.meetingPlan?.meetingPlaceName) {
    push({
      day: 1,
      name: guide.meetingPlan.meetingPlaceName,
      address: guide.meetingPlan.meetingPlaceAddress || `${guide.meetingPlan.meetingCity}${guide.meetingPlan.meetingPlaceName}`,
      city: guide.meetingPlan.meetingCity || '',
      type: '集合点',
      note: '多出发地集合',
    })
  }

  for (const day of guide.dailyPlans || []) {
    for (const spot of day.scenicSpots || []) {
      push({
        day: day.day,
        name: spot.name,
        address: spot.address || `${spot.province || ''}${spot.city || ''}${spot.name}`,
        city: spot.city || day.endCity || '',
        type: '景区',
        note: spot.reason || day.title || '',
      })
    }

    for (const item of day.timeline || []) {
      if (!['scenic', 'food', 'hotel', 'meeting'].includes(item.type)) continue
      const location = item.location || item.title
      if (!location) continue
      push({
        day: day.day,
        name: item.title || location,
        address: `${item.city || day.endCity || ''}${location}`,
        city: item.city || day.endCity || '',
        type: item.type === 'food' ? '餐饮' : item.type === 'hotel' ? '住宿' : item.type === 'meeting' ? '集合' : '行程点',
        note: item.description || '',
      })
    }

    if (day.hotelSuggestion?.needed && day.hotelSuggestion.city) {
      push({
        day: day.day,
        name: `${day.hotelSuggestion.city}${day.hotelSuggestion.area || ''}住宿`,
        address: `${day.hotelSuggestion.city}${day.hotelSuggestion.area || ''}`,
        city: day.hotelSuggestion.city,
        type: '住宿',
        note: day.hotelSuggestion.reason || '',
      })
    }
  }

  return points
}

async function hydrateCoordinates(points: AmapRoutePoint[]): Promise<AmapRoutePoint[]> {
  const out: AmapRoutePoint[] = []
  for (const p of points) {
    const queries = [
      `${p.city}${p.name}`,
      p.name,
      p.city,
    ].filter(Boolean)
    let geo: { lon: number; lat: number; label: string } | null = null
    for (const q of queries) {
      geo = await geocodePlace(q)
      if (geo) break
    }
    out.push(geo ? { ...p, lon: geo.lon, lat: geo.lat } : { ...p })
  }
  return out
}

/** 高德地图小程序批量导入兼容 CSV（名称/地址/经纬度） */
export function buildAmapImportCsv(points: AmapRoutePoint[], title: string): string {
  const header = ['名称', '地址', '经度', '纬度', '电话', '备注', '文件夹']
  const rows = points.map((p) => [
    p.name,
    p.address || `${p.city}${p.name}`,
    p.lon != null ? String(p.lon) : '',
    p.lat != null ? String(p.lat) : '',
    '',
    `第${p.day}天 · ${p.type}${p.note ? ` · ${p.note}` : ''}`,
    `第${p.day}天`,
  ].map(escapeCsv).join(','))
  return `\ufeff${header.join(',')}\n${rows.join('\n')}\n# ${title}\n# 导入说明：打开 https://wia.amap.com → 创建/打开地图 → 批量导入 → 上传本 CSV（或同内容的 xlsx）\n`
}

export function buildAmapKml(points: AmapRoutePoint[], title: string): string {
  const withCoords = points.filter((p) => p.lon != null && p.lat != null)
  const placemarks = withCoords.map((p, i) => `
    <Placemark>
      <name>${escapeXml(`${i + 1}. ${p.name}`)}</name>
      <description>${escapeXml(`第${p.day}天 · ${p.type} · ${p.address}`)}</description>
      <Point><coordinates>${p.lon},${p.lat},0</coordinates></Point>
    </Placemark>`).join('')

  const lineCoords = withCoords.map((p) => `${p.lon},${p.lat},0`).join(' ')
  const line = withCoords.length >= 2 ? `
    <Placemark>
      <name>${escapeXml(title)}路线</name>
      <styleUrl>#routeLine</styleUrl>
      <LineString>
        <tessellate>1</tessellate>
        <coordinates>${lineCoords}</coordinates>
      </LineString>
    </Placemark>` : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(title)}</name>
    <description>由旅游规划助手导出，可上传到高德地图小程序（wia.amap.com）批量导入。数据来源若为 GPS 请选择谷歌/WGS84。</description>
    <Style id="routeLine">
      <LineStyle><color>ffd97700</color><width>4</width></LineStyle>
    </Style>
    ${placemarks}
    ${line}
  </Document>
</kml>`
}

export function buildAmapGpx(points: AmapRoutePoint[], title: string): string {
  const withCoords = points.filter((p) => p.lon != null && p.lat != null)
  const wpts = withCoords.map((p, i) => `
  <wpt lat="${p.lat}" lon="${p.lon}">
    <name>${escapeXml(`${i + 1}-${p.name}`)}</name>
    <desc>${escapeXml(`第${p.day}天 ${p.type} ${p.address}`)}</desc>
  </wpt>`).join('')
  const trkpts = withCoords.map((p) => `    <trkpt lat="${p.lat}" lon="${p.lon}"></trkpt>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="vue-map-sample-travel" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${escapeXml(title)}</name></metadata>
  ${wpts}
  <trk>
    <name>${escapeXml(title)}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`
}

function dayPoints(guide: DetailedTravelGuide, day: number): AmapRoutePoint[] {
  return collectAmapRoutePoints(guide).filter((p) => p.day === day)
}

/** 调起高德路径规划（起终点 + 最多 1 个途经点） */
export async function openAmapNavigationForDay(guide: DetailedTravelGuide, day: number): Promise<void> {
  ElMessage.info('正在匹配当天坐标…')
  const hydrated = await hydrateCoordinates(dayPoints(guide, day))
  if (!hydrated.length) {
    ElMessage.warning(`第 ${day} 天没有可导航地点`)
    return
  }

  const start = hydrated[0]
  const end = hydrated[hydrated.length - 1]
  const via = hydrated.length > 2 ? hydrated[Math.floor(hydrated.length / 2)] : null
  const from = start.lon != null && start.lat != null
    ? `${start.lon},${start.lat},${encodeURIComponent(start.name)}`
    : `,,${encodeURIComponent(start.name)}`
  const to = end.lon != null && end.lat != null
    ? `${end.lon},${end.lat},${encodeURIComponent(end.name)}`
    : `,,${encodeURIComponent(end.name)}`
  const viaParam = via
    ? (via.lon != null && via.lat != null
      ? `${via.lon},${via.lat},${encodeURIComponent(via.name)}`
      : `,,${encodeURIComponent(via.name)}`)
    : ''

  window.open(
    `https://uri.amap.com/navigation?from=${from}&to=${to}${viaParam ? `&via=${viaParam}` : ''}&mode=car&policy=0&src=travel_planner&callnative=1`,
    '_blank',
  )
  ElMessage.success(`已打开第 ${day} 天高德导航`)
}

export function openAmapImportPage() {
  window.open('https://wia.amap.com', '_blank')
}

/** 一键：导出高德可导入文件 */
export async function exportGuideToAmap(guide: DetailedTravelGuide): Promise<void> {
  if (!guide) {
    ElMessage.warning('请先生成攻略')
    return
  }

  ElMessage.info('正在整理途经点并匹配坐标…')
  const rawPoints = collectAmapRoutePoints(guide)
  if (!rawPoints.length) {
    ElMessage.warning('当前攻略没有可导出的地点')
    return
  }

  const points = await hydrateCoordinates(rawPoints)
  const title = guide.title || '旅游路线'
  const base = safeFileName(title)

  downloadBlob(
    new Blob([buildAmapImportCsv(points, title)], { type: 'text/csv;charset=utf-8' }),
    `${base}-高德导入.csv`,
  )
  downloadBlob(
    new Blob([buildAmapKml(points, title)], { type: 'application/vnd.google-earth.kml+xml;charset=utf-8' }),
    `${base}-高德路线.kml`,
  )
  downloadBlob(
    new Blob([buildAmapGpx(points, title)], { type: 'application/gpx+xml;charset=utf-8' }),
    `${base}-路线.gpx`,
  )

  const withCoords = points.filter((p) => p.lon != null).length
  ElMessage.success({
    message: `已下载 CSV / KML / GPX（${points.length} 个点，${withCoords} 个有坐标）。导入方法见攻略里的「导入高德导航」说明，或打开 wia.amap.com 批量导入。`,
    duration: 5000,
  })
}

