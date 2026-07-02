import { useOnlineStatus } from '../hooks/useOnlineStatus'

export function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null

  return <p role="alert">離線中 — 顯示的資料可能不是最新，重新連線後才可讀寫</p>
}
