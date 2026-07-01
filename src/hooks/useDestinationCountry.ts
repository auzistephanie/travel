import { getAirport, getFirstFlightAirport } from '../lib/airports'
import { useFlights } from './useFlights'

export function useDestinationCountry(tripId: string): string | null {
  const { flights } = useFlights(tripId)
  const airportCode = getFirstFlightAirport(flights)
  const airport = airportCode ? getAirport(airportCode) : undefined
  return airport?.country ?? null
}
