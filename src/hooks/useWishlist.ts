import { useCallback, useEffect, useState } from 'react'
import {
  addWishlistItem,
  deleteWishlistItem,
  listWishlistItems,
  markUnbought,
  type AddWishlistItemInput,
} from '../lib/wishlistRepo'
import { confirmWishlistPurchase } from '../lib/wishlistPurchase'
import type { WishlistItem } from '../types/models'

export function useWishlist(tripId: string) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await listWishlistItems(tripId))
    } catch {
      setError('讀取心願清單失敗')
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    load()
  }, [load])

  const create = useCallback(
    async (input: Omit<AddWishlistItemInput, 'tripId'>) => {
      const item = await addWishlistItem({ ...input, tripId })
      setItems((prev) => [...prev, item])
      return item
    },
    [tripId],
  )

  const remove = useCallback(async (id: string) => {
    await deleteWishlistItem(id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const confirmBought = useCallback(
    async (item: WishlistItem, actualStore: string | null, actualAmt: number | null) => {
      const { wishlistItem } = await confirmWishlistPurchase({ tripId, wishlistItem: item, actualStore, actualAmt })
      setItems((prev) => prev.map((i) => (i.id === wishlistItem.id ? wishlistItem : i)))
      return wishlistItem
    },
    [tripId],
  )

  const undoBought = useCallback(async (id: string) => {
    const updated = await markUnbought(id)
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)))
    return updated
  }, [])

  return {
    items,
    loading,
    error,
    addItem: create,
    deleteItem: remove,
    confirmBought,
    undoBought,
    refetch: load,
  }
}
