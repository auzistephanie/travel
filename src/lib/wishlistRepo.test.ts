import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeQuery } from '../test/supabaseQueryMock'

const { supabase } = vi.hoisted(() => ({ supabase: { from: vi.fn() } }))
vi.mock('./supabaseClient', () => ({ supabase }))

import { addWishlistItem, deleteWishlistItem, listWishlistItems, markBought, markUnbought } from './wishlistRepo'

describe('listWishlistItems', () => {
  beforeEach(() => supabase.from.mockReset())

  it('returns wishlist items for a trip', async () => {
    const items = [{ id: 'w1', trip_id: 't1', name: '曲奇', bought: false }]
    supabase.from.mockImplementation(() => makeQuery({ data: items, error: null }))
    expect(await listWishlistItems('t1')).toEqual(items)
  })
})

describe('addWishlistItem', () => {
  beforeEach(() => supabase.from.mockReset())

  it('inserts a wishlist item, unbought and not yet synced to gift', async () => {
    const created = {
      id: 'w1',
      trip_id: 't1',
      name: '曲奇',
      photo_url: null,
      buy_at: null,
      price_lo: null,
      price_hi: null,
      tip: null,
      linked_day_id: null,
      to_member: '自己',
      bought: false,
      actual_store: null,
      actual_amt: null,
      synced_to_gift: false,
    }
    supabase.from.mockImplementation(() => makeQuery({ data: created, error: null }))

    const result = await addWishlistItem({
      tripId: 't1',
      name: '曲奇',
      photoUrl: null,
      toMember: '自己',
      linkedDayId: null,
      buyAt: null,
      priceLo: null,
      priceHi: null,
      tip: null,
    })

    expect(result).toEqual(created)
  })
})

describe('deleteWishlistItem', () => {
  it('deletes an item by id', async () => {
    supabase.from.mockReset()
    supabase.from.mockImplementation(() => makeQuery({ data: null, error: null }))
    await expect(deleteWishlistItem('w1')).resolves.toBeUndefined()
  })
})

describe('markBought', () => {
  it('sets bought, actual_store, actual_amt, and synced_to_gift', async () => {
    const updated = {
      id: 'w1',
      trip_id: 't1',
      name: '曲奇',
      bought: true,
      actual_store: '銀座曲奇本店',
      actual_amt: 1280,
      synced_to_gift: true,
    }
    let capturedUpdate: Record<string, unknown> | undefined
    supabase.from.mockReset()
    supabase.from.mockImplementation(() => {
      const query: Record<string, unknown> = {
        update: vi.fn((row: Record<string, unknown>) => {
          capturedUpdate = row
          return query
        }),
        eq: vi.fn(() => query),
        select: vi.fn(() => query),
        single: vi.fn(() => query),
        then: (resolve: (r: unknown) => unknown) => resolve({ data: updated, error: null }),
      }
      return query
    })

    const result = await markBought('w1', '銀座曲奇本店', 1280)

    expect(result).toEqual(updated)
    expect(capturedUpdate).toEqual({
      bought: true,
      actual_store: '銀座曲奇本店',
      actual_amt: 1280,
      synced_to_gift: true,
    })
  })
})

describe('markUnbought', () => {
  it('sets bought back to false without touching synced_to_gift', async () => {
    const updated = { id: 'w1', trip_id: 't1', name: '曲奇', bought: false, synced_to_gift: true }
    let capturedUpdate: Record<string, unknown> | undefined
    supabase.from.mockReset()
    supabase.from.mockImplementation(() => {
      const query: Record<string, unknown> = {
        update: vi.fn((row: Record<string, unknown>) => {
          capturedUpdate = row
          return query
        }),
        eq: vi.fn(() => query),
        select: vi.fn(() => query),
        single: vi.fn(() => query),
        then: (resolve: (r: unknown) => unknown) => resolve({ data: updated, error: null }),
      }
      return query
    })

    const result = await markUnbought('w1')

    expect(result).toEqual(updated)
    expect(capturedUpdate).toEqual({ bought: false })
  })
})
