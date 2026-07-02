import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Sparkles, Store } from 'lucide-react'
import { uploadWishlistPhoto } from '../lib/photoRepo'
import { searchStoresForItem, type StoreSuggestion } from '../lib/storeSuggestApi'
import { useFlights } from '../hooks/useFlights'
import { getAirport, getAirportForCountry, getFirstFlightAirport } from '../lib/airports'
import { haversineDistanceKm } from '../lib/geo'
import { averageCoordinates } from '../lib/stopGeo'
import type { AddWishlistItemInput } from '../lib/wishlistRepo'
import type { ItineraryDay, Trip, TripMember } from '../types/models'

type StopGeo = { lat: number | null; lng: number | null }

const PRICE_LEVEL_LABEL: Record<string, string> = {
  PRICE_LEVEL_INEXPENSIVE: '平',
  PRICE_LEVEL_MODERATE: '中等',
  PRICE_LEVEL_EXPENSIVE: '貴',
  PRICE_LEVEL_VERY_EXPENSIVE: '好貴',
}

function priceLevelLabel(priceLevel: string | null): string | null {
  if (!priceLevel) return null
  return PRICE_LEVEL_LABEL[priceLevel] ?? priceLevel
}

interface AddWishlistFormProps {
  trip: Trip
  members: TripMember[]
  days: ItineraryDay[]
  stopsByDay?: Record<string, StopGeo[]>
  onAdd: (input: Omit<AddWishlistItemInput, 'tripId'>) => void
}

export function AddWishlistForm({ trip, members, days, stopsByDay = {}, onAdd }: AddWishlistFormProps) {
  const { flights } = useFlights(trip.id)
  const [name, setName] = useState('')
  const [buyAt, setBuyAt] = useState('')
  const [tip, setTip] = useState('')
  const [toMember, setToMember] = useState('自己')
  const [linkedDayId, setLinkedDayId] = useState('')
  const [dayComment, setDayComment] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadHint, setUploadHint] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<StoreSuggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [searchHint, setSearchHint] = useState<string | null>(null)

  // 就近配對：比對商店座標同每日景點平均座標，揀最近嗰日（AI 建議，可改）
  function suggestNearestDay(store: StoreSuggestion) {
    if (store.lat == null || store.lng == null) {
      setDayComment('AI：此商店未有座標，未能就近配對，請自行選擇日子。')
      return
    }
    let best: { id: string; date: string; km: number } | null = null
    for (const d of days) {
      const center = averageCoordinates(stopsByDay[d.id] ?? [])
      if (!center) continue
      const km = haversineDistanceKm({ lat: store.lat, lng: store.lng }, center)
      if (!best || km < best.km) best = { id: d.id, date: d.date, km }
    }
    if (!best) {
      setDayComment('AI：行程景點未有座標，未能就近配對，請自行選擇日子。')
      return
    }
    setLinkedDayId(best.id)
    setDayComment(`AI 建議：${best.date}（該日行程最就近，約 ${best.km.toFixed(1)} km），可自行更改`)
  }

  async function handleSearchStores() {
    if (!name.trim()) return
    const airport = trip.destination_country
      ? getAirportForCountry(trip.destination_country)
      : (() => {
          const airportCode = getFirstFlightAirport(flights)
          return airportCode ? getAirport(airportCode) : undefined
        })()
    if (!airport) {
      setSearchHint('未知目的地，未能搜尋')
      return
    }
    setSearching(true)
    setSearchHint(null)
    try {
      const results = await searchStoresForItem(name, airport.lat, airport.lng)
      setSuggestions(results)
      if (results.length === 0) {
        setSearchHint('找不到相關商店')
      } else if (!linkedDayId) {
        suggestNearestDay(results[0])
      }
    } finally {
      setSearching(false)
    }
  }

  function pickSuggestion(store: StoreSuggestion) {
    setBuyAt(store.name)
    const label = priceLevelLabel(store.priceLevel)
    if (label) setTip(`參考價位：${label}`)
    setSuggestions([])
    suggestNearestDay(store)
  }

  async function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadHint(null)
    try {
      setPhotoUrl(await uploadWishlistPhoto(trip.id, file))
    } catch {
      setUploadHint('上載失敗，請再試一次')
    } finally {
      setUploading(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({
      name,
      photoUrl,
      toMember: toMember || null,
      linkedDayId: linkedDayId || null,
      buyAt: buyAt || null,
      priceLo: null,
      priceHi: null,
      tip: tip || null,
    })
    setName('')
    setPhotoUrl(null)
    setToMember('自己')
    setLinkedDayId('')
    setDayComment(null)
    setBuyAt('')
    setTip('')
    setSuggestions([])
  }

  return (
    <form className="wl-form" onSubmit={handleSubmit}>
      <h3 className="wl-title">加入心願</h3>

      <div className="wl-field">
        <label htmlFor="wishlist-name">想買的東西</label>
        <div className="wl-name-row">
          <input id="wishlist-name" value={name} onChange={(e) => setName(e.target.value)} required />
          <button
            type="button"
            className="wl-ai"
            onClick={handleSearchStores}
            disabled={searching || !name.trim()}
          >
            <Sparkles size={13} aria-hidden="true" />
            {searching ? '搜尋中…' : 'AI 建議商店'}
          </button>
        </div>
      </div>

      {searchHint && <p className="wl-hint">{searchHint}</p>}
      {suggestions.length > 0 && (
        <ul className="wl-sugg" aria-label="商店建議">
          {suggestions.map((s, i) => (
            <li key={`${s.name}-${i}`}>
              <button type="button" onClick={() => pickSuggestion(s)}>
                <Store size={13} aria-hidden="true" />
                <span>
                  {s.name}
                  <small>
                    {s.address}
                    {priceLevelLabel(s.priceLevel) && ` · ${priceLevelLabel(s.priceLevel)}`}
                  </small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="wl-field">
        <label htmlFor="wishlist-buy-at">在哪裡買</label>
        <input id="wishlist-buy-at" value={buyAt} onChange={(e) => setBuyAt(e.target.value)} />
      </div>

      <div className="wl-field">
        <label htmlFor="wishlist-photo">相片</label>
        <input
          id="wishlist-photo"
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          disabled={uploading}
        />
        {uploadHint && <p className="wl-hint">{uploadHint}</p>}
        {photoUrl && <img className="wl-photo" src={photoUrl} alt="心願相片" />}
      </div>

      <div className="wl-field">
        <label htmlFor="wishlist-to-member">買給誰</label>
        <input
          id="wishlist-to-member"
          list="wishlist-recipients"
          value={toMember}
          onChange={(e) => setToMember(e.target.value)}
        />
        <datalist id="wishlist-recipients">
          <option value="自己" />
          {members.map((m) => (
            <option key={m.id} value={m.name} />
          ))}
        </datalist>
      </div>

      <div className="wl-field">
        <label htmlFor="wishlist-day">連結到哪一天行程</label>
        <select
          id="wishlist-day"
          value={linkedDayId}
          onChange={(e) => {
            setLinkedDayId(e.target.value)
            setDayComment(null)
          }}
        >
          <option value="">未連結（自行前往購買）</option>
          {days.map((d) => (
            <option key={d.id} value={d.id}>
              {d.date}
            </option>
          ))}
        </select>
        {dayComment && (
          <p className="wl-ai-comment">
            <Sparkles size={12} aria-hidden="true" />
            {dayComment}
          </p>
        )}
      </div>

      <button type="submit" className="wl-submit">
        加入心願
      </button>
    </form>
  )
}
