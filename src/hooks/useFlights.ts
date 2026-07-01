import { useCallback, useEffect, useState } from 'react'
import { addFlight, listFlights, type AddFlightInput } from '../lib/flightRepo'
import type { Flight } from '../types/models'

export function useFlights(tripId: string) {
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setFlights(await listFlights(tripId))
    } catch {
      setError('讀取航班失敗')
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    load()
  }, [load])

  const create = useCallback(
    async (input: Omit<AddFlightInput, 'tripId'>) => {
      const flight = await addFlight({ ...input, tripId })
      setFlights((prev) => [...prev, flight].sort((a, b) => a.from_time.localeCompare(b.from_time)))
      return flight
    },
    [tripId],
  )

  return { flights, loading, error, addFlight: create, refetch: load }
}
