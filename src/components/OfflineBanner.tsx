import { useOnlineStatus } from '../hooks/useOnlineStatus'

export function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null

  return <p role="alert">📡 離線中 — 已顯示嘅資料可能唔係最新，重新連線先可以讀寫</p>
}
