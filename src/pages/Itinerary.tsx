import { useState, type FormEvent } from 'react'
import { useItinerary } from '../hooks/useItinerary'
import { useDestinationWeather } from '../hooks/useDestinationWeather'
import { DayTabs } from '../components/DayTabs'
import { WeatherCard } from '../components/WeatherCard'
import { googleMapsUrl } from '../lib/mapsLink'
import type { TripPageProps } from '../types/props'

export function Itinerary({ trip }: TripPageProps) {
  const { days, stopsByDay, loading, error, addStop, deleteStop } = useItinerary(
    trip.id,
    trip.start_date,
    trip.end_date,
  )
  const weatherByDate = useDestinationWeather(trip)
  const [activeDayId, setActiveDayId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [placeName, setPlaceName] = useState('')

  if (loading) return <p>載入緊…</p>
  if (error) return <p role="alert">{error}</p>
  if (days.length === 0) return <p>未有行程日子</p>

  const currentDayId = activeDayId ?? days[0].id
  const currentDay = days.find((d) => d.id === currentDayId) ?? days[0]
  const stops = stopsByDay[currentDayId] ?? []
  const weather = weatherByDate[currentDay.date] ?? null

  async function handleAddStop(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    await addStop(currentDayId, {
      title,
      time: time || null,
      placeName: placeName || null,
      lat: null,
      lng: null,
    })
    setTitle('')
    setTime('')
    setPlaceName('')
  }

  return (
    <div>
      <DayTabs days={days} activeDayId={currentDayId} onChange={setActiveDayId} />
      <WeatherCard weather={weather} />
      <ul>
        {stops.map((stop) => (
          <li key={stop.id}>
            {stop.time && <span>{stop.time} </span>}
            <span>{stop.title}</span>
            <a href={googleMapsUrl(stop)} target="_blank" rel="noreferrer">
              🧭
            </a>
            <button
              type="button"
              onClick={() => deleteStop(currentDayId, stop.id)}
              aria-label={`刪除 ${stop.title}`}
            >
              刪除
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleAddStop}>
        <label htmlFor="stop-title">景點名稱</label>
        <input id="stop-title" value={title} onChange={(e) => setTitle(e.target.value)} required />

        <label htmlFor="stop-time">時間</label>
        <input id="stop-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />

        <label htmlFor="stop-place">地點</label>
        <input id="stop-place" value={placeName} onChange={(e) => setPlaceName(e.target.value)} />

        <button type="submit">＋加入景點</button>
      </form>
    </div>
  )
}
