import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeQuery } from '../test/supabaseQueryMock'

const { supabase } = vi.hoisted(() => ({ supabase: { from: vi.fn() } }))
vi.mock('./supabaseClient', () => ({ supabase }))

import { addGift, deleteGift, listGifts, updateGift } from './giftRepo'

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

describe('addGift with currency', () => {
  beforeEach(() => supabase.from.mockReset())

  it('inserts a gift with a currency', async () => {
    const created = {
      id: 'g1',
      trip_id: 't1',
      item: '曲奇',
      store: '銀座曲奇',
      amount: 1280,
      to_member: '阿珍',
      source: 'manual',
      currency: 'JPY',
    }
    supabase.from.mockImplementation(() => makeQuery({ data: created, error: null }))

    const result = await addGift({
      tripId: 't1',
      item: '曲奇',
      store: '銀座曲奇',
      amount: 1280,
      toMember: '阿珍',
      source: 'manual',
      currency: 'JPY',
    })

    expect(result).toEqual(created)
  })
})

describe('updateGift', () => {
  beforeEach(() => supabase.from.mockReset())

  it('updates a gift by id', async () => {
    const updated = {
      id: 'g1',
      trip_id: 't1',
      item: '曲奇（大盒）',
      store: '銀座曲奇',
      amount: 1500,
      to_member: '阿珍',
      source: 'manual',
      currency: 'JPY',
    }
    supabase.from.mockImplementation(() => makeQuery({ data: updated, error: null }))

    const result = await updateGift('g1', {
      item: '曲奇（大盒）',
      store: '銀座曲奇',
      amount: 1500,
      toMember: '阿珍',
      currency: 'JPY',
    })

    expect(result).toEqual(updated)
  })
})

describe('deleteGift', () => {
  it('deletes a gift by id', async () => {
    supabase.from.mockReset()
    supabase.from.mockImplementation(() => makeQuery({ data: null, error: null }))
    await expect(deleteGift('g1')).resolves.toBeUndefined()
  })
})
