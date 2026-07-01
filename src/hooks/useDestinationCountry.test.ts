import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const useFlights = vi.fn()
vi.mock('./useFlights', () => ({ useFlights: () => useFlights() }))

const { useDestinationCountry } = await import('./useDestinationCountry')

describe('useDestinationCountry', () => {
  it('resolves the country from the first flight arrival airport', () => {
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

    const { result } = renderHook(() => useDestinationCountry('t1'))
    expect(result.current).toBe('JP')
  })

  it('returns null when there are no flights yet', () => {
    useFlights.mockReturnValue({ flights: [] })
    const { result } = renderHook(() => useDestinationCountry('t1'))
    expect(result.current).toBeNull()
  })
})
