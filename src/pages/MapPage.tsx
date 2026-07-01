import { useState, type FormEvent } from 'react'
import { searchPlaces, type PlaceResult } from '../lib/placesApi'
import { useItinerary } from '../hooks/useItinerary'
import type { TripPageProps } from '../types/props'

export function MapPage({ trip }: TripPageProps) {
  const { days, addStop } = useItinerary(trip.id, trip.start_date, trip.end_date)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [searching, setSearching] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const [addingIndex, setAddingIndex] = useState<number | null>(null)
  const [dayId, setDayId] = useState('')

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    setSearching(true)
    setHint(null)
    try {
      const found = await searchPlaces(query)
      setResults(found)
      setAddingIndex(null)
      if (found.length === 0) setHint('搵唔到相關地點')
    } finally {
      setSearching(false)
    }
  }

  async function handleAddToDay(place: PlaceResult) {
    if (!dayId) return
    await addStop(dayId, { title: place.name, placeName: place.address, lat: place.lat, lng: place.lng, time: null })
    setAddingIndex(null)
    setDayId('')
  }

  return (
    <div>
      <form onSubmit={handleSearch}>
        <label htmlFor="place-query">搜尋地點</label>
        <input id="place-query" value={query} onChange={(e) => setQuery(e.target.value)} required />
        <button type="submit" disabled={searching}>
          搜尋
        </button>
      </form>
      {hint && <p>{hint}</p>}
      <ul>
        {results.map((place, i) => (
          <li key={`${place.name}-${i}`}>
            <strong>{place.name}</strong>
            <span>{place.address}</span>
            {addingIndex === i ? (
              <>
                <label htmlFor={`day-select-${i}`}>加入邊一日</label>
                <select id={`day-select-${i}`} value={dayId} onChange={(e) => setDayId(e.target.value)}>
                  <option value="">請選擇</option>
                  {days.map((day) => (
                    <option key={day.id} value={day.id}>
                      {day.date}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => handleAddToDay(place)} disabled={!dayId}>
                  確認加入
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setAddingIndex(i)}>
                加入邊一日
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
