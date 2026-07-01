import { useCallback, useEffect, useState } from 'react'
import { addGift, deleteGift, listGifts, type AddGiftInput } from '../lib/giftRepo'
import type { Gift } from '../types/models'

export function useGifts(tripId: string) {
  const [gifts, setGifts] = useState<Gift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setGifts(await listGifts(tripId))
    } catch {
      setError('讀取手信失敗')
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    load()
  }, [load])

  const create = useCallback(
    async (input: Omit<AddGiftInput, 'tripId'>) => {
      const gift = await addGift({ ...input, tripId })
      setGifts((prev) => [...prev, gift])
      return gift
    },
    [tripId],
  )

  const remove = useCallback(async (id: string) => {
    await deleteGift(id)
    setGifts((prev) => prev.filter((g) => g.id !== id))
  }, [])

  return { gifts, loading, error, addGift: create, deleteGift: remove, refetch: load }
}
