import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PostgrestError } from '@supabase/supabase-js'

const { supabase } = vi.hoisted(() => ({ supabase: { from: vi.fn() } }))
vi.mock('./supabaseClient', () => ({ supabase }))

import {
  addTripMember,
  createTrip,
  deleteTripByShareCode,
  findTripByShareCode,
  getTripsForAuthUser,
  updateTrip,
} from './tripApi'
import { makeQuery } from '../test/supabaseQueryMock'

const uniqueViolation = {
  name: 'PostgrestError',
  message: 'duplicate key value violates unique constraint',
  details: '',
  hint: '',
  code: '23505',
} as PostgrestError

describe('createTrip', () => {
  beforeEach(() => {
    supabase.from.mockReset()
  })

  it('inserts a trip and an owner member, returning both', async () => {
    const trip = { id: 't1', name: '東京五日', share_code: 'ABC234' }
    const owner = { id: 'm1', trip_id: 't1', name: '阿明', is_owner: true }

    supabase.from.mockImplementation((table: string) => {
      if (table === 'trips') return makeQuery({ data: trip, error: null })
      if (table === 'trip_members') return makeQuery({ data: owner, error: null })
      throw new Error(`unexpected table ${table}`)
    })

    const result = await createTrip({
      name: '東京五日',
      startDate: '2026-08-01',
      endDate: '2026-08-05',
      ownerName: '阿明',
    })

    expect(result.trip).toEqual(trip)
    expect(result.owner).toEqual(owner)
  })

  it('persists the chosen destination_country on the trip', async () => {
    const trip = { id: 't1', name: '東京五日', share_code: 'ABC234', destination_country: 'JP' }
    const owner = { id: 'm1', trip_id: 't1', name: '阿明', is_owner: true }
    let tripQuery: ReturnType<typeof makeQuery> | undefined

    supabase.from.mockImplementation((table: string) => {
      if (table === 'trips') {
        tripQuery = makeQuery({ data: trip, error: null })
        return tripQuery
      }
      if (table === 'trip_members') return makeQuery({ data: owner, error: null })
      throw new Error(`unexpected table ${table}`)
    })

    await createTrip({
      name: '東京五日',
      startDate: '2026-08-01',
      endDate: '2026-08-05',
      ownerName: '阿明',
      destinationCountry: 'JP',
    })

    expect(tripQuery?.insert).toHaveBeenCalledWith(expect.objectContaining({ destination_country: 'JP' }))
  })

  it('retries with a new share code when the trip insert hits a unique violation', async () => {
    const trip = { id: 't1', name: '東京五日', share_code: 'XYZ987' }
    const owner = { id: 'm1', trip_id: 't1', name: '阿明', is_owner: true }

    let tripInsertCalls = 0
    supabase.from.mockImplementation((table: string) => {
      if (table === 'trips') {
        tripInsertCalls += 1
        if (tripInsertCalls === 1) {
          return makeQuery({ data: null, error: uniqueViolation })
        }
        return makeQuery({ data: trip, error: null })
      }
      if (table === 'trip_members') return makeQuery({ data: owner, error: null })
      throw new Error(`unexpected table ${table}`)
    })

    const result = await createTrip({
      name: '東京五日',
      startDate: '2026-08-01',
      endDate: '2026-08-05',
      ownerName: '阿明',
    })

    expect(tripInsertCalls).toBe(2)
    expect(result.trip).toEqual(trip)
  })

  it('throws immediately on a non-collision error', async () => {
    const otherError = { ...uniqueViolation, code: '23503', message: 'fk violation' }
    supabase.from.mockImplementation((table: string) => {
      if (table === 'trips') return makeQuery({ data: null, error: otherError })
      throw new Error(`unexpected table ${table}`)
    })

    await expect(
      createTrip({ name: 'x', startDate: '2026-08-01', endDate: '2026-08-05', ownerName: 'y' }),
    ).rejects.toEqual(otherError)
  })
})

describe('findTripByShareCode', () => {
  beforeEach(() => {
    supabase.from.mockReset()
  })

  it('returns null when no trip matches the code', async () => {
    supabase.from.mockImplementation((table: string) => {
      if (table === 'trips') return makeQuery({ data: null, error: null })
      throw new Error(`unexpected table ${table}`)
    })

    const result = await findTripByShareCode('NOPE99')
    expect(result).toBeNull()
  })

  it('returns the trip and its members when found', async () => {
    const trip = { id: 't1', share_code: 'ABC234' }
    const members = [{ id: 'm1', name: '阿明' }]
    supabase.from.mockImplementation((table: string) => {
      if (table === 'trips') return makeQuery({ data: trip, error: null })
      if (table === 'trip_members') return makeQuery({ data: members, error: null })
      throw new Error(`unexpected table ${table}`)
    })

    const result = await findTripByShareCode('ABC234')
    expect(result).toEqual({ trip, members })
  })
})

describe('updateTrip', () => {
  it('updates only the provided fields and returns the trip', async () => {
    const updated = { id: 't1', name: '新名', start_date: '2026-09-01' }
    let q: ReturnType<typeof makeQuery> | undefined
    supabase.from.mockReset()
    supabase.from.mockImplementation((table: string) => {
      if (table === 'trips') {
        q = makeQuery({ data: updated, error: null })
        return q
      }
      throw new Error(`unexpected table ${table}`)
    })

    const result = await updateTrip('t1', { name: '新名', destinationCountry: null })
    expect(q?.update).toHaveBeenCalledWith({ name: '新名', destination_country: null })
    expect(result).toEqual(updated)
  })
})

describe('deleteTripByShareCode', () => {
  it('deletes the trip row by share code', async () => {
    let q: ReturnType<typeof makeQuery> | undefined
    supabase.from.mockReset()
    supabase.from.mockImplementation((table: string) => {
      if (table === 'trips') {
        q = makeQuery({ data: null, error: null })
        return q
      }
      throw new Error(`unexpected table ${table}`)
    })

    await deleteTripByShareCode('ABC234')
    expect(q?.delete).toHaveBeenCalled()
    expect(q?.eq).toHaveBeenCalledWith('share_code', 'ABC234')
  })

  it('throws when the delete errors', async () => {
    supabase.from.mockReset()
    supabase.from.mockImplementation(() => makeQuery({ data: null, error: { message: 'boom' } }))
    await expect(deleteTripByShareCode('ABC234')).rejects.toBeTruthy()
  })
})

describe('getTripsForAuthUser', () => {
  beforeEach(() => {
    supabase.from.mockReset()
  })

  const tripJoin = { share_code: 'ABC234', name: '東京五日', start_date: '2026-08-01', end_date: '2026-08-05' }

  it('maps joined rows into AuthUserTrip entries with the right role', async () => {
    supabase.from.mockImplementation((table: string) => {
      if (table === 'trip_members') {
        return makeQuery({
          data: [
            { is_owner: true, trips: tripJoin },
            { is_owner: false, trips: { ...tripJoin, share_code: 'XYZ987', name: '首爾四日' } },
          ],
          error: null,
        })
      }
      throw new Error(`unexpected table ${table}`)
    })

    const result = await getTripsForAuthUser('auth-1')
    expect(result).toEqual([
      { shareCode: 'ABC234', name: '東京五日', role: 'owner', startDate: '2026-08-01', endDate: '2026-08-05' },
      { shareCode: 'XYZ987', name: '首爾四日', role: 'member', startDate: '2026-08-01', endDate: '2026-08-05' },
    ])
  })

  it('normalises the trips join when Supabase types it as an array', async () => {
    supabase.from.mockImplementation(() =>
      makeQuery({ data: [{ is_owner: false, trips: [tripJoin] }], error: null }),
    )

    const result = await getTripsForAuthUser('auth-1')
    expect(result).toEqual([
      { shareCode: 'ABC234', name: '東京五日', role: 'member', startDate: '2026-08-01', endDate: '2026-08-05' },
    ])
  })

  it('drops rows whose trip join is missing (orphan member rows)', async () => {
    supabase.from.mockImplementation(() =>
      makeQuery({ data: [{ is_owner: true, trips: null }], error: null }),
    )

    expect(await getTripsForAuthUser('auth-1')).toEqual([])
  })

  it('returns an empty list when there are no linked trips', async () => {
    supabase.from.mockImplementation(() => makeQuery({ data: [], error: null }))
    expect(await getTripsForAuthUser('auth-1')).toEqual([])
  })

  it('throws when the query errors', async () => {
    supabase.from.mockImplementation(() => makeQuery({ data: null, error: { message: 'boom' } }))
    await expect(getTripsForAuthUser('auth-1')).rejects.toBeTruthy()
  })
})

describe('addTripMember', () => {
  it('inserts a non-owner member and returns it', async () => {
    const member = { id: 'm2', trip_id: 't1', name: '阿珍', is_owner: false }
    supabase.from.mockReset()
    supabase.from.mockImplementation((table: string) => {
      if (table === 'trip_members') return makeQuery({ data: member, error: null })
      throw new Error(`unexpected table ${table}`)
    })

    const result = await addTripMember('t1', '阿珍')
    expect(result).toEqual(member)
  })
})
