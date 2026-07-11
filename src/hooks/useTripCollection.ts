// 5 個 collection hook（expenses/flights/gifts/wishlist/packing）以前逐個抄一次
// 「load / loading / error / refetch」骨架（300+ 行 boilerplate，見 8w 審視技術債 #3）。
// 呢度抽做一個 generic：loader 負責攞資料，錯誤統一 catch 做中文文案。
// 各 hook 保留自己嘅 add/remove/toggle 等操作（用 setItems 做 optimistic 更新），對外簽名完全不變。
//
// ⚠️ loader 一定要喺 caller 用 useCallback 包住（依賴 tripId 等），
// 否則每次 render 都係新 function，會無限重新 load。
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react'

export interface TripCollection<T> {
  items: T[]
  setItems: Dispatch<SetStateAction<T[]>>
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useTripCollection<T>(loader: () => Promise<T[]>, errorMessage: string): TripCollection<T> {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await loader())
    } catch {
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [loader, errorMessage])

  useEffect(() => {
    load()
  }, [load])

  return { items, setItems, loading, error, refetch: load }
}
