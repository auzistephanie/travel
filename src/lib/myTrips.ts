// 「我的行程」本地清單：記住呢部裝置（呢個瀏覽器）建立過／加入過／開過嘅行程，
// 令首頁可以列出返，一人可以有多個行程，唔使死記條連結。
// 純 localStorage，零登入即用；登入後可以再用 mergeMyTrips 併入雲端攞返嘅行程做跨裝置同步。

const KEY = 'myTrips'

export type TripRole = 'owner' | 'member'

export interface MyTripEntry {
  shareCode: string
  name: string
  role: TripRole
  startDate?: string | null
  endDate?: string | null
  /** 最後開啟時間（epoch ms），用嚟排序；雲端併入但本地未開過嘅為 0。 */
  lastOpened: number
}

function read(): MyTripEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e): e is MyTripEntry =>
        !!e && typeof e === 'object' && typeof (e as MyTripEntry).shareCode === 'string',
    )
  } catch {
    return []
  }
}

function write(list: MyTripEntry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // localStorage 滿咗／唔可用就靜靜哋算數，唔好因為記唔到清單而 crash 成個 app
  }
}

/** 攞返本地清單，按最後開啟時間由新到舊排。 */
export function getMyTrips(): MyTripEntry[] {
  return read().sort((a, b) => b.lastOpened - a.lastOpened)
}

/** 加入／更新一個行程（建立、加入、開啟時用）。同一 shareCode 會 upsert 唔會重複。 */
export function addMyTrip(entry: Omit<MyTripEntry, 'lastOpened'> & { lastOpened?: number }): void {
  const list = read()
  const now = entry.lastOpened ?? Date.now()
  const existing = list.find((e) => e.shareCode === entry.shareCode)
  if (existing) {
    existing.name = entry.name
    existing.role = entry.role
    existing.startDate = entry.startDate ?? existing.startDate ?? null
    existing.endDate = entry.endDate ?? existing.endDate ?? null
    existing.lastOpened = now
  } else {
    list.push({
      shareCode: entry.shareCode,
      name: entry.name,
      role: entry.role,
      startDate: entry.startDate ?? null,
      endDate: entry.endDate ?? null,
      lastOpened: now,
    })
  }
  write(list)
}

/** 淨係更新某個行程嘅最後開啟時間（已存在先做，唔存在唔會亂加）。 */
export function touchMyTrip(shareCode: string): void {
  const list = read()
  const existing = list.find((e) => e.shareCode === shareCode)
  if (!existing) return
  existing.lastOpened = Date.now()
  write(list)
}

/** 由清單移除一個行程。 */
export function removeMyTrip(shareCode: string): void {
  write(read().filter((e) => e.shareCode !== shareCode))
}

/** 將雲端（登入後）攞到嘅行程併入本地清單，唔覆蓋本地已有嘅 lastOpened 排序。 */
export function mergeMyTrips(entries: Array<Omit<MyTripEntry, 'lastOpened'>>): void {
  const list = read()
  for (const entry of entries) {
    const existing = list.find((e) => e.shareCode === entry.shareCode)
    if (existing) {
      existing.name = entry.name
      existing.role = entry.role
      existing.startDate = entry.startDate ?? existing.startDate ?? null
      existing.endDate = entry.endDate ?? existing.endDate ?? null
    } else {
      list.push({
        shareCode: entry.shareCode,
        name: entry.name,
        role: entry.role,
        startDate: entry.startDate ?? null,
        endDate: entry.endDate ?? null,
        lastOpened: 0,
      })
    }
  }
  write(list)
}
