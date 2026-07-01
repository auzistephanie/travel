import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeQuery } from '../test/supabaseQueryMock'

const { supabase } = vi.hoisted(() => ({ supabase: { from: vi.fn() } }))
vi.mock('./supabaseClient', () => ({ supabase }))

import { addStop, deleteStop, ensureDays, listDays, listStops } from './itineraryRepo'

describe('listDays', () => {
  beforeEach(() => supabase.from.mockReset())

  it('returns the days for a trip', async () => {
    const days = [{ id: 'd1', trip_id: 't1', date: '2026-08-01', order_index: 0 }]
    supabase.from.mockImplementation(() => makeQuery({ data: days, error: null }))
    expect(await listDays('t1')).toEqual(days)
  })
})

describe('ensureDays', () => {
  beforeEach(() => supabase.from.mockReset())

  it('creates no new days when every date already has one', async () => {
    const existing = [
      { id: 'd1', trip_id: 't1', date: '2026-08-01', order_index: 0 },
      { id: 'd2', trip_id: 't1', date: '2026-08-02', order_index: 1 },
    ]
    supabase.from.mockImplementation(() => makeQuery({ data: existing, error: null }))

    const result = await ensureDays('t1', '2026-08-01', '2026-08-02')
    expect(result).toEqual(existing)
    expect(supabase.from).toHaveBeenCalledTimes(1)
  })

  it('creates a day for each missing date in the trip range', async () => {
    const existing = [{ id: 'd1', trip_id: 't1', date: '2026-08-01', order_index: 0 }]
    supabase.from.mockImplementation(() => {
      let capturedDate: string | undefined
      const query: Record<string, unknown> = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        order: vi.fn(() => query),
        insert: vi.fn((row: { date: string }) => {
          capturedDate = row.date
          return query
        }),
        single: vi.fn(() => query),
        then: (resolve: (r: unknown) => unknown) => {
          if (capturedDate) {
            return resolve({
              data: { id: `new-${capturedDate}`, trip_id: 't1', date: capturedDate, order_index: 1 },
              error: null,
            })
          }
          return resolve({ data: existing, error: null })
        },
      }
      return query
    })

    const result = await ensureDays('t1', '2026-08-01', '2026-08-03')
    const dates = result.map((d) => d.date).sort()
    expect(dates).toEqual(['2026-08-01', '2026-08-02', '2026-08-03'])
  })
})

describe('listStops / addStop / deleteStop', () => {
  beforeEach(() => supabase.from.mockReset())

  it('lists stops for a day', async () => {
    const stops = [{ id: 's1', day_id: 'd1', title: '淺草寺' }]
    supabase.from.mockImplementation(() => makeQuery({ data: stops, error: null }))
    expect(await listStops('d1')).toEqual(stops)
  })

  it('adds a stop', async () => {
    const created = { id: 's1', day_id: 'd1', title: '淺草寺' }
    supabase.from.mockImplementation(() => makeQuery({ data: created, error: null }))
    const result = await addStop({
      dayId: 'd1',
      time: '10:00',
      title: '淺草寺',
      placeName: '淺草寺',
      lat: null,
      lng: null,
      orderIndex: 0,
    })
    expect(result).toEqual(created)
  })

  it('deletes a stop', async () => {
    supabase.from.mockImplementation(() => makeQuery({ data: null, error: null }))
    await expect(deleteStop('s1')).resolves.toBeUndefined()
  })
})
