import '@testing-library/jest-dom/vitest'

// ⚠️ Node 26 內置咗 Web Storage（globalThis.localStorage / sessionStorage）。
// 唔加 --localstorage-file 嗰陣，佢淨係一個冇 setItem／clear 嘅空殼，
// 而且係定義喺 globalThis 上面，**蓋過咗 jsdom 真正嗰個**。
// 症狀：localGet 永遠回 null、`localStorage.clear is not a function`，
// 一次過拖冧 safeStorage／myTrips／themeStorage／whoAmI／Landing 共 22 個 test。
// 呢度偵測到係空殼先換返一個符合 Web Storage API 嘅 in-memory 版；
// Node 22–24（jsdom 嗰個正常）唔會受影響。
function createMemoryStorage(): Storage {
  let store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    key(index: number) {
      return [...store.keys()][index] ?? null
    },
    getItem(key: string) {
      return store.get(String(key)) ?? null
    },
    setItem(key: string, value: string) {
      store.set(String(key), String(value))
    },
    removeItem(key: string) {
      store.delete(String(key))
    },
    clear() {
      store = new Map()
    },
  } as Storage
}

function ensureStorage(name: 'localStorage' | 'sessionStorage') {
  const current = (globalThis as Record<string, unknown>)[name] as Storage | undefined
  const usable = typeof current?.setItem === 'function' && typeof current?.clear === 'function'
  if (usable) return

  Object.defineProperty(globalThis, name, {
    value: createMemoryStorage(),
    configurable: true,
    writable: true,
  })
}

ensureStorage('localStorage')
ensureStorage('sessionStorage')
