import { PackingSmartCard } from '../components/PackingSmartCard'
import { PackingChecklist } from '../components/PackingChecklist'
import { inclusiveDayCount } from '../lib/tripDays'
import type { TripPageProps } from '../types/props'

export function Prep({ trip, members }: TripPageProps) {
  const dayCount = inclusiveDayCount(trip.start_date, trip.end_date)

  return (
    <div>
      <PackingSmartCard trip={trip} members={members} />
      <PackingChecklist tripId={trip.id} dayCount={dayCount} />
      <p>心願清單 — 即將推出</p>
    </div>
  )
}
