import { warnApiFailure } from './apiWarn'

export interface FlightLookupResult {
  fromAirport: string
  toAirport: string
  fromTime: string
  toTime: string
  gate: string | null
  terminal: string | null
}

interface AviationStackFlight {
  departure?: { iata?: string; scheduled?: string; gate?: string; terminal?: string }
  arrival?: { iata?: string; scheduled?: string }
}

export async function lookupFlight(code: string, date: string): Promise<FlightLookupResult | null> {
  const params = new URLSearchParams({ flight_iata: code, flight_date: date })

  try {
    const response = await fetch(`/api/flights?${params}`, { cache: 'no-store' })
    if (response.status === 503) return null
    if (!response.ok) {
      warnApiFailure('flightApi', `HTTP ${response.status}`)
      return null
    }

    const body = (await response.json()) as { data?: AviationStackFlight[] }
    const flight = body.data?.[0]
    if (!flight) return null

    return {
      fromAirport: flight.departure?.iata ?? '',
      toAirport: flight.arrival?.iata ?? '',
      fromTime: flight.departure?.scheduled ?? '',
      toTime: flight.arrival?.scheduled ?? '',
      gate: flight.departure?.gate ?? null,
      terminal: flight.departure?.terminal ?? null,
    }
  } catch (error) {
    warnApiFailure('flightApi', error)
    return null
  }
}
