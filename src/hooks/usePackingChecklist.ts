import { useCallback, useEffect, useState } from 'react'
import { ensurePackingItems, togglePackingItem } from '../lib/packingRepo'
import type { PackingItem } from '../types/models'

export function usePackingChecklist(tripId: string, dayCount: number) {
  const [items, setItems] = useState<PackingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await ensurePackingItems(tripId, dayCount))
    } catch {
      setError('讀取行李清單失敗')
    } finally {
      setLoading(false)
    }
  }, [tripId, dayCount])

  useEffect(() => {
    load()
  }, [load])

  const toggle = useCallback(async (id: string, checked: boolean) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, checked } : item)))
    await togglePackingItem(id, checked)
  }, [])

  return { items, loading, error, toggle, refetch: load }
}
