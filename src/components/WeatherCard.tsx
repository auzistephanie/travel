import type { DayWeather, HalfDayWeather } from '../lib/weatherApi'

function rainIcon(rainProbability: number): string {
  if (rainProbability >= 60) return '☔'
  if (rainProbability >= 30) return '🌦️'
  return '☀️'
}

function HalfDay({ label, data }: { label: string; data: HalfDayWeather }) {
  return (
    <div>
      <span>{label}</span>
      <span aria-hidden="true">{rainIcon(data.rainProbability)}</span>
      <span>{data.tempC}°C</span>
      <span>{data.rainProbability}%</span>
    </div>
  )
}

interface WeatherCardProps {
  weather: DayWeather | null
}

export function WeatherCard({ weather }: WeatherCardProps) {
  if (!weather) return null

  return (
    <section aria-label="天氣">
      <HalfDay label="上午" data={weather.am} />
      <HalfDay label="下午" data={weather.pm} />
    </section>
  )
}
