import { useCallback } from 'react'
import { addGift, deleteGift, listGifts, type AddGiftInput } from '../lib/giftRepo'
import { useTripCollection } from './useTripCollection'
import type { Gift } from '../types/models'

export function useGifts(tripId: string) {
  const loader = useCallback(() => listGifts(tripId), [tripId])
  const { items: gifts, setItems, loading, error, refetch } = useTripCollection<Gift>(loader, '讀取手信失敗')

  const create = useCallback(
    async (input: Omit<AddGiftInput, 'tripId'>) => {
      const gift = await addGift({ ...input, tripId })
      setItems((prev) => [...prev, gift])
      return gift
    },
    [tripId, setItems],
  )

  const remove = useCallback(
    async (id: string) => {
      await deleteGift(id)
      setItems((prev) => prev.filter((g) => g.id !== id))
    },
    [setItems],
  )

  return { gifts, loading, error, addGift: create, deleteGift: remove, refetch }
}
