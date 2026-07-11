import { useCallback } from 'react'
import { ensurePackingItems, togglePackingItem } from '../lib/packingRepo'
import { useTripCollection } from './useTripCollection'
import type { PackingItem } from '../types/models'

export function usePackingChecklist(tripId: string, dayCount: number) {
  const loader = useCallback(() => ensurePackingItems(tripId, dayCount), [tripId, dayCount])
  const { items, setItems, loading, error, refetch } = useTripCollection<PackingItem>(loader, '讀取行李清單失敗')

  const toggle = useCallback(
    async (id: string, checked: boolean) => {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, checked } : item)))
      await togglePackingItem(id, checked)
    },
    [setItems],
  )

  return { items, loading, error, toggle, refetch }
}
