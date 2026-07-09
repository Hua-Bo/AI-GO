import type { DetailedScenicSpot, DetailedTravelGuide } from '@/types/travelTypes'
import { SPOT_TYPE_LABELS } from '@/types/travelTypes'

const BASE_STYLE = `
body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;line-height:1.7;color:#1e293b;max-width:900px;margin:0 auto;padding:24px}
h1{font-size:28px;border-bottom:3px solid #2563eb;padding-bottom:12px}
h2{font-size:20px;color:#1e40af;margin-top:32px;border-left:4px solid #2563eb;padding-left:10px}
h3{font-size:16px;color:#334155;margin-top:20px}
h4{font-size:14px;margin:12px 0 6px}
p{margin:8px 0}
table{border-collapse:collapse;width:100%;margin:12px 0;font-size:13px}
th,td{border:1px solid #cbd5e1;padding:8px 10px;text-align:left}
th{background:#f1f5f9}
ul{margin:8px 0;padding-left:22px}
li{margin:4px 0}
.cover{text-align:center;padding:40px 0 32px;background:linear-gradient(135deg,#dbeafe,#e0f2fe);border-radius:12px;margin-bottom:24px}
.cover h1{border:none;font-size:32px}
.cover .sub{color:#64748b;font-size:16px}
.spot-card{border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin:14px 0;page-break-inside:avoid}
.spot-card img{width:100%;max-width:480px;height:auto;border-radius:8px;margin:8px 0;display:block}
.placeholder{border:1px dashed #cbd5e1;background:#f8fafc;color:#64748b;padding:24px;text-align:center;border-radius:8px;margin:8px 0}
.meta{color:#64748b;font-size:13px}
.tag{display:inline-block;background:#eff6ff;color:#1d4ed8;padding:2px 8px;border-radius:4px;font-size:12px;margin:2px}
.day-block{border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:16px 0;page-break-inside:avoid}
.timeline-item{margin:8px 0;padding:8px 12px;background:#f8fafc;border-radius:6px}
.cost-table td:last-child{font-weight:600}
`

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function isValidImageSrc(src?: string): boolean {
  if (!src) return false
  const t = src.trim()
  return Boolean(t) && t !== 'undefined' && t !== 'null'
}

function renderGuideImage(src?: string, title?: string) {
  if (!isValidImageSrc(src)) {
    return `<div class="placeholder"><strong>暂无可靠图片</strong><br/><span>${esc(title || '已避免展示不相关图片')}</span></div>`
  }
  return `<img src="${esc(src!)}" alt="${esc(title || '景区图片')}" />`
}

function renderScenicSpotHtml(s: DetailedScenicSpot) {
  const typeLabel = SPOT_TYPE_LABELS[s.spotType] || s.spotType
  const freeLabel = s.isFree ? '免费' : '收费'
  return `<div class="spot-card">${renderGuideImage(s.image, s.name)}
    <h4>${esc(s.name)}（${esc(s.city)}）</h4>
    <p><span class="tag">${esc(typeLabel)}</span> <span class="tag">${freeLabel}</span></p>
    <p>${esc(s.description || s.reason)}</p>
    <p>门票：${s.isFree ? '免费' : esc(s.ticketPrice)} · 时长：${esc(s.suggestedDuration)} · 最佳：${esc(s.bestVisitTime)}</p>
    ${(s.costTips || []).length ? `<p>费用提示：${esc(s.costTips.join('；'))}</p>` : ''}
    ${s.parkingInfo ? `<p>停车/交通：${esc(s.parkingInfo)}</p>` : ''}
    ${s.carAccess ? `<p>车辆可达：${s.carAccess.canDriveNear ? '可开到附近' : '需步行进入'}，停车距离 ${esc(s.carAccess.parkingDistance || '以现场为准')}，步行 ${esc(s.carAccess.walkingDistance || '以现场为准')}</p>` : ''}
    ${s.carAccess?.safetyNote ? `<p>安全提示：${esc(s.carAccess.safetyNote)}</p>` : ''}
    ${(s.suitableFor || []).length ? `<p>适合：${esc(s.suitableFor.join('、'))}</p>` : ''}
    ${(s.playRoute || []).length ? `<p>游玩路线：${esc(s.playRoute.join(' → '))}</p>` : ''}
    ${(s.mustSeePoints || []).length ? `<p>必看：${esc(s.mustSeePoints.join('、'))}</p>` : ''}
    ${(s.photoSpots || []).length ? `<p>拍照：${esc(s.photoSpots.join('、'))}</p>` : ''}
    ${(s.avoidPitfalls || []).length ? `<p>避坑：${esc(s.avoidPitfalls.join('；'))}</p>` : ''}
  </div>`
}

export function buildDetailedGuideBodyHtml(guide: DetailedTravelGuide): string {
  const sections: string[] = []

  sections.push(`<div class="cover">
    <h1>${esc(guide.title)}</h1>
    ${guide.subtitle ? `<p class="sub">${esc(guide.subtitle)}</p>` : ''}
    <p>${esc(guide.summary)}</p>
  </div>`)

  const bi = guide.basicInfo
  sections.push(`<h2>一、出行概览</h2>
    <table><tr><th>目的地</th><td>${esc(bi.destination)}</td><th>天数</th><td>${bi.travelDays} 天</td></tr>
    <tr><th>总人数</th><td>${bi.totalPeople} 人</td><th>预算</th><td>${esc(bi.budgetLevel)}</td></tr>
    <tr><th>节奏</th><td>${esc(bi.pace)}</td><th>主题</th><td>${esc((bi.themes || []).join('、'))}</td></tr>
    ${bi.travelDates ? `<tr><th>旅行日期</th><td colspan="3">${esc(bi.travelDates)}</td></tr>` : ''}
    ${bi.planMode ? `<tr><th>生成模式</th><td colspan="3">${esc(bi.planMode)}</td></tr>` : ''}</table>`)

  if (guide.weatherList?.length) {
    sections.push('<h2>每日天气概览</h2><table><tr><th>日期</th><th>天气</th><th>气温</th><th>出行建议</th></tr>')
    for (const w of guide.weatherList) {
      sections.push(`<tr><td>${esc(w.date)}</td><td>${esc(w.weather)}</td><td>${w.tempMin}-${w.tempMax}℃</td><td>${esc(w.travelAdvice)}</td></tr>`)
    }
    sections.push('</table>')
  }

  if (guide.departureOverview?.length) {
    sections.push('<h2>二、出发地与交通方式</h2><table><tr><th>出发地</th><th>人数</th><th>交通</th><th>角色</th><th>建议出发</th></tr>')
    for (const d of guide.departureOverview) {
      const tt = d.transportType === 'selfDriving'
        ? `自驾${d.carType === 'electric' ? '电车' : '油车'}` : d.transportType
      sections.push(`<tr><td>${esc(d.fromAddress)}</td><td>${d.peopleCount}</td><td>${tt}</td><td>${esc(d.roleInTrip)}</td><td>${esc(d.suggestedStartTime)}</td></tr>`)
    }
    sections.push('</table>')
  }

  if (guide.startPlan) {
    const sp = guide.startPlan
    sections.push(`<h2>三、出发方案</h2>
      <p>从 <strong>${esc(sp.fromAddress)}</strong> 出发，第一站 <strong>${esc(sp.firstStopCity)}</strong></p>
      <p>建议出发：${esc(sp.suggestedStartTime)}${sp.duration ? ` · 耗时 ${esc(sp.duration)}` : ''}${sp.distance ? ` · ${esc(sp.distance)}` : ''}</p>
      <p>费用：${esc(sp.costEstimate)}</p>
      <p>${esc(sp.routeDescription)}</p>`)
    if ((sp.transportTips || []).length) {
      sections.push('<ul>')
      for (const t of sp.transportTips) sections.push(`<li>${esc(t)}</li>`)
      sections.push('</ul>')
    }
  } else if (guide.meetingPlan) {
    const mp = guide.meetingPlan
    sections.push(`<h2>三、推荐集合点</h2>
      <p><strong>${esc(mp.meetingCity)}</strong> · ${esc(mp.meetingPlaceName)}</p>
      <p>地址：${esc(mp.meetingPlaceAddress || '—')}</p>
      <p>集合时间：<strong>${esc(mp.suggestedMeetingTime)}</strong></p>
      <p>${esc(mp.reason)}</p>`)
    if ((mp.whyNotOtherCities || []).length) {
      sections.push('<h4>为什么不选其他城市</h4><ul>')
      for (const w of mp.whyNotOtherCities) sections.push(`<li>${esc(w)}</li>`)
      sections.push('</ul>')
    }
    if (mp.parkingInfo) sections.push(`<p>停车：${esc(mp.parkingInfo)}</p>`)
    if (mp.publicTransportInfo) sections.push(`<p>公共交通：${esc(mp.publicTransportInfo)}</p>`)

    sections.push('<h3>各出发地到集合点</h3>')
    for (const r of mp.departureRoutes || []) {
      const c = r.costDetail
      sections.push(`<div class="day-block"><h4>${esc(r.fromAddress)} → ${esc(r.toMeetingPlace || r.toMeetingCity)}</h4>
        <p>出发 ${esc(r.suggestedStartTime)} · 预计到达 ${esc(r.estimatedArrivalTime)} · ${esc(r.duration)}${r.distance ? ` · ${esc(r.distance)}` : ''}</p>
        <p>${esc(r.routeDescription)}</p>
        <table class="cost-table"><tr><th>费用项</th><th>金额</th></tr>
        ${c.fuelCost ? `<tr><td>油费</td><td>${esc(c.fuelCost)}</td></tr>` : ''}
        ${c.chargingCost ? `<tr><td>充电费</td><td>${esc(c.chargingCost)}</td></tr>` : ''}
        ${c.highwayCost ? `<tr><td>高速费</td><td>${esc(c.highwayCost)}</td></tr>` : ''}
        ${c.trainTicket ? `<tr><td>高铁票</td><td>${esc(c.trainTicket)}</td></tr>` : ''}
        ${c.flightTicket ? `<tr><td>机票</td><td>${esc(c.flightTicket)}</td></tr>` : ''}
        ${c.taxiCost ? `<tr><td>打车</td><td>${esc(c.taxiCost)}</td></tr>` : ''}
        <tr><td><strong>合计</strong></td><td><strong>${esc(c.total)}</strong></td></tr></table>`)
      if ((r.routeSteps || []).length) {
        sections.push('<ul>')
        for (const step of r.routeSteps) sections.push(`<li>${esc(step)}</li>`)
        sections.push('</ul>')
      }
      if (r.chargingPlan?.needCharge) {
        sections.push(`<p>充电：${esc((r.chargingPlan.chargingTips || []).join('；'))}</p>`)
      }
      sections.push('</div>')
    }
  }

  const ro = guide.routeOverview
  sections.push(`<h2>四、总路线</h2><p><strong>${esc(ro.routeName)}</strong></p><p>${esc(ro.routeSummary)}</p>`)
  if ((ro.routeHighlights || []).length) {
    sections.push('<ul>')
    for (const h of ro.routeHighlights) sections.push(`<li>${esc(h)}</li>`)
    sections.push('</ul>')
  }

  sections.push('<h2>五、每日详细行程</h2>')
  for (const day of guide.dailyPlans || []) {
    sections.push(`<div class="day-block"><h3>第 ${day.day} 天：${esc(day.title)}</h3>`)
    if (day.weather) {
      sections.push(`<p><strong>天气：</strong>${esc(day.weather.weather)} ${day.weather.tempMin}-${day.weather.tempMax}℃${day.weather.wind ? `，${esc(day.weather.wind)}` : ''}${day.weather.precipitationProbability != null ? `，降雨概率 ${day.weather.precipitationProbability}%` : ''}</p>`)
      sections.push(`<p><strong>出行建议：</strong>${esc(day.weather.travelAdvice)}</p>`)
    }
    if (day.badWeatherAlternative) {
      sections.push(`<p><strong>恶劣天气备选：</strong>${esc(day.badWeatherAlternative)}</p>`)
    }
    sections.push(`<p>${esc(day.startCity)} → ${esc(day.endCity)} · 住宿：${esc(day.overnightCity)}</p>
      <p>${esc(day.daySummary)}</p>`)
    if (day.transportSummary?.routeDescription) {
      sections.push(`<p class="meta">交通：${esc(day.transportSummary.transportMode)} ${esc(day.transportSummary.routeDescription)}</p>`)
    }
    for (const item of day.timeline || []) {
      sections.push(`<div class="timeline-item"><strong>${esc(item.time)}</strong> [${item.type}] ${esc(item.title)}
        <p>${esc(item.description)}</p>
        ${item.cost ? `<p class="meta">费用：${esc(item.cost)}</p>` : ''}</div>`)
    }
    for (const s of day.scenicSpots || []) {
      sections.push(renderScenicSpotHtml(s))
    }
    if ((day.meals || []).length) {
      sections.push('<h4>餐饮</h4><ul>')
      for (const m of day.meals) {
        sections.push(`<li>${m.mealType}：${esc(m.recommendation)}（${esc(m.estimatedCost)}）${esc(m.reason)}</li>`)
      }
      sections.push('</ul>')
    }
    const h = day.hotelSuggestion
    if (h?.area) {
      if (h.needed === false || h.type === 'home') {
        sections.push(`<p>住宿安排：回家过夜</p><p>住宿费用：0元</p><p>说明：${esc(h.reason || '本日行程距离常住地较近，无需酒店。')}</p>`)
      } else {
        sections.push(`<p>住宿：${esc(h.city)} ${esc(h.area)} · ${esc(h.priceRange)} · ${esc(h.reason)}</p>`)
      }
    }
    const db = day.dayBudget
    if (db?.dayTotal) {
      sections.push(`<p><strong>当天预算：${esc(db.dayTotal)}</strong>（交通 ${esc(db.transport)} / 门票 ${esc(db.tickets)} / 餐饮 ${esc(db.food)} / 住宿 ${esc(db.hotel)}）</p>`)
    }
    if ((day.tips || []).length) {
      sections.push('<h4>提醒事项</h4><ul>')
      for (const t of day.tips) sections.push(`<li>${esc(t)}</li>`)
      sections.push('</ul>')
    }
    sections.push('</div>')
  }

  if (guide.scenicSpotSummary?.length) {
    sections.push('<h2>六、景区图文说明</h2>')
    for (const s of guide.scenicSpotSummary) {
      sections.push(renderScenicSpotHtml(s))
    }
  }

  if (guide.foodRecommendations?.length) {
    sections.push('<h2>七、餐饮建议</h2><table><tr><th>名称</th><th>城市</th><th>介绍</th><th>人均</th></tr>')
    for (const f of guide.foodRecommendations) {
      sections.push(`<tr><td>${esc(f.name)}</td><td>${esc(f.city)}</td><td>${esc(f.description)}</td><td>${esc(f.avgCost)}</td></tr>`)
    }
    sections.push('</table>')
  }

  if (guide.hotelSuggestions?.length) {
    sections.push('<h2>八、住宿建议</h2><ul>')
    for (const h of guide.hotelSuggestions) {
      sections.push(`<li>${esc(h.city)} ${esc(h.area)}：${esc(h.reason)} ${esc(h.priceRange)}</li>`)
    }
    sections.push('</ul>')
  }

  const b = guide.budgetDetail
  sections.push(`<h2>九、费用明细</h2>
    <p>人均约 <strong>${esc(b.perPersonEstimate)}</strong> · 总计约 <strong>${esc(b.totalEstimate)}</strong></p>
    <table class="cost-table"><tr><th>类别</th><th>项目</th><th>金额</th><th>说明</th></tr>`)
  for (const item of b.items || []) {
    sections.push(`<tr><td>${esc(item.category)}</td><td>${esc(item.name)}</td><td>${esc(item.amount)}</td><td>${esc(item.description)}</td></tr>`)
  }
  sections.push('</table>')
  if (guide.budgetReference) {
    sections.push(`<p>前端参考估算：<strong>${esc(guide.budgetReference.referenceEstimate)}</strong></p>`)
    sections.push(`<p class="meta">${esc(guide.budgetReference.reason)}</p>`)
  }
  if ((b.notes || []).length) {
    sections.push(`<p class="meta">${esc(b.notes.join('；'))}</p>`)
  }

  if ((guide.transportTips || []).length) {
    sections.push('<h2>十、注意事项</h2><ul>')
    for (const t of guide.transportTips) sections.push(`<li>${esc(t)}</li>`)
    sections.push('</ul>')
  }
  if ((guide.riskTips || []).length) {
    sections.push('<h2>避坑提醒</h2><ul>')
    for (const t of guide.riskTips) sections.push(`<li>${esc(t)}</li>`)
    sections.push('</ul>')
  }
  if ((guide.packingList || []).length) {
    sections.push(`<h2>十一、出行清单</h2><p>${esc(guide.packingList.join('、'))}</p>`)
  }

  return sections.join('')
}

export function buildDetailedGuideHtml(guide: DetailedTravelGuide): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(guide.title)}</title><style>${BASE_STYLE}</style></head><body>${buildDetailedGuideBodyHtml(guide)}</body></html>`
}
