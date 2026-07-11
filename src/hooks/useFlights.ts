import { useCallback } from 'react'
import { addFlight, listFlights, type AddFlightInput } from '../lib/flightRepo'
import { useTripCollection } from './useTripCollection'
import type { Flight } from '../types/models'

export function useFlights(tripId: string) {
  const loader = useCallback(() => listFlights(tripId), [tripId])
  const { items: flights, setItems, loading, error, refetch } = useTripCollection<Flight>(loader, '讀取航班失敗')

  const create = useCallback(
    async (input: Omit<AddFlightInput, 'tripId'>) => {
      const flight = await addFlight({ ...input, tripId })
      setItems((prev) => [...prev, flight].sort((a, b) => a.from_time.localeCompare(b.from_time)))
      return flight
    },
    [tripId, setItems],
  )

  return { flights, loading, error, addFlight: create, refetch }
}
