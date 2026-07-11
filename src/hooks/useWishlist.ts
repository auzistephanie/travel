import { useCallback } from 'react'
import {
  addWishlistItem,
  deleteWishlistItem,
  listWishlistItems,
  markUnbought,
  type AddWishlistItemInput,
} from '../lib/wishlistRepo'
import { confirmWishlistPurchase } from '../lib/wishlistPurchase'
import { useTripCollection } from './useTripCollection'
import type { WishlistItem } from '../types/models'

export function useWishlist(tripId: string) {
  const loader = useCallback(() => listWishlistItems(tripId), [tripId])
  const { items, setItems, loading, error, refetch } = useTripCollection<WishlistItem>(loader, '讀取心願清單失敗')

  const create = useCallback(
    async (input: Omit<AddWishlistItemInput, 'tripId'>) => {
      const item = await addWishlistItem({ ...input, tripId })
      setItems((prev) => [...prev, item])
      return item
    },
    [tripId, setItems],
  )

  const remove = useCallback(
    async (id: string) => {
      await deleteWishlistItem(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    },
    [setItems],
  )

  const confirmBought = useCallback(
    async (item: WishlistItem, actualStore: string | null, actualAmt: number | null) => {
      const { wishlistItem } = await confirmWishlistPurchase({ tripId, wishlistItem: item, actualStore, actualAmt })
      setItems((prev) => prev.map((i) => (i.id === wishlistItem.id ? wishlistItem : i)))
      return wishlistItem
    },
    [tripId, setItems],
  )

  const undoBought = useCallback(
    async (id: string) => {
      const updated = await markUnbought(id)
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)))
      return updated
    },
    [setItems],
  )

  return {
    items,
    loading,
    error,
    addItem: create,
    deleteItem: remove,
    confirmBought,
    undoBought,
    refetch,
  }
}
