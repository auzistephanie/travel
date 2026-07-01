import { useState, type ChangeEvent, type FormEvent } from 'react'
import { uploadWishlistPhoto } from '../lib/photoRepo'
import type { AddWishlistItemInput } from '../lib/wishlistRepo'
import type { ItineraryDay, TripMember } from '../types/models'

interface AddWishlistFormProps {
  tripId: string
  members: TripMember[]
  days: ItineraryDay[]
  onAdd: (input: Omit<AddWishlistItemInput, 'tripId'>) => void
}

export function AddWishlistForm({ tripId, members, days, onAdd }: AddWishlistFormProps) {
  const [name, setName] = useState('')
  const [toMember, setToMember] = useState('自己')
  const [linkedDayId, setLinkedDayId] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadHint, setUploadHint] = useState<string | null>(null)

  async function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadHint(null)
    try {
      setPhotoUrl(await uploadWishlistPhoto(tripId, file))
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
      buyAt: null,
      priceLo: null,
      priceHi: null,
      tip: null,
    })
    setName('')
    setPhotoUrl(null)
    setToMember('自己')
    setLinkedDayId('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="wishlist-name">想買嘅嘢</label>
      <input id="wishlist-name" value={name} onChange={(e) => setName(e.target.value)} required />

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
