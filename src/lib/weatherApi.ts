export interface HalfDayWeather {
  tempC: number
  rainProbability: number
}

export interface DayWeather {
  date: string
  am: HalfDayWeather
  pm: HalfDayWeather
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
    precipitation_probability: number[]
  }
}

function average(nums: number[]): number {
  return Math.round(nums.reduce((sum, n) => sum + n, 0) / nums.length)
}

export async function fetchWeather(
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

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
    if (!response.ok) return []

    const body = (await response.json()) as OpenMeteoResponse
    const hourly = body.hourly
    if (!hourly) return []

    const byDate = new Map<string, { hour: number; temp: number; rain: number }[]>()
    hourly.time.forEach((timestamp, i) => {
      const [date, time] = timestamp.split('T')
      const hour = Number(time.slice(0, 2))
      const entries = byDate.get(date) ?? []
      entries.push({ hour, temp: hourly.temperature_2m[i], rain: hourly.precipitation_probability[i] })
      byDate.set(date, entries)
    })

    const days: DayWeather[] = []
    for (const [date, entries] of byDate) {
      const amEntries = entries.filter((e) => e.hour < 12)
      const pmEntries = entries.filter((e) => e.hour >= 12)
      if (amEntries.length === 0 || pmEntries.length === 0) continue

      days.push({
        date,
        am: { tempC: average(amEntries.map((e) => e.temp)), rainProbability: Math.max(...amEntries.map((e) => e.rain)) },
        pm: { tempC: average(pmEntries.map((e) => e.temp)), rainProbability: Math.max(...pmEntries.map((e) => e.rain)) },
      })
    }

    return days.sort((a, b) => a.date.localeCompare(b.date))
  } catch {
    return []
  }
}
