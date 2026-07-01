import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Trip } from '../types/models'

const useFlights = vi.fn()
vi.mock('./useFlights', () => ({ useFlights: () => useFlights() }))

const { useDestinationCountry } = await import('./useDestinationCountry')

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    name: '東京五日',
    start_date: '2026-08-01',
    end_date: '2026-08-05',
    share_code: 'ABC234',
    destination_country: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('useDestinationCountry', () => {
  it('prefers the trip.destination_country the owner picked at creation time', () => {
    useFlights.mockReturnValue({ flights: [] })
    const { result } = renderHook(() => useDestinationCountry(makeTrip({ destination_country: 'TH' })))
    expect(result.current).toBe('TH')
  })

  it('falls back to the first flight arrival airport when destination_country is not set', () => {
    useFlights.mockReturnValue({
      flights: [
        {
          id: 'f1',
          trip_id: 't1',
          code: 'CX500',
          from_airport: 'HKG',
          to_airport: 'NRT',
          from_time: '2026-08-01T09:00:00Z',
          to_time: '2026-08-01T14:00:00Z',
          date: '2026-08-01',
          gate: null,
          terminal: null,
          seat: null,
          pnr: null,
          baggage_kg: null,
          member_id: null,
        },
      ],
    })

    const { result } = renderHook(() => useDestinationCountry(makeTrip()))
    expect(result.current).toBe('JP')
  })

  it('returns null when there is no destination_country and no flights yet', () => {
    useFlights.mockReturnValue({ flights: [] })
    const { result } = renderHook(() => useDestinationCountry(makeTrip()))
    expect(result.current).toBeNull()
  })
})
