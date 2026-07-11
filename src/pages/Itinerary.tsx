import { useState, type FormEvent } from 'react'
import { MapPin, Navigation, Plus, Search, Trash2 } from 'lucide-react'
import { useItinerary } from '../hooks/useItinerary'
import { useDestinationWeather } from '../hooks/useDestinationWeather'
import { DayTabs } from '../components/DayTabs'
import { WeatherCard } from '../components/WeatherCard'
import { IndoorSuggestionCard } from '../components/IndoorSuggestionCard'
import { FacilityChips } from '../components/FacilityChips'
import { TransportSegment } from '../components/TransportSegment'
import { RouteOptimizationCard } from '../components/RouteOptimizationCard'
import { googleMapsUrl } from '../lib/mapsLink'
import { shouldSuggestIndoor } from '../lib/weatherApi'
import { averageCoordinates } from '../lib/stopGeo'
import { haversineDistanceKm } from '../lib/geo'
import { searchPlaces, type PlaceResult } from '../lib/placesApi'
import type { TripPageProps } from '../types/props'

export function Itinerary({ trip }: TripPageProps) {
  const { days, stopsByDay, loading, error, addStop, deleteStop, reorderStops, applyOrder } = useItinerary(
    trip.id,
    trip.start_date,
    trip.end_date,
  )
  const weatherByDate = useDestinationWeather(trip)
  const [activeDayId, setActiveDayId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [placeName, setPlaceName] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([])
  const [placeSearching, setPlaceSearching] = useState(false)
  const [placeHint, setPlaceHint] = useState<string | null>(null)

  if (loading) return <p>載入中…</p>
  if (error) return <p role="alert">{error}</p>
  if (days.length === 0) return <p>尚未安排行程日子</p>

  const currentDayId = activeDayId ?? days[0].id
  const currentDay = days.find((d) => d.id === currentDayId) ?? days[0]
  const stops = stopsByDay[currentDayId] ?? []
  const weather = weatherByDate[currentDay.date] ?? null
  const dayCenter = averageCoordinates(stops)
  const showIndoorSuggestion = weather != null && shouldSuggestIndoor(weather) && dayCenter != null

  function handleDrop(index: number) {
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderStops(currentDayId, draggedIndex, index)
    }
    setDraggedIndex(null)
  }

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

  async function handlePlaceSearch(e: FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setPlaceSearching(true)
    setPlaceHint(null)
    try {
      const found = await searchPlaces(query, trip.destination_country)
      setPlaceResults(found)
      if (found.length === 0) setPlaceHint('找不到相關地點')
    } finally {
      setPlaceSearching(false)
    }
  }

  async function addPlaceToDay(place: PlaceResult) {
    await addStop(currentDayId, {
      title: place.name,
      placeName: place.address,
      lat: place.lat,
      lng: place.lng,
      time: null,
    })
    setPlaceResults([])
    setQuery('')
  }

  function nearestKm(place: PlaceResult): number | null {
    if (place.lat == null || place.lng == null || !dayCenter) return null
    return haversineDistanceKm({ lat: place.lat, lng: place.lng }, dayCenter)
  }

  return (
    <div>
      <DayTabs days={days} activeDayId={currentDayId} onChange={setActiveDayId} />

      <div className="map-area" aria-label="地圖">
        <div className="map-canvas" aria-hidden="true">
          <svg viewBox="0 0 344 180" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <rect width="344" height="180" fill="#e7ecdf" />
            <g stroke="#cdd6c2" strokeWidth="6" fill="none">
              <path d="M-10 50 H360 M-10 110 H360 M60 -10 V200 M180 -10 V200 M280 -10 V200" />
            </g>
            <rect x="70" y="58" width="80" height="42" fill="#d7e0cb" />
            <rect x="190" y="112" width="70" height="52" fill="#d7e0cb" />
          </svg>
          <div className="map-note">
            <MapPin size={13} aria-hidden="true" />
            {stops.length} 個景點
          </div>
        </div>
        <form className="map-search" onSubmit={handlePlaceSearch}>
          <Search size={15} aria-hidden="true" />
          <input
            aria-label="搜尋地點加入今日"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋地點加入今日…"
          />
          <button type="submit" disabled={placeSearching}>
            搜尋
          </button>
        </form>
        {placeHint && <p className="map-hint">{placeHint}</p>}
        {placeResults.length > 0 && (
          <ul className="place-list">
            {placeResults.map((place, i) => {
              const km = nearestKm(place)
              return (
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
                  <div className="place-add-row">
                    {km != null && (
                      <span className="place-near">離今日行程約 {km.toFixed(1)} km</span>
                    )}
                    <button type="button" className="place-add" onClick={() => addPlaceToDay(place)}>
                      <Plus size={14} aria-hidden="true" />
                      加入今日
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <WeatherCard weather={weather} />
      {showIndoorSuggestion && dayCenter && (
        <IndoorSuggestionCard lat={dayCenter.lat} lng={dayCenter.lng} />
      )}
      <ul className="itinerary-list">
        {stops.map((stop, index) => {
          const next = stops[index + 1]
          const hasCoords = stop.lat != null && stop.lng != null
          const showTransport =
            next && hasCoords && next.lat != null && next.lng != null

          return (
            <li
              key={stop.id}
              className="stop-item"
              draggable
              onDragStart={() => setDraggedIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                handleDrop(index)
              }}
            >
              <span className="stop-num" aria-hidden="true">
                {index + 1}
              </span>
              <div className="stop-card">
                <div className="stop-top">
                  <div>
                    {stop.time && <div className="stop-time">{stop.time}</div>}
                    <h3 className="stop-name">{stop.title}</h3>
                  </div>
                  <a
                    className="stop-nav"
                    href={googleMapsUrl(stop)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`導航去 ${stop.title}`}
                  >
                    <Navigation size={12} aria-hidden="true" />
                    導航
                  </a>
                </div>
                <div className="stop-chips">
                  {hasCoords && <FacilityChips lat={stop.lat as number} lng={stop.lng as number} />}
                  <button
                    type="button"
                    className="stop-del"
                    onClick={() => deleteStop(currentDayId, stop.id)}
                    aria-label={`刪除 ${stop.title}`}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
              {showTransport && next && (
                <TransportSegment
                  from={{ lat: stop.lat as number, lng: stop.lng as number }}
                  to={{ lat: next.lat as number, lng: next.lng as number }}
                />
              )}
            </li>
          )
        })}
      </ul>
      <RouteOptimizationCard stops={stops} onApply={(newOrder) => applyOrder(currentDayId, newOrder)} />
      <form className="itinerary-form" onSubmit={handleAddStop}>
        <label htmlFor="stop-title">景點名稱</label>
        <input id="stop-title" value={title} onChange={(e) => setTitle(e.target.value)} required />

        <label htmlFor="stop-time">時間</label>
        <input id="stop-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />

        <label htmlFor="stop-place">地點</label>
        <input id="stop-place" value={placeName} onChange={(e) => setPlaceName(e.target.value)} />

        <button type="submit" className="itinerary-add">
          ＋加入景點
        </button>
      </form>
    </div>
  )
}
