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

export type RemoteStatus<T> =
  | { status: 'ok'; value: T }
  | { status: 'empty' }
  | { status: 'unconfigured' }
  | { status: 'failed' }

export async function lookupFlightDetailed(code: string, date: string): Promise<RemoteStatus<FlightLookupResult>> {
  const key = import.meta.env.VITE_AVIATIONSTACK_KEY
  if (!key) return { status: 'unconfigured' }

  const params = new URLSearchParams({ access_key: key, flight_iata: code, flight_date: date })

  try {
    const response = await fetch(`https://api.aviationstack.com/v1/flights?${params}`)
    if (!response.ok) {
      warnApiFailure('flightApi', `HTTP ${response.status}`)
      return { status: 'failed' }
    }

    const body = (await response.json()) as { data?: AviationStackFlight[] }
    const flight = body.data?.[0]
    if (!flight) return { status: 'empty' }

    return {
      status: 'ok',
      value: {
        fromAirport: flight.departure?.iata ?? '',
        toAirport: flight.arrival?.iata ?? '',
        fromTime: flight.departure?.scheduled ?? '',
        toTime: flight.arrival?.scheduled ?? '',
        gate: flight.departure?.gate ?? null,
        terminal: flight.departure?.terminal ?? null,
      },
    }
  } catch (error) {
    warnApiFailure('flightApi', error)
    return { status: 'failed' }
  }
}

export async function lookupFlight(code: string, date: string): Promise<FlightLookupResult | null> {
  const result = await lookupFlightDetailed(code, date)
  return result.status === 'ok' ? result.value : null
}
