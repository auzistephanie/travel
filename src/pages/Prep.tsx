import { useState } from 'react'
import { CalendarDays, Heart, Store, Tag, Trash2, User } from 'lucide-react'
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
  const { days, stopsByDay } = useItinerary(trip.id, trip.start_date, trip.end_date)
  const countryCode = useDestinationCountry(trip)
  const [showAdd, setShowAdd] = useState(false)
  const [confirming, setConfirming] = useState<WishlistItem | null>(null)

  if (loading) return <p>載入中…</p>
  if (error) return <p role="alert">{error}</p>

  const dayById = new Map(days.map((d) => [d.id, d.date]))
  const boughtCount = items.filter((i) => i.bought).length
  const budget = items.reduce((sum, i) => sum + (i.price_hi ?? i.price_lo ?? 0), 0)

  function priceText(item: WishlistItem): string | null {
    if (item.price_lo != null && item.price_hi != null) {
      return `${item.price_lo.toLocaleString()}–${item.price_hi.toLocaleString()}`
    }
    if (item.price_hi != null) return `≤ ${item.price_hi.toLocaleString()}`
    if (item.price_lo != null) return `≥ ${item.price_lo.toLocaleString()}`
    return null
  }

  const addButton = (
    <button type="button" className="money-add" onClick={() => setShowAdd(true)}>
      ＋加心願
    </button>
  )

  return (
    <div>
      {items.length === 0 ? (
        <div className="wish-empty">
          <span className="we-ic">
            <Heart size={26} aria-hidden="true" />
          </span>
          <h3>還沒有心願</h3>
          <p>記低想買的東西、買給誰，買了會自動流入「手信」。</p>
          {addButton}
        </div>
      ) : (
        <>
          <div className="wish-summary">
            <Heart className="ws-bg" size={72} aria-hidden="true" />
            <div className="ws-label">心願清單</div>
            <div className="ws-amt">{items.length} 件</div>
            <div className="ws-sub">
              已買 {boughtCount}
              {budget > 0 && ` · 預算約 ${budget.toLocaleString()}`} · 買了自動入手信
            </div>
          </div>
          <ul className="wish-list">
            {items.map((item) => {
              const price = priceText(item)
              return (
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
                    <span className="wi-chips">
                      <span className="wchip">
                        <User size={10} aria-hidden="true" />買給：{item.to_member ?? '未指定'}
                      </span>
                      <span className="wchip">
                        <CalendarDays size={10} aria-hidden="true" />
                        {item.linked_day_id ? dayById.get(item.linked_day_id) : '未連結行程'}
                      </span>
                      {item.buy_at && (
                        <span className="wchip">
                          <Store size={10} aria-hidden="true" />
                          {item.buy_at}
                        </span>
                      )}
                      {price && (
                        <span className="wchip price">
                          <Tag size={10} aria-hidden="true" />
                          {price}
                        </span>
                      )}
                    </span>
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
              )
            })}
          </ul>
          {addButton}
        </>
      )}
      {showAdd && (
        <AddWishlistForm
          trip={trip}
          members={members}
          days={days}
          stopsByDay={stopsByDay}
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
