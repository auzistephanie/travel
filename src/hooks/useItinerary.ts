import { useCallback, useEffect, useState } from 'react'
import { addStop, deleteStop, ensureDays, listStops, reorderStops, type AddStopInput } from '../lib/itineraryRepo'
import { reorder } from '../lib/reorder'
import type { ItineraryDay, ItineraryStop } from '../types/models'

export function useItinerary(tripId: string, startDate: string, endDate: string) {
  const [days, setDays] = useState<ItineraryDay[]>([])
  const [stopsByDay, setStopsByDay] = useState<Record<string, ItineraryStop[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const loadedDays = await ensureDays(tripId, startDate, endDate)
      const stopsList = await Promise.all(loadedDays.map((d) => listStops(d.id)))
      const map: Record<string, ItineraryStop[]> = {}
      loadedDays.forEach((d, i) => {
        map[d.id] = stopsList[i]
      })
      setDays(loadedDays)
      setStopsByDay(map)
    } catch {
      setError('讀取行程失敗')
    } finally {
      setLoading(false)
    }
  }, [tripId, startDate, endDate])

  useEffect(() => {
    load()
  }, [load])

  const create = useCallback(
    async (dayId: string, input: Omit<AddStopInput, 'dayId' | 'orderIndex'>) => {
      const orderIndex = stopsByDay[dayId]?.length ?? 0
      const stop = await addStop({ ...input, dayId, orderIndex })
      setStopsByDay((prev) => ({ ...prev, [dayId]: [...(prev[dayId] ?? []), stop] }))
      return stop
    },
    [stopsByDay],
  )

  const remove = useCallback(async (dayId: string, stopId: string) => {
    await deleteStop(stopId)
    setStopsByDay((prev) => ({ ...prev, [dayId]: (prev[dayId] ?? []).filter((s) => s.id !== stopId) }))
  }, [])

  const move = useCallback(
    async (dayId: string, fromIndex: number, toIndex: number) => {
      const current = stopsByDay[dayId] ?? []
      const reordered = reorder(current, fromIndex, toIndex)
      setStopsByDay((prev) => ({ ...prev, [dayId]: reordered }))
      await reorderStops(reordered.map((s) => s.id))
    },
    [stopsByDay],
  )

  return { days, stopsByDay, loading, error, addStop: create, deleteStop: remove, reorderStops: move, refetch: load }
}
