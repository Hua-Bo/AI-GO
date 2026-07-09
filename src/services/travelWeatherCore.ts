import type { DailyWeather } from '@/types/travelTypes'
import { BAD_WEATHER_KEYWORDS } from '@/types/travelTypes'

const WMO_LABELS: Record<number, string> = {
  0: '晴',
  1: '主要晴朗',
  2: '局部多云',
  3: '多云',
  45: '雾',
  48: '雾凇',
  51: '毛毛雨',
  53: '毛毛雨',
  55: '毛毛雨',
  56: '冻毛毛雨',
  57: '冻毛毛雨',
  61: '小雨',
  63: '中雨',
  65: '大雨',
  66: '冻雨',
  67: '冻雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  77: '雪粒',
  80: '阵雨',
  81: '阵雨',
  82: '暴雨',
  85: '阵雪',
  86: '暴雪',
  95: '雷雨',
  96: '雷阵雨',
  99: '雷阵雨伴冰雹',
}

export function addDaysToDate(dateStr: string, offset: number): string {
  const d = new Date(`${dateStr}T12:00:00`)
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

export function defaultTravelStartDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 10)
}

export function isBadWeather(weather: Pick<DailyWeather, 'weather' | 'warning' | 'tempMax'>): boolean {
  const text = `${weather.weather} ${weather.warning || ''}`
  if (BAD_WEATHER_KEYWORDS.some((k) => text.includes(k))) return true
  if (typeof weather.tempMax === 'number' && weather.tempMax >= 35) return true
  return false
}

export function buildTravelAdvice(weather: Pick<DailyWeather, 'weather' | 'tempMin' | 'tempMax' | 'precipitationProbability'>): string {
  const text = weather.weather
  const rainProb = weather.precipitationProbability ?? 0
  if (text.includes('暴雨') || text.includes('大雨') || text.includes('雷雨') || text.includes('雷阵雨')) {
    return '建议减少户外步行，优先安排室内景点，并预留交通缓冲时间。'
  }
  if (text.includes('雨') || rainProb >= 60) {
    return '建议随身带伞，优先选择室内或交通方便的景点。'
  }
  if (text.includes('雪') || text.includes('寒潮')) {
    return '注意保暖防滑，减少长时间户外停留，优先室内场所。'
  }
  if (text.includes('大风') || text.includes('台风')) {
    return '避免海边、山顶等开阔户外长时间停留，优先室内活动。'
  }
  if (typeof weather.tempMax === 'number' && weather.tempMax >= 35) {
    return '高温天气，减少暴晒与长时间户外徒步，多补水并安排午休。'
  }
  if (text.includes('晴') || text.includes('多云')) {
    return '天气较适宜户外活动，注意防晒与补水。'
  }
  return '出行前关注天气变化，合理安排室内外活动。'
}

function windLevelText(speedKmh: number): string {
  if (speedKmh < 12) return '微风'
  if (speedKmh < 20) return '3级风'
  if (speedKmh < 29) return '4级风'
  if (speedKmh < 39) return '5级风'
  return '6级及以上'
}

function wmoToLabel(code: number): string {
  return WMO_LABELS[code] || '多云'
}

async function geocodeCity(city: string): Promise<{ name: string; latitude: number; longitude: number }> {
  const q = city.trim().replace(/方向$|周边$/, '') || city.trim()
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=zh&format=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error('城市定位失败')
  const data = await res.json() as { results?: Array<{ name: string; latitude: number; longitude: number; admin1?: string }> }
  const hit = data.results?.[0]
  if (!hit) throw new Error(`未找到城市：${city}`)
  return { name: hit.admin1 ? `${hit.name}（${hit.admin1}）` : hit.name, latitude: hit.latitude, longitude: hit.longitude }
}

export async function fetchTravelWeatherForecast(city: string, startDate: string, days: number): Promise<DailyWeather[]> {
  const safeDays = Math.min(Math.max(days, 1), 16)
  const geo = await geocodeCity(city)
  const endDate = addDaysToDate(startDate, safeDays - 1)
  const params = new URLSearchParams({
    latitude: String(geo.latitude),
    longitude: String(geo.longitude),
    timezone: 'Asia/Shanghai',
    start_date: startDate,
    end_date: endDate,
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,relative_humidity_2m_mean',
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!res.ok) throw new Error('天气预报获取失败')
  const data = await res.json() as {
    daily?: {
      time?: string[]
      weather_code?: number[]
      temperature_2m_max?: number[]
      temperature_2m_min?: number[]
      precipitation_probability_max?: number[]
      wind_speed_10m_max?: number[]
      relative_humidity_2m_mean?: number[]
    }
  }
  const daily = data.daily
  if (!daily?.time?.length) throw new Error('天气预报数据为空')

  return daily.time.map((date, i) => {
    const code = daily.weather_code?.[i] ?? 3
    const weather = wmoToLabel(code)
    const tempMin = Math.round(daily.temperature_2m_min?.[i] ?? 18)
    const tempMax = Math.round(daily.temperature_2m_max?.[i] ?? 26)
    const precipitationProbability = daily.precipitation_probability_max?.[i]
    const windSpeed = daily.wind_speed_10m_max?.[i]
    const humidity = daily.relative_humidity_2m_mean?.[i]
    const item: DailyWeather = {
      date,
      city: geo.name,
      weather,
      tempMin,
      tempMax,
      wind: windSpeed != null ? windLevelText(windSpeed) : undefined,
      humidity: humidity != null ? `${Math.round(humidity)}%` : undefined,
      precipitationProbability: precipitationProbability != null ? Math.round(precipitationProbability) : undefined,
      travelAdvice: '',
    }
    if (isBadWeather(item)) {
      item.warning = `${weather}，出行需特别注意`
    }
    item.travelAdvice = buildTravelAdvice(item)
    return item
  })
}
