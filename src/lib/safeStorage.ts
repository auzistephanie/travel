// 統一嘅 storage 防禦層：Safari 私密模式（舊版 setItem 即 throw QuotaExceededError）、
// storage 配額滿、企業裝置封 cookie/storage（連讀 window.localStorage 都會 throw SecurityError）
// ——任何一種情況都唔應該令成個 app 冧。讀失敗回 null、寫/刪失敗靜默，
// 效果同 myTrips.ts 一直以嚟嘅做法一致（呢度只係抽做共用）。
// 注意：跌咗 storage 唔等於功能壞——身份/主題會退返去「每次都要揀」嘅狀態，app 照行。

type StorageKind = 'localStorage' | 'sessionStorage'

function getStorage(kind: StorageKind): Storage | null {
  try {
    return window[kind]
  } catch {
    return null
  }
}

function get(kind: StorageKind, key: string): string | null {
  try {
    return getStorage(kind)?.getItem(key) ?? null
  } catch {
    return null
  }
}

function set(kind: StorageKind, key: string, value: string): void {
  try {
    getStorage(kind)?.setItem(key, value)
  } catch {
    // 寫唔到就算數，唔好冧 app
  }
}

function remove(kind: StorageKind, key: string): void {
  try {
    getStorage(kind)?.removeItem(key)
  } catch {
    // 同上
  }
}

export const localGet = (key: string) => get('localStorage', key)
export const localSet = (key: string, value: string) => set('localStorage', key, value)
export const localRemove = (key: string) => remove('localStorage', key)

export const sessionGet = (key: string) => get('sessionStorage', key)
export const sessionSet = (key: string, value: string) => set('sessionStorage', key, value)
export const sessionRemove = (key: string) => remove('sessionStorage', key)
