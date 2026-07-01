import { beforeEach, describe, expect, it, vi } from 'vitest'

const markBought = vi.fn()
vi.mock('./wishlistRepo', () => ({ markBought: (...a: unknown[]) => markBought(...a) }))

const addGift = vi.fn()
vi.mock('./giftRepo', () => ({ addGift: (...a: unknown[]) => addGift(...a) }))

import { confirmWishlistPurchase } from './wishlistPurchase'
import type { WishlistItem } from '../types/models'

const item: WishlistItem = {
  id: 'w1',
  trip_id: 't1',
  name: '曲奇',
  photo_url: null,
  buy_at: '銀座曲奇（計劃）',
  price_lo: 1000,
  price_hi: 1500,
  tip: null,
  linked_day_id: null,
  to_member: '阿珍',
  bought: false,
  actual_store: null,
  actual_amt: null,
  synced_to_gift: false,
}

describe('confirmWishlistPurchase', () => {
  beforeEach(() => {
    markBought.mockReset()
    addGift.mockReset()
  })

  it('marks the wishlist item bought and creates a matching gift with source "wishlist"', async () => {
    const updatedItem = { ...item, bought: true, actual_store: '銀座曲奇本店', actual_amt: 1280, synced_to_gift: true }
    const gift = { id: 'g1', trip_id: 't1', item: '曲奇', store: '銀座曲奇本店', amount: 1280, to_member: '阿珍', source: 'wishlist' }
    markBought.mockResolvedValue(updatedItem)
    addGift.mockResolvedValue(gift)

    const result = await confirmWishlistPurchase({
      tripId: 't1',
      wishlistItem: item,
      actualStore: '銀座曲奇本店',
      actualAmt: 1280,
    })

    expect(markBought).toHaveBeenCalledWith('w1', '銀座曲奇本店', 1280)
    expect(addGift).toHaveBeenCalledWith({
      tripId: 't1',
      item: '曲奇',
      store: '銀座曲奇本店',
      amount: 1280,
      toMember: '阿珍',
      source: 'wishlist',
    })
    expect(result).toEqual({ wishlistItem: updatedItem, gift })
  })

  it('defaults the gift recipient to 自己 when the wishlist item has no to_member', async () => {
    markBought.mockResolvedValue({ ...item, to_member: null })
    addGift.mockResolvedValue({ id: 'g1' })

    await confirmWishlistPurchase({
      tripId: 't1',
      wishlistItem: { ...item, to_member: null },
      actualStore: null,
      actualAmt: null,
    })

    expect(addGift).toHaveBeenCalledWith(expect.objectContaining({ toMember: '自己' }))
  })
})
