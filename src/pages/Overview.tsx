import { useState } from 'react'
import { PlaneTakeoff } from 'lucide-react'
import { HeroCard } from '../components/HeroCard'
import { FlightCard } from '../components/FlightCard'
import { AddFlightModal } from '../components/AddFlightModal'
import { SpendingSummaryCard } from '../components/SpendingSummaryCard'
import { TornEdgeDivider } from '../components/TornEdgeDivider'
import { useFlights } from '../hooks/useFlights'
import type { TripPageProps } from '../types/props'

export function Overview({ trip, members }: TripPageProps) {
  const { flights, addFlight } = useFlights(trip.id)
  const [showAddFlight, setShowAddFlight] = useState(false)

  return (
    <div>
      <HeroCard trip={trip} members={members} />

      <section>
        <h2 className="sec-title">
          <PlaneTakeoff size={18} aria-hidden="true" />
          航班
        </h2>
        {flights.length === 0 && (
          <p className="sec-empty">尚未加入航班，加入後會自動辨識目的地與插畫。</p>
        )}
        {flights.map((flight) => (
          <FlightCard key={flight.id} flight={flight} />
        ))}
        <button type="button" className="sec-add" onClick={() => setShowAddFlight(true)}>
          ＋加入航班
        </button>
      </section>

      {showAddFlight && (
        <AddFlightModal
          members={members}
          onAdd={(input) => addFlight(input)}
          onClose={() => setShowAddFlight(false)}
        />
      )}

      <TornEdgeDivider />

      <SpendingSummaryCard trip={trip} members={members} />
    </div>
  )
}
