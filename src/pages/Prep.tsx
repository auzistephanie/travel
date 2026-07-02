import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { PackingSmartCard } from '../components/PackingSmartCard'
import { PackingChecklist } from '../components/PackingChecklist'
import { SubTabs } from '../components/SubTabs'
import { AddWishlistForm } from '../components/AddWishlistForm'
import { ConfirmPurchaseCard } from '../components/ConfirmPurchaseCard'
import { DestinationIllustration } from '../components/DestinationIllustration'
import { StampBadge } from '../components/StampBadge'
import { useWishlist } from '../hooks/useWishlist'
import { useItinerary } from '../hooks/useItinerary'
import { useDestinationCountry } from '../hooks/useDestinationCountry'
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
  const countryCode = useDestinationCountry(trip)
  const [showAdd, setShowAdd] = useState(false)
  const [confirming, setConfirming] = useState<WishlistItem | null>(null)

  if (loading) return <p>載入中…</p>
  if (error) return <p role="alert">{error}</p>

  const dayById = new Map(days.map((d) => [d.id, d.date]))

  return (
    <div>
      <ul className="wish-list">
        {items.map((item) => (
          <li key={item.id} className={item.bought ? 'wish-item bought' : 'wish-item'}>
            <span className="wi-thumb">
              {item.photo_url ? (
                <img src={item.photo_url} alt={item.name} />
              ) : (
                <DestinationIllustration countryCode={countryCode} width={54} />
              )}
            </span>
            <span className="wi-main">
              <b>{item.name}</b>
              <small>買俾：{item.to_member ?? '未指定'}</small>
              <small className="wi-day">
                {item.linked_day_id ? dayById.get(item.linked_day_id) : '未連結行程（記得自行前往購買）'}
              </small>
            </span>
            <span className="wi-actions">
              {item.bought ? (
                <>
                  <StampBadge label="已買" />
                  <button type="button" className="wi-undo" onClick={() => undoBought(item.id)}>
                    取消已買
                  </button>
                </>
              ) : (
                <button type="button" className="wi-buy" onClick={() => setConfirming(item)}>
                  ✓ 已買
                </button>
              )}
              <button
                type="button"
                className="wi-del"
                onClick={() => deleteItem(item.id)}
                aria-label={`刪除 ${item.name}`}
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </span>
          </li>
        ))}
      </ul>
      <button type="button" className="money-add" onClick={() => setShowAdd(true)}>
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
