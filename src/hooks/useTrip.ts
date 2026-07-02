import { useCallback, useEffect, useState } from 'react'
import { addTripMember, findTripByShareCode } from '../lib/tripApi'
import type { Trip, TripMember } from '../types/models'

interface UseTripState {
  trip: Trip | null
  members: TripMember[]
  loading: boolean
  error: string | null
}

export function useTrip(shareCode: string | undefined) {
  const [state, setState] = useState<UseTripState>({
    trip: null,
    members: [],
    loading: true,
    error: null,
  })

  const load = useCallback(async () => {
    if (!shareCode) {
      setState({ trip: null, members: [], loading: false, error: '沒有分享碼' })
      return
    }
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const result = await findTripByShareCode(shareCode)
      if (!result) {
        setState({ trip: null, members: [], loading: false, error: '找不到這個分享碼的行程' })
        return
      }
      setState({ trip: result.trip, members: result.members, loading: false, error: null })
    } catch {
      setState({ trip: null, members: [], loading: false, error: '讀取行程失敗，請檢查網絡連線' })
    }
  }, [shareCode])

  useEffect(() => {
    load()
  }, [load])

  const joinAsNewMember = useCallback(
    async (name: string) => {
      if (!state.trip) throw new Error('trip not loaded')
      const member = await addTripMember(state.trip.id, name)
      setState((s) => ({ ...s, members: [...s.members, member] }))
      return member
    },
    [state.trip],
  )

  return { ...state, refetch: load, joinAsNewMember }
}
