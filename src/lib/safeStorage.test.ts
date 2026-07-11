import { afterEach, describe, expect, it, vi } from 'vitest'
import { localGet, localRemove, localSet, sessionGet, sessionRemove, sessionSet } from './safeStorage'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
  sessionStorage.clear()
})

describe('safeStorage：正常環境', () => {
  it('localStorage 讀寫刪如常', () => {
    localSet('k', 'v')
    expect(localGet('k')).toBe('v')
    localRemove('k')
    expect(localGet('k')).toBeNull()
  })

  it('sessionStorage 讀寫刪如常', () => {
    sessionSet('k', 'v')
    expect(sessionGet('k')).toBe('v')
    sessionRemove('k')
    expect(sessionGet('k')).toBeNull()
  })
})

describe('safeStorage：storage 跛咗（私密模式/配額滿/被封）', () => {
  it('getItem throw 就回 null，唔冧 app', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(localGet('k')).toBeNull()
    expect(sessionGet('k')).toBeNull()
  })

  it('setItem throw 就靜默，唔冧 app', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => localSet('k', 'v')).not.toThrow()
    expect(() => sessionSet('k', 'v')).not.toThrow()
  })

  it('removeItem throw 就靜默，唔冧 app', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(() => localRemove('k')).not.toThrow()
    expect(() => sessionRemove('k')).not.toThrow()
  })
})
