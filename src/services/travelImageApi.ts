export { buildImageKeyword } from '@/utils/travelNormalize'
import type { DetailedScenicSpot } from '@/types/travelTypes'

export interface ScenicImageResult {
  url: string
  source: string
  status: 'ok' | 'uncertain' | 'noReliableImage'
  relevanceScore: number
}

const imageCache = new Map<string, ScenicImageResult>()

const BLOCKED_URL_PATTERNS = /map|logo|icon|svg|placeholder|qr|avatar|banner|sprite|favicon/i

export function buildScenicImageKeyword(spot: Pick<DetailedScenicSpot, 'province' | 'city' | 'name' | 'spotType'>): string {
  const typeHint = spot.spotType === 'park' ? '公园'
    : spot.spotType === 'camping' ? '露营'
      : spot.spotType === 'lake' ? '湖泊'
        : spot.spotType === 'beach' ? '海滩'
          : spot.spotType === 'oldStreet' ? '古街'
            : spot.spotType === 'museum' ? '博物馆'
              : ''
  return [spot.province, spot.city, spot.name, typeHint, '景区'].filter(Boolean).join(' ')
}

export function isImageLikelyRelevant(params: {
  keyword: string
  spotName: string
  city?: string
  imageTitle?: string
  imageDescription?: string
  imageUrl?: string
}): { relevant: boolean; score: number } {
  const { keyword, spotName, city, imageTitle, imageDescription, imageUrl } = params
  const title = `${imageTitle || ''} ${imageDescription || ''} ${imageUrl || ''}`.toLowerCase()
  const url = (imageUrl || '').toLowerCase()

  if (BLOCKED_URL_PATTERNS.test(url) || BLOCKED_URL_PATTERNS.test(title)) {
    return { relevant: false, score: 0 }
  }

  const spotLower = spotName.toLowerCase()
  const cityLower = (city || '').toLowerCase()
  const kwParts = keyword.split(/\s+/).filter((p) => p.length >= 2)

  let score = 0
  if (spotLower && title.includes(spotLower)) score += 0.6
  if (cityLower && title.includes(cityLower)) score += 0.15
  if (spotLower && kwParts.some((p) => title.includes(p.toLowerCase()))) score += 0.2

  const hasSpotName = spotLower && (title.includes(spotLower) || kwParts.some((p) => p === spotName))
  const onlyCity = cityLower && title.includes(cityLower) && !hasSpotName
  if (onlyCity) score = Math.min(score, 0.35)

  return { relevant: score >= 0.5, score }
}

interface ImageHit {
  url: string
  title: string
  source: string
  trusted?: boolean
}

function commonsFileUrl(filename: string): string {
  const clean = filename.replace(/^File:/i, '').trim()
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(clean)}?width=1000`
}

/** 维基百科中文 REST 摘要图（命中率更高） */
async function searchWikipediaRest(spotName: string, city?: string): Promise<ImageHit | null> {
  const titles = [...new Set([
    spotName,
    city ? `${city}${spotName}` : '',
    spotName.replace(/(国家)?(风景名胜区|风景区|旅游区|度假区|景区|公园)$/g, ''),
  ].filter(Boolean))]

  for (const title of titles) {
    try {
      const url = `https://zh.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
      const res = await fetch(url)
      if (!res.ok) continue
      const data = await res.json() as {
        title?: string
        thumbnail?: { source?: string }
        originalimage?: { source?: string }
        type?: string
      }
      if (data.type === 'disambiguation') continue
      const img = data.originalimage?.source || data.thumbnail?.source
      if (!img) continue
      return { url: img, title: data.title || title, source: '维基百科', trusted: true }
    } catch {
      // next
    }
  }
  return null
}

/** 维基百科 query 主图兜底 */
async function searchWikipediaZh(spotName: string, city?: string): Promise<ImageHit | null> {
  const titles = [...new Set([
    spotName,
    city ? `${city}${spotName}` : '',
    spotName.replace(/(国家)?(风景名胜区|风景区|旅游区|度假区|景区|公园)$/g, ''),
  ].filter(Boolean))]

  for (const title of titles) {
    try {
      const url = `https://zh.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages|info&inprop=url&pithumbsize=1000&redirects=1&format=json&origin=*`
      const res = await fetch(url)
      if (!res.ok) continue
      const data = await res.json() as {
        query?: { pages?: Record<string, { title?: string; thumbnail?: { source?: string }; missing?: string }> }
      }
      const pages = data.query?.pages
      if (!pages) continue
      for (const page of Object.values(pages)) {
        if (page.missing != null) continue
        const img = page.thumbnail?.source
        if (!img) continue
        return { url: img, title: page.title || title, source: '维基百科', trusted: true }
      }
    } catch {
      // next
    }
  }
  return null
}

/** Wikidata P18 官方图（常见景区覆盖好） */
async function searchWikidataImage(spotName: string, city?: string): Promise<ImageHit | null> {
  const queries = [...new Set([spotName, city ? `${city}${spotName}` : ''].filter(Boolean))]
  for (const q of queries) {
    try {
      const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(q)}&language=zh&uselang=zh&limit=3&format=json&origin=*`
      const searchRes = await fetch(searchUrl)
      if (!searchRes.ok) continue
      const searchData = await searchRes.json() as {
        search?: Array<{ id: string; label?: string; description?: string }>
      }
      for (const entity of searchData.search || []) {
        const id = entity.id
        if (!id) continue
        const entityUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${id}&props=claims|labels&languages=zh&format=json&origin=*`
        const entityRes = await fetch(entityUrl)
        if (!entityRes.ok) continue
        const entityData = await entityRes.json() as {
          entities?: Record<string, {
            labels?: { zh?: { value?: string } }
            claims?: { P18?: Array<{ mainsnak?: { datavalue?: { value?: string } } }> }
          }>
        }
        const item = entityData.entities?.[id]
        const file = item?.claims?.P18?.[0]?.mainsnak?.datavalue?.value
        if (!file) continue
        const label = item?.labels?.zh?.value || entity.label || spotName
        return {
          url: commonsFileUrl(file),
          title: label,
          source: 'Wikidata',
          trusted: true,
        }
      }
    } catch {
      // next
    }
  }
  return null
}

async function searchOpenverse(keyword: string): Promise<ImageHit | null> {
  try {
    const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(keyword)}&page_size=5&license=cc0,by,by-sa`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json() as {
      results?: Array<{ title?: string; url?: string; thumbnail?: string }>
    }
    for (const item of data.results || []) {
      const imgUrl = item.url || item.thumbnail
      if (!imgUrl || BLOCKED_URL_PATTERNS.test(imgUrl)) continue
      return { url: imgUrl, title: item.title || keyword, source: 'Openverse' }
    }
    return null
  } catch {
    return null
  }
}

async function searchWikimediaOnce(keyword: string): Promise<ImageHit | null> {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(keyword)}&gsrnamespace=6&gsrlimit=8&prop=imageinfo|info&inprop=url&iiprop=url&iiurlwidth=1000&format=json&origin=*`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json() as {
      query?: { pages?: Record<string, { title?: string; imageinfo?: Array<{ thumburl?: string; url?: string }> }> }
    }
    const pages = data.query?.pages
    if (!pages) return null
    for (const page of Object.values(pages)) {
      const info = page.imageinfo?.[0]
      const imgUrl = info?.thumburl || info?.url
      if (imgUrl) return { url: imgUrl, title: page.title || keyword, source: 'Wikimedia', trusted: true }
    }
    return null
  } catch {
    return null
  }
}

function keywordVariants(spot: Pick<DetailedScenicSpot, 'province' | 'city' | 'name' | 'spotType' | 'imageKeyword'>, keyword: string): string[] {
  const name = spot.name || ''
  const city = spot.city || ''
  const province = spot.province || ''
  return [...new Set([
    keyword.trim(),
    spot.imageKeyword?.trim(),
    `${city} ${name}`,
    `${city}${name}`,
    `${name}`,
    `${city} ${name} 景区`,
    `${name} 风景`,
    `${province} ${name}`,
  ].filter((k): k is string => Boolean(k && k.trim())))]
}

async function searchCustomApi(keywords: string[]): Promise<Record<string, string> | null> {
  const apiUrl = import.meta.env.VITE_IMAGE_SEARCH_API_URL
  if (!apiUrl) return null
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords }),
    })
    if (!res.ok) return null
    return await res.json() as Record<string, string>
  } catch {
    return null
  }
}

export async function checkImageAvailable(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(true), 2500)
    const img = new Image()
    img.onload = () => {
      window.clearTimeout(timer)
      resolve(img.naturalWidth > 120 && img.naturalHeight > 80)
    }
    img.onerror = () => {
      window.clearTimeout(timer)
      resolve(false)
    }
    img.referrerPolicy = 'no-referrer'
    img.src = url
  })
}

function toResult(hit: ImageHit, spotName: string, city: string, keyword: string): ScenicImageResult | null {
  const check = isImageLikelyRelevant({
    keyword,
    spotName,
    city,
    imageTitle: hit.title,
    imageUrl: hit.url,
  })
  const nameHit = !!spotName && (
    hit.title.includes(spotName)
    || hit.title.includes(spotName.slice(0, Math.min(2, spotName.length)))
  )
  // 可信来源（维基/Wikidata）即使标题不完全匹配也放行
  if (!hit.trusted && check.score < 0.2 && !nameHit) return null
  return {
    url: hit.url,
    source: hit.source,
    status: check.score >= 0.7 || hit.trusted ? 'ok' : 'uncertain',
    relevanceScore: Math.max(check.score, hit.trusted ? 0.7 : 0, nameHit ? 0.55 : 0),
  }
}

export async function getScenicImage(
  spot: Pick<DetailedScenicSpot, 'province' | 'city' | 'name' | 'spotType' | 'imageKeyword'>,
): Promise<ScenicImageResult> {
  const keyword = spot.imageKeyword || buildScenicImageKeyword(spot)
  if (!keyword.trim() && !spot.name) {
    return { url: '', source: '', status: 'noReliableImage', relevanceScore: 0 }
  }
  const cacheKey = `${spot.city || ''}|${spot.name || ''}|${keyword}`
  if (imageCache.has(cacheKey)) return imageCache.get(cacheKey)!

  const variants = keywordVariants(spot, keyword)
  const accept = (hit: ImageHit | null, kw = keyword) => {
    if (!hit?.url) return null
    return toResult(hit, spot.name, spot.city || '', kw)
  }

  // 1) 自定义搜索 API
  const custom = await searchCustomApi(variants)
  if (custom) {
    for (const kw of variants) {
      const url = custom[kw]
      if (!url) continue
      const result: ScenicImageResult = {
        url,
        source: '网络搜索',
        status: 'ok',
        relevanceScore: 0.8,
      }
      imageCache.set(cacheKey, result)
      return result
    }
  }

  // 2) 维基百科 REST / query（常见景区命中高）
  if (spot.name) {
    const wikiRest = accept(await searchWikipediaRest(spot.name, spot.city))
    if (wikiRest) {
      imageCache.set(cacheKey, wikiRest)
      return wikiRest
    }
    const wiki = accept(await searchWikipediaZh(spot.name, spot.city))
    if (wiki) {
      imageCache.set(cacheKey, wiki)
      return wiki
    }
  }

  // 3) Wikidata 官方图
  if (spot.name) {
    const wd = accept(await searchWikidataImage(spot.name, spot.city))
    if (wd) {
      imageCache.set(cacheKey, wd)
      return wd
    }
  }

  // 4) Wikimedia Commons（可信源不再因预加载失败而丢弃）
  for (const variant of variants.slice(0, 5)) {
    const hit = await searchWikimediaOnce(variant)
    const result = accept(hit, variant)
    if (!result) continue
    imageCache.set(cacheKey, result)
    return result
  }

  // 5) Openverse
  for (const variant of variants.slice(0, 3)) {
    const hit = await searchOpenverse(variant)
    const result = accept(hit, variant)
    if (!result) continue
    // Openverse 再做一次可用性检查，失败则跳过
    const ok = await checkImageAvailable(result.url)
    if (!ok) continue
    imageCache.set(cacheKey, result)
    return result
  }

  const empty: ScenicImageResult = { url: '', source: '', status: 'noReliableImage', relevanceScore: 0 }
  imageCache.set(cacheKey, empty)
  return empty
}

export async function batchGetScenicImages(
  spots: Array<Pick<DetailedScenicSpot, 'province' | 'city' | 'name' | 'spotType' | 'imageKeyword'>>,
): Promise<Map<string, ScenicImageResult>> {
  const out = new Map<string, ScenicImageResult>()
  const queue = [...spots]
  const workers = Array.from({ length: Math.min(3, queue.length || 1) }, async () => {
    while (queue.length) {
      const spot = queue.shift()
      if (!spot) break
      const kw = spot.imageKeyword || buildScenicImageKeyword(spot)
      const result = await getScenicImage(spot)
      out.set(kw, result)
      // 同时按城市+名称索引，避免 keyword 不一致对不上
      out.set(`${spot.city}-${spot.name}`, result)
    }
  })
  await Promise.all(workers)
  return out
}

/** @deprecated use getScenicImage */
export async function getOnlineImage(keyword: string): Promise<string> {
  const r = await getScenicImage({ name: keyword, city: '', spotType: 'scenic', imageKeyword: keyword })
  return r.url
}

export async function getOnlineImages(keywords: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  await Promise.all(keywords.map(async (kw) => {
    out[kw] = await getOnlineImage(kw)
  }))
  return out
}

export const batchGetOnlineImages = getOnlineImages

export async function searchWikimediaImage(keyword: string): Promise<string | null> {
  const hit = await searchWikimediaOnce(keyword)
  return hit?.url || null
}
