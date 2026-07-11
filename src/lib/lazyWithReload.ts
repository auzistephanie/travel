// 修「redeploy 之後撞 stale JS chunk 就全黑」問題：
// 用戶部機仍然停留喺舊版嘅頁面（例如 tab 開咗好耐、或者岩岩 deploy 咗新版），
// 個瀏覽器已經 cache 咗舊嘅 index.html/主 bundle，但之後 code-split 嘅分頁 chunk
// （例如 Overview/Itinerary）用舊 hash 嘅檔名去攞，個檔喺新 deploy 已經唔存在 → import() 404。
// React 冇 error boundary 接住呢種 lazy import 失敗，成個 tree 會靜靜哋 unmount，
// 淨低 app 外殼嘅深色背景 = 睇落好似「全黑」。
//
// 呢個 wrapper 令呢種情況第一次撞到就自動 reload 一次（攞返新版 index.html + 新 hash 嘅
// chunk），用 sessionStorage 記住「啱啱 reload 咗一次」避免無限loop；如果 reload 完
// 都仲係攞唔到（例如真係網絡問題），就正常拋錯，唔會靜雞雞。
import { sessionGet, sessionRemove, sessionSet } from './safeStorage'

const RELOAD_KEY = 'chunk-reload-attempted'

export function lazyImportWithReload<T>(factory: () => Promise<T>): () => Promise<T> {
  return () =>
    factory()
      .then((module) => {
        sessionRemove(RELOAD_KEY)
        return module
      })
      .catch((error: unknown) => {
        if (!sessionGet(RELOAD_KEY)) {
          sessionSet(RELOAD_KEY, '1')
          // read-back 驗證：如果 sessionStorage 根本寫唔入（私密模式/被封），
          // 記唔住「已經試過 reload」就唔好 reload——否則會變無限 reload loop。
          if (sessionGet(RELOAD_KEY) !== '1') throw error
          window.location.reload()
          // reload 緊，呢個 promise 唔使 resolve，等頁面重新載入接手
          return new Promise<T>(() => {})
        }
        throw error
      })
}
