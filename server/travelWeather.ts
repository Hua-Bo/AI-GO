import type { Request, Response } from 'express'
import { fetchTravelWeatherForecast } from '../src/services/travelWeatherCore'

export async function getTravelWeatherHandler(req: Request, res: Response) {
  try {
    const city = String(req.query.city || '').trim()
    const startDate = String(req.query.startDate || '').trim()
    const days = Number(req.query.days || 3)
    if (!city) {
      res.status(400).json({ code: 400, message: '缺少 city 参数', data: [] })
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      res.status(400).json({ code: 400, message: 'startDate 格式应为 YYYY-MM-DD', data: [] })
      return
    }
    const data = await fetchTravelWeatherForecast(city, startDate, Math.min(Math.max(days, 1), 16))
    res.json({ code: 0, message: 'ok', data })
  } catch (e) {
    res.status(500).json({
      code: 500,
      message: e instanceof Error ? e.message : '天气获取失败',
      data: [],
    })
  }
}
