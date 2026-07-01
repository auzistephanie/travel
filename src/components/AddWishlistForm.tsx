import { useState, type ChangeEvent, type FormEvent } from 'react'
import { uploadWishlistPhoto } from '../lib/photoRepo'
import { searchStoresForItem, type StoreSuggestion } from '../lib/storeSuggestApi'
import { useFlights } from '../hooks/useFlights'
import { getAirport, getAirportForCountry, getFirstFlightAirport } from '../lib/airports'
import type { AddWishlistItemInput } from '../lib/wishlistRepo'
import type { ItineraryDay, Trip, TripMember } from '../types/models'

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
  onAdd: (input: Omit<AddWishlistItemInput, 'tripId'>) => void
}

export function AddWishlistForm({ trip, members, days, onAdd }: AddWishlistFormProps) {
  const { flights } = useFlights(trip.id)
  const [name, setName] = useState('')
  const [buyAt, setBuyAt] = useState('')
  const [tip, setTip] = useState('')
  const [toMember, setToMember] = useState('自己')
  const [linkedDayId, setLinkedDayId] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadHint, setUploadHint] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<StoreSuggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [searchHint, setSearchHint] = useState<string | null>(null)

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
      if (results.length === 0) setSearchHint('搵唔到相關商店')
    } finally {
      setSearching(false)
    }
  }

  function pickSuggestion(store: StoreSuggestion) {
    setBuyAt(store.name)
    const label = priceLevelLabel(store.priceLevel)
    if (label) setTip(`參考價位：${label}`)
    setSuggestions([])
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
    setBuyAt('')
    setTip('')
    setSuggestions([])
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="wishlist-name">想買嘅嘢</label>
      <input id="wishlist-name" value={name} onChange={(e) => setName(e.target.value)} required />
      <button type="button" onClick={handleSearchStores} disabled={searching || !name.trim()}>
        AI 搜尋邊度買
      </button>
      {searchHint && <p>{searchHint}</p>}
      {suggestions.length > 0 && (
        <ul aria-label="邊度買建議">
          {suggestions.map((s, i) => (
            <li key={`${s.name}-${i}`}>
              <button type="button" onClick={() => pickSuggestion(s)}>
                {s.name}（{s.address}
                {priceLevelLabel(s.priceLevel) && `，${priceLevelLabel(s.priceLevel)}`}）
              </button>
            </li>
          ))}
        </ul>
      )}

      <label htmlFor="wishlist-buy-at">邊度買</label>
      <input id="wishlist-buy-at" value={buyAt} onChange={(e) => setBuyAt(e.target.value)} />

      <label htmlFor="wishlist-photo">相片</label>
      <input
        id="wishlist-photo"
        type="file"
        accept="image/*"
        onChange={handlePhotoChange}
        disabled={uploading}
      />
      {uploadHint && <p>{uploadHint}</p>}
      {photoUrl && <img src={photoUrl} alt="心願相片" width={80} />}

      <label htmlFor="wishlist-to-member">買俾邊個</label>
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

      <label htmlFor="wishlist-day">連去邊一日行程</label>
      <select id="wishlist-day" value={linkedDayId} onChange={(e) => setLinkedDayId(e.target.value)}>
        <option value="">未連結（記得手動去買）</option>
        {days.map((d) => (
          <option key={d.id} value={d.id}>
            {d.date}
          </option>
        ))}
      </select>

      <button type="submit">加入心願</button>
    </form>
  )
}
