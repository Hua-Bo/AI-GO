import type { DailyWeather } from '@/types/travelTypes'
import { fetchTravelWeatherForecast } from '@/services/travelWeatherCore'

export interface TravelWeatherRequest {
  city: string
  startDate: string
  days: number
}

export interface TravelWeatherResponse {
  code: number
  message: string
  data: DailyWeather[]
}

export async function getTravelWeather(params: TravelWeatherRequest): Promise<DailyWeather[]> {
  const query = new URLSearchParams({
    city: params.city,
    startDate: params.startDate,
    days: String(params.days),
  })
  try {
    const res = await fetch(`/api/travel/weather?${query}`)
    if (res.ok) {
      const json = await res.json() as TravelWeatherResponse
      if (json.code === 0 && Array.isArray(json.data) && json.data.length) {
        return json.data
      }
    }
  } catch {
    // GitHub Pages 等静态环境无后端，走直连
  }
  return fetchTravelWeatherForecast(params.city, params.startDate, params.days)
}
