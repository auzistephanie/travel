import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeQuery } from '../test/supabaseQueryMock'

const { supabase } = vi.hoisted(() => ({ supabase: { from: vi.fn() } }))
vi.mock('./supabaseClient', () => ({ supabase }))

import { addGift, deleteGift, listGifts } from './giftRepo'

describe('listGifts', () => {
  beforeEach(() => supabase.from.mockReset())

  it('returns gifts for a trip', async () => {
    const gifts = [{ id: 'g1', trip_id: 't1', item: '曲奇', store: null, amount: 100, to_member: '自己', source: 'manual' }]
    supabase.from.mockImplementation(() => makeQuery({ data: gifts, error: null }))
    expect(await listGifts('t1')).toEqual(gifts)
  })
})

describe('addGift', () => {
  beforeEach(() => supabase.from.mockReset())

  it('inserts a gift with the given source', async () => {
    const created = { id: 'g1', trip_id: 't1', item: '曲奇', store: '銀座曲奇', amount: 100, to_member: '阿珍', source: 'manual' }
    supabase.from.mockImplementation(() => makeQuery({ data: created, error: null }))

    const result = await addGift({
      tripId: 't1',
      item: '曲奇',
      store: '銀座曲奇',
      amount: 100,
      toMember: '阿珍',
      source: 'manual',
    })

    expect(result).toEqual(created)
  })
})

describe('deleteGift', () => {
  it('deletes a gift by id', async () => {
    supabase.from.mockReset()
    supabase.from.mockImplementation(() => makeQuery({ data: null, error: null }))
    await expect(deleteGift('g1')).resolves.toBeUndefined()
  })
})
