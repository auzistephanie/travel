import { warnApiFailure } from './apiWarn'

export interface HalfDayWeather {
  tempC: number
  rainProbability: number
}

export type WeatherSource = 'forecast' | 'climate'

export interface DayWeather {
  date: string
  am: HalfDayWeather
  pm: HalfDayWeather
  /** forecast = 真預報；climate = 歷年同期平均（出發日超出預報範圍時嘅 fallback）。 */
  source?: WeatherSource
}

const INDOOR_SUGGESTION_RAIN_THRESHOLD = 60

export function shouldSuggestIndoor(weather: DayWeather): boolean {
  return (
    weather.am.rainProbability >= INDOOR_SUGGESTION_RAIN_THRESHOLD ||
    weather.pm.rainProbability >= INDOOR_SUGGESTION_RAIN_THRESHOLD
  )
}

export function tripTemperatureRange(days: DayWeather[]): { min: number; max: number } | null {
  if (days.length === 0) return null
  const temps = days.flatMap((d) => [d.am.tempC, d.pm.tempC])
  return { min: Math.min(...temps), max: Math.max(...temps) }
}

const UMBRELLA_RAIN_THRESHOLD = 50

export function anyHalfDayRainAtLeast(days: DayWeather[], threshold = UMBRELLA_RAIN_THRESHOLD): boolean {
  return days.some((d) => d.am.rainProbability >= threshold || d.pm.rainProbability >= threshold)
}

interface OpenMeteoResponse {
  hourly?: {
    time: string[]
    temperature_2m: number[]
    precipitation_probability?: number[]
    precipitation?: number[]
  }
}

function average(nums: number[]): number {
  return Math.round(nums.reduce((sum, n) => sum + n, 0) / nums.length)
}

const FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast'
const ARCHIVE_ENDPOINT = 'https://archive-api.open-meteo.com/v1/archive'

// ⚠️ 2026-07-30：Open-Meteo 預報只覆蓋「過去約 92 日 ～ 未來 16 日」，再遠一定 HTTP 400
// （實測當日 allowed range = 2026-04-28 → 2026-08-14）。以前呢種情況靜默回 []，
// 即係提早一兩個月 plan 嗰陣天氣卡、自動衣物、雨具建議、雨天室內推介全部空白，仲要冇人知點解。
// 所以超出預報範圍改用 archive-api 嘅歷年同期平均，並喺 source 標明係平均而唔係預報。
const CLIMATE_FALLBACK_YEARS = 3
const WET_HOUR_MM = 0.1 // 一個鐘降雨量超過呢個數，就當嗰個鐘「落緊雨」

function toUTC(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function addDays(date: string, days: number): string {
  const d = toUTC(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

const MAX_TRIP_DAYS = 60 // 上限，防日期填錯（end < start 之類）時無限 loop

function listDates(startDate: string, endDate: string): string[] {
  const out: string[] = []
  let cur = startDate
  while (out.length < MAX_TRIP_DAYS && cur <= endDate) {
    out.push(cur)
    cur = addDays(cur, 1)
  }
  return out
}

// 2 月 29 號喺平年唔存在 —— 唔退做 28 號嘅話 archive 會 400。
function shiftYears(date: string, years: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const day = m === 2 && d === 29 ? 28 : d
  return `${y + years}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** 把 hourly 陣列切開每日上午/下午。rainAt 取當刻降雨值，rainReduce 決定點變成 0–100。 */
function aggregate(
  hourly: NonNullable<OpenMeteoResponse['hourly']>,
  rainAt: (index: number) => number | null,
  rainReduce: (rains: number[]) => number,
): Map<string, { am: HalfDayWeather; pm: HalfDayWeather }> {
  const byDate = new Map<string, { hour: number; temp: number; rain: number }[]>()

  hourly.time.forEach((timestamp, i) => {
    const rain = rainAt(i)
    const temp = hourly.temperature_2m[i]
    if (rain === null || !Number.isFinite(temp)) return
    const [date, time] = timestamp.split('T')
    const entries = byDate.get(date) ?? []
    entries.push({ hour: Number(time.slice(0, 2)), temp, rain })
    byDate.set(date, entries)
  })

  const out = new Map<string, { am: HalfDayWeather; pm: HalfDayWeather }>()
  for (const [date, entries] of byDate) {
    const amEntries = entries.filter((e) => e.hour < 12)
    const pmEntries = entries.filter((e) => e.hour >= 12)
    if (amEntries.length === 0 || pmEntries.length === 0) continue

    out.set(date, {
      am: { tempC: average(amEntries.map((e) => e.temp)), rainProbability: rainReduce(amEntries.map((e) => e.rain)) },
      pm: { tempC: average(pmEntries.map((e) => e.temp)), rainProbability: rainReduce(pmEntries.map((e) => e.rain)) },
    })
  }
  return out
}

const maxRain = (rains: number[]) => Math.max(...rains)
const wetHourRatio = (rains: number[]) =>
  Math.round((100 * rains.filter((mm) => mm > WET_HOUR_MM).length) / rains.length)

/** 歷年同期平均：逐年攞返同一段日子，再按「行程第幾日」對齊（跨年行程都唔會錯位）。 */
async function fetchClimateAverage(
  lat: number,
  lng: number,
  startDate: string,
  endDate: string,
): Promise<DayWeather[]> {
  const tripDates = listDates(startDate, endDate)
  if (tripDates.length === 0) return []

  const buckets = tripDates.map(() => ({ amT: [] as number[], amR: [] as number[], pmT: [] as number[], pmR: [] as number[] }))
  let yearsUsed = 0

  for (let back = 1; back <= CLIMATE_FALLBACK_YEARS; back++) {
    const histStart = shiftYears(startDate, -back)
    const histEnd = addDays(histStart, tripDates.length - 1)
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      hourly: 'temperature_2m,precipitation',
      start_date: histStart,
      end_date: histEnd,
      timezone: 'auto',
    })

    try {
      const response = await fetch(`${ARCHIVE_ENDPOINT}?${params.toString()}`)
      if (!response.ok) {
        warnApiFailure('weatherApi/archive', `HTTP ${response.status}`)
        continue
      }
      const body = (await response.json()) as OpenMeteoResponse
      if (!body.hourly) continue

      const precipitation = body.hourly.precipitation
      const days = aggregate(body.hourly, (i) => (precipitation ? precipitation[i] : null), wetHourRatio)

      listDates(histStart, histEnd).forEach((histDate, i) => {
        const day = days.get(histDate)
        const bucket = buckets[i]
        if (!day || !bucket) return
        bucket.amT.push(day.am.tempC)
        bucket.amR.push(day.am.rainProbability)
        bucket.pmT.push(day.pm.tempC)
        bucket.pmR.push(day.pm.rainProbability)
      })
      yearsUsed += 1
    } catch (error) {
      warnApiFailure('weatherApi/archive', error)
    }
  }

  if (yearsUsed === 0) return []

  return tripDates
    .map((date, i): DayWeather | null => {
      const b = buckets[i]
      if (b.amT.length === 0 || b.pmT.length === 0) return null
      return {
        date,
        source: 'climate' as const,
        am: { tempC: average(b.amT), rainProbability: average(b.amR) },
        pm: { tempC: average(b.pmT), rainProbability: average(b.pmR) },
      }
    })
    .filter((day): day is DayWeather => day !== null)
}

// 實測：Itinerary 一次載入，useDestinationWeather 會觸發 4 次，
// 即係 4 次 forecast ＋ 最多 12 次 archive。兩個都係免費公共 API，唔應該咁樣扑。
// 同 placesApi 一樣用 module-level cache（同一段行程一個 session 內只打一次）。
const weatherCache = new Map<string, Promise<DayWeather[]>>()

export function fetchWeather(
  lat: number,
  lng: number,
  startDate: string,
  endDate: string,
): Promise<DayWeather[]> {
  const cacheKey = `${lat}|${lng}|${startDate}|${endDate}`
  const cached = weatherCache.get(cacheKey)
  if (cached) return cached

  const pending = requestWeather(lat, lng, startDate, endDate)
  weatherCache.set(cacheKey, pending)
  // 攞唔到嘢就唔好記住個空結果，等下次（例如網絡返嚟）可以再試
  pending.then((days) => {
    if (days.length === 0) weatherCache.delete(cacheKey)
  })
  return pending
}

async function requestWeather(
  lat: number,
  lng: number,
  startDate: string,
  endDate: string,
): Promise<DayWeather[]> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    hourly: 'temperature_2m,precipitation_probability',
    start_date: startDate,
    end_date: endDate,
    timezone: 'auto',
  })

  let forecast: DayWeather[] = []
  try {
    const response = await fetch(`${FORECAST_ENDPOINT}?${params.toString()}`)
    if (response.ok) {
      const body = (await response.json()) as OpenMeteoResponse
      if (body.hourly) {
        const probability = body.hourly.precipitation_probability
        const days = aggregate(body.hourly, (i) => (probability ? probability[i] : null), maxRain)
        forecast = [...days.entries()]
          .map(([date, half]) => ({ date, source: 'forecast' as const, ...half }))
          .sort((a, b) => a.date.localeCompare(b.date))
      }
    } else {
      // 400 通常就係「出發日超出預報範圍」，唔算故障，下面會轉歷年平均。
      warnApiFailure('weatherApi', `HTTP ${response.status}`)
    }
  } catch (error) {
    warnApiFailure('weatherApi', error)
  }

  if (forecast.length > 0) return forecast
  return fetchClimateAverage(lat, lng, startDate, endDate)
}
