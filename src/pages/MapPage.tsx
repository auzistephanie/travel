import { useState, type FormEvent } from 'react'
import { Check, MapPin, Plus, Search } from 'lucide-react'
import { searchPlaces, type PlaceResult } from '../lib/placesApi'
import { useItinerary } from '../hooks/useItinerary'
import type { TripPageProps } from '../types/props'

export function MapPage({ trip }: TripPageProps) {
  const { days, addStop } = useItinerary(trip.id, trip.start_date, trip.end_date)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [searching, setSearching] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [addingIndex, setAddingIndex] = useState<number | null>(null)
  const [dayId, setDayId] = useState('')

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    setSearching(true)
    setHint(null)
    try {
      const found = await searchPlaces(query)
      setResults(found)
      setSearched(true)
      setAddingIndex(null)
      if (found.length === 0) setHint('找不到相關地點')
    } finally {
      setSearching(false)
    }
  }

  async function handleAddToDay(place: PlaceResult) {
    if (!dayId) return
    await addStop(dayId, {
      title: place.name,
      placeName: place.address,
      lat: place.lat,
      lng: place.lng,
      time: null,
    })
    setAddingIndex(null)
    setDayId('')
  }

  return (
    <div>
      <form className="map-search" onSubmit={handleSearch}>
        <label htmlFor="place-query" className="map-search-label">
          搜尋地點
        </label>
        <div className="map-search-bar">
          <Search size={16} aria-hidden="true" />
          <input
            id="place-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="例如：淺草寺、teamLab"
            required
          />
          <button type="submit" disabled={searching}>
            搜尋
          </button>
        </div>
      </form>

      {hint && <p className="map-hint">{hint}</p>}
      {!searched && !hint && (
        <p className="map-empty">搜尋想去的地點，一按即可加入行程某一天。</p>
      )}

      <ul className="place-list">
        {results.map((place, i) => (
          <li key={`${place.name}-${i}`} className="place-card">
            <div className="place-top">
              <span className="place-ic">
                <MapPin size={16} aria-hidden="true" />
              </span>
              <div className="place-info">
                <strong>{place.name}</strong>
                <span>{place.address}</span>
              </div>
            </div>
            {addingIndex === i ? (
              <div className="place-add-row">
                <label htmlFor={`day-select-${i}`}>加入哪一天</label>
                <select
                  id={`day-select-${i}`}
                  value={dayId}
                  onChange={(e) => setDayId(e.target.value)}
                >
                  <option value="">請選擇</option>
                  {days.map((day) => (
                    <option key={day.id} value={day.id}>
                      {day.date}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => handleAddToDay(place)} disabled={!dayId}>
                  <Check size={14} aria-hidden="true" />
                  確認加入
                </button>
              </div>
            ) : (
              <button type="button" className="place-add" onClick={() => setAddingIndex(i)}>
                <Plus size={14} aria-hidden="true" />
                加入哪一天
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
