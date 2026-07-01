import { Cloud, CloudRain, Sun } from 'lucide-react'
import type { DayWeather, HalfDayWeather } from '../lib/weatherApi'

function RainIcon({ rainProbability }: { rainProbability: number }) {
  if (rainProbability >= 60) return <CloudRain size={18} aria-hidden="true" />
  if (rainProbability >= 30) return <Cloud size={18} aria-hidden="true" />
  return <Sun size={18} aria-hidden="true" />
}

function HalfDay({ label, data }: { label: string; data: HalfDayWeather }) {
  const rainy = data.rainProbability >= 60
  return (
    <div className={rainy ? 'weather-half is-rain' : 'weather-half'}>
      <span className="wh-ic">
        <RainIcon rainProbability={data.rainProbability} />
      </span>
      <div>
        <div className="wh-label">{label}</div>
        <span className="wh-temp">{data.tempC}°C</span>
      </div>
      <span className="wh-rain">{data.rainProbability}%</span>
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
