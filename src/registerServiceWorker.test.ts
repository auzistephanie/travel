import { afterEach, describe, expect, it, vi } from 'vitest'
import { registerServiceWorker } from './registerServiceWorker'

describe('registerServiceWorker', () => {
  afterEach(() => {
    // @ts-expect-error cleaning up a test-only stub
    delete navigator.serviceWorker
  })

  it('registers /sw.js when the browser supports service workers', () => {
    const register = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'serviceWorker', { value: { register }, configurable: true })

    registerServiceWorker()

    expect(register).toHaveBeenCalledWith('/sw.js')
  })

  it('does nothing when the browser has no serviceWorker support', () => {
    Object.defineProperty(navigator, 'serviceWorker', { value: undefined, configurable: true })
    expect(() => registerServiceWorker()).not.toThrow()
  })
})
