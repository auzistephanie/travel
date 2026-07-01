import { useState } from 'react'
import { HeroCard } from '../components/HeroCard'
import { FlightCard } from '../components/FlightCard'
import { AddFlightModal } from '../components/AddFlightModal'
import { useFlights } from '../hooks/useFlights'
import type { TripPageProps } from '../types/props'

export function Overview({ trip, members }: TripPageProps) {
  const { flights, addFlight } = useFlights(trip.id)
  const [showAddFlight, setShowAddFlight] = useState(false)

  return (
    <div>
      <HeroCard trip={trip} members={members} />

      <section>
        <h2>航班</h2>
        {flights.map((flight) => (
          <FlightCard key={flight.id} flight={flight} />
        ))}
        <button type="button" onClick={() => setShowAddFlight(true)}>
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
    </div>
  )
}
