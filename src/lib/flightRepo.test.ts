import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeQuery } from '../test/supabaseQueryMock'

const { supabase } = vi.hoisted(() => ({ supabase: { from: vi.fn() } }))
vi.mock('./supabaseClient', () => ({ supabase }))

import { addFlight, listFlights } from './flightRepo'

describe('listFlights', () => {
  beforeEach(() => {
    supabase.from.mockReset()
  })

  it('returns flights for the given trip, ordered by from_time', async () => {
    const flights = [
      { id: 'f1', trip_id: 't1', from_time: '2026-08-01T10:00:00Z' },
      { id: 'f2', trip_id: 't1', from_time: '2026-08-03T10:00:00Z' },
    ]
    supabase.from.mockImplementation((table: string) => {
      expect(table).toBe('flights')
      return makeQuery({ data: flights, error: null })
    })

    const result = await listFlights('t1')
    expect(result).toEqual(flights)
  })

  it('returns an empty array when there are no flights', async () => {
    supabase.from.mockImplementation(() => makeQuery({ data: null, error: null }))
    const result = await listFlights('t1')
    expect(result).toEqual([])
  })
})

describe('addFlight', () => {
  beforeEach(() => {
    supabase.from.mockReset()
  })

  it('inserts a flight and returns the created row', async () => {
    const created = { id: 'f1', trip_id: 't1', code: 'CX123' }
    supabase.from.mockImplementation(() => makeQuery({ data: created, error: null }))

    const result = await addFlight({
      tripId: 't1',
      code: 'CX123',
      fromAirport: 'HKG',
      toAirport: 'NRT',
      fromTime: '2026-08-01T10:00:00Z',
      toTime: '2026-08-01T15:00:00Z',
      date: '2026-08-01',
      gate: 'A1',
      terminal: '1',
      seat: '12A',
      pnr: 'ABCDEF',
      baggageKg: 30,
      memberId: 'm1',
    })

    expect(result).toEqual(created)
  })
})
