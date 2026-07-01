import { PackingSmartCard } from '../components/PackingSmartCard'
import type { TripPageProps } from '../types/props'

export function Prep({ trip, members }: TripPageProps) {
  return (
    <div>
      <PackingSmartCard trip={trip} members={members} />
      <p>心願清單 — 即將推出</p>
    </div>
  )
}
