export { buildImageKeyword } from '@/utils/travelNormalize'
import type { DetailedScenicSpot, SpotType } from '@/types/travelTypes'

export interface ScenicImageResult {
  url: string
  source: string
  status: 'ok' | 'uncertain' | 'noReliableImage'
  relevanceScore: number
}

const imageCache = new Map<string, ScenicImageResult>()

const BLOCKED_URL_PATTERNS = /map|logo|icon|svg|placeholder|qr|avatar|banner/i

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

interface WikiHit {
  url: string
  title: string
}

async function searchWikimediaOnce(keyword: string): Promise<WikiHit | null> {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(keyword)}&gsrnamespace=6&gsrlimit=5&prop=imageinfo|info&inprop=url&iiprop=url&iiurlwidth=800&format=json&origin=*`
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
      if (imgUrl) return { url: imgUrl, title: page.title || keyword }
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
    `${city} ${name} 景区`,
    `${city} ${name} 风景`,
    `${name} 旅游`,
    `${name} 门票`,
    `${city} 旅游景点`,
    `${province} ${city} ${name}`,
    `${name} 风景`,
    `${name} 景区`,
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
    const img = new Image()
    img.onload = () => resolve(img.naturalWidth > 240 && img.naturalHeight > 160)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

export async function getScenicImage(
  spot: Pick<DetailedScenicSpot, 'province' | 'city' | 'name' | 'spotType' | 'imageKeyword'>,
): Promise<ScenicImageResult> {
  const keyword = spot.imageKeyword || buildScenicImageKeyword(spot)
  if (!keyword.trim() && !spot.name) {
    return { url: '', source: '', status: 'noReliableImage', relevanceScore: 0 }
  }
  const cacheKey = keyword || `${spot.city}-${spot.name}`
  if (imageCache.has(cacheKey)) return imageCache.get(cacheKey)!

  const variants = keywordVariants(spot, keyword)
  const custom = await searchCustomApi(variants)
  if (custom) {
    for (const kw of variants) {
      const url = custom[kw]
      if (!url) continue
      const ok = await checkImageAvailable(url)
      if (!ok) continue
      const check = isImageLikelyRelevant({
        keyword: kw, spotName: spot.name, city: spot.city, imageUrl: url,
      })
      // 放宽：只要能加载且不是明显无关图标，就展示
      if (check.score >= 0.35 || ok) {
        const result: ScenicImageResult = {
          url,
          source: '网络搜索',
          status: check.score >= 0.7 ? 'ok' : 'uncertain',
          relevanceScore: check.score,
        }
        imageCache.set(cacheKey, result)
        return result
      }
    }
  }

  for (const variant of variants) {
    const hit = await searchWikimediaOnce(variant)
    if (!hit) continue
    const check = isImageLikelyRelevant({
      keyword: variant,
      spotName: spot.name,
      city: spot.city,
      imageTitle: hit.title,
      imageUrl: hit.url,
    })
    // 放宽阈值：优先展示，标为 uncertain 也可
    if (check.score >= 0.3 || (spot.name && (hit.title || '').includes(spot.name.slice(0, 2)))) {
      const result: ScenicImageResult = {
        url: hit.url,
        source: 'Wikimedia',
        status: check.score >= 0.7 ? 'ok' : 'uncertain',
        relevanceScore: check.score,
      }
      imageCache.set(cacheKey, result)
      return result
    }
  }

  // 最后再试一次纯景区名
  if (spot.name) {
    const hit = await searchWikimediaOnce(spot.name)
    if (hit) {
      const result: ScenicImageResult = {
        url: hit.url,
        source: 'Wikimedia',
        status: 'uncertain',
        relevanceScore: 0.4,
      }
      imageCache.set(cacheKey, result)
      return result
    }
  }

  const empty: ScenicImageResult = { url: '', source: '', status: 'noReliableImage', relevanceScore: 0 }
  imageCache.set(cacheKey, empty)
  return empty
}

export async function batchGetScenicImages(
  spots: Array<Pick<DetailedScenicSpot, 'province' | 'city' | 'name' | 'spotType' | 'imageKeyword'>>,
): Promise<Map<string, ScenicImageResult>> {
  const out = new Map<string, ScenicImageResult>()
  await Promise.all(spots.map(async (spot) => {
    const kw = spot.imageKeyword || buildScenicImageKeyword(spot)
    const result = await getScenicImage(spot)
    out.set(kw, result)
  }))
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
