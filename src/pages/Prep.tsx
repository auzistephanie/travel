import { useState } from 'react'
import { PackingSmartCard } from '../components/PackingSmartCard'
import { PackingChecklist } from '../components/PackingChecklist'
import { SubTabs } from '../components/SubTabs'
import { AddWishlistForm } from '../components/AddWishlistForm'
import { ConfirmPurchaseCard } from '../components/ConfirmPurchaseCard'
import { useWishlist } from '../hooks/useWishlist'
import { useItinerary } from '../hooks/useItinerary'
import { inclusiveDayCount } from '../lib/tripDays'
import type { WishlistItem } from '../types/models'
import type { TripPageProps } from '../types/props'

const TABS = [
  { id: 'packing', label: '行李' },
  { id: 'wishlist', label: '心願' },
]

function WishlistView({ trip, members }: TripPageProps) {
  const { items, loading, error, addItem, deleteItem, confirmBought, undoBought } = useWishlist(trip.id)
  const { days } = useItinerary(trip.id, trip.start_date, trip.end_date)
  const [showAdd, setShowAdd] = useState(false)
  const [confirming, setConfirming] = useState<WishlistItem | null>(null)

  if (loading) return <p>載入緊…</p>
  if (error) return <p role="alert">{error}</p>

  const dayById = new Map(days.map((d) => [d.id, d.date]))

  return (
    <div>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.photo_url && <img src={item.photo_url} alt={item.name} width={60} />}
            <span>{item.name}</span>
            <span>買俾：{item.to_member ?? '未指定'}</span>
            <span>
              {item.linked_day_id ? dayById.get(item.linked_day_id) : '未連結行程（記得手動去買）'}
            </span>
            {item.bought ? (
              <button type="button" onClick={() => undoBought(item.id)}>
                撤銷買咗
              </button>
            ) : (
              <button type="button" onClick={() => setConfirming(item)}>
                ✓ 買咗
              </button>
            )}
            <button type="button" onClick={() => deleteItem(item.id)} aria-label={`刪除 ${item.name}`}>
              刪除
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setShowAdd(true)}>
        ＋加心願
      </button>
      {showAdd && (
        <AddWishlistForm
          trip={trip}
          members={members}
          days={days}
          onAdd={(input) => {
            addItem(input)
            setShowAdd(false)
          }}
        />
      )}
      {confirming && (
        <ConfirmPurchaseCard
          item={confirming}
          onConfirm={(actualStore, actualAmt) => {
            confirmBought(confirming, actualStore, actualAmt)
            setConfirming(null)
          }}
          onCancel={() => setConfirming(null)}
        />
      )}
    </div>
  )
}

export function Prep({ trip, members }: TripPageProps) {
  const [subTab, setSubTab] = useState('packing')
  const dayCount = inclusiveDayCount(trip.start_date, trip.end_date)

  return (
    <div>
      <SubTabs tabs={TABS} active={subTab} onChange={setSubTab} />
      {subTab === 'packing' && (
        <>
          <PackingSmartCard trip={trip} members={members} />
          <PackingChecklist tripId={trip.id} dayCount={dayCount} />
        </>
      )}
      {subTab === 'wishlist' && <WishlistView trip={trip} members={members} />}
    </div>
  )
}
