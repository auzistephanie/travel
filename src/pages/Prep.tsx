import { useState } from 'react'
import { PackingSmartCard } from '../components/PackingSmartCard'
import { PackingChecklist } from '../components/PackingChecklist'
import { SubTabs } from '../components/SubTabs'
import { inclusiveDayCount } from '../lib/tripDays'
import type { TripPageProps } from '../types/props'

const TABS = [
  { id: 'packing', label: '行李' },
  { id: 'wishlist', label: '心願' },
]

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
      {subTab === 'wishlist' && <p>心願清單 — 即將推出</p>}
    </div>
  )
}
