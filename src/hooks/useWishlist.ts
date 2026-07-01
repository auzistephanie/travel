import { useCallback, useEffect, useState } from 'react'
import { addWishlistItem, deleteWishlistItem, listWishlistItems, type AddWishlistItemInput } from '../lib/wishlistRepo'
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

  return { items, loading, error, addItem: create, deleteItem: remove, refetch: load }
}
