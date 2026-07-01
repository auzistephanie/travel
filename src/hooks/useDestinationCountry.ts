import { getAirport, getFirstFlightAirport } from '../lib/airports'
import { useFlights } from './useFlights'
import type { Trip } from '../types/models'

export function useDestinationCountry(trip: Trip): string | null {
  const { flights } = useFlights(trip.id)

  if (trip.destination_country) return trip.destination_country

  const airportCode = getFirstFlightAirport(flights)
  const airport = airportCode ? getAirport(airportCode) : undefined
  return airport?.country ?? null
}
