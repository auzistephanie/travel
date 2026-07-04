import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { lazyImportWithReload } from './lazyWithReload'

const RELOAD_KEY = 'chunk-reload-attempted'

describe('lazyImportWithReload', () => {
  let reloadSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    sessionStorage.clear()
    reloadSpy = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadSpy },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves normally and clears the reload flag when the import succeeds', async () => {
    sessionStorage.setItem(RELOAD_KEY, '1')
    const load = lazyImportWithReload(() => Promise.resolve({ default: 'ok' }))

    const result = await load()

    expect(result).toEqual({ default: 'ok' })
    expect(sessionStorage.getItem(RELOAD_KEY)).toBeNull()
  })

  it('reloads the page once and never resolves when the import fails for the first time', async () => {
    const load = lazyImportWithReload(() => Promise.reject(new Error('chunk 404')))

    let settled = false
    load().then(() => {
      settled = true
    })
    await Promise.resolve()
    await Promise.resolve()

    expect(reloadSpy).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem(RELOAD_KEY)).toBe('1')
    expect(settled).toBe(false)
  })

  it('throws instead of reloading again if a reload was already attempted', async () => {
    sessionStorage.setItem(RELOAD_KEY, '1')
    const load = lazyImportWithReload(() => Promise.reject(new Error('still broken')))

    await expect(load()).rejects.toThrow('still broken')
    expect(reloadSpy).not.toHaveBeenCalled()
  })
})
