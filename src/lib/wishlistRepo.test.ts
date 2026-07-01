import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeQuery } from '../test/supabaseQueryMock'

const { supabase } = vi.hoisted(() => ({ supabase: { from: vi.fn() } }))
vi.mock('./supabaseClient', () => ({ supabase }))

import { addWishlistItem, deleteWishlistItem, listWishlistItems } from './wishlistRepo'

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
