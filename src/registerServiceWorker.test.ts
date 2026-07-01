import { afterEach, describe, expect, it, vi } from 'vitest'
import { registerServiceWorker } from './registerServiceWorker'

describe('registerServiceWorker', () => {
  afterEach(() => {
    // @ts-expect-error cleaning up a test-only stub
    delete navigator.serviceWorker
  })

  it('registers /sw.js in production when the browser supports service workers', () => {
    const register = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'serviceWorker', { value: { register }, configurable: true })

    registerServiceWorker(true)

    expect(register).toHaveBeenCalledWith('/sw.js')
  })

  it('does nothing outside production, even if the browser supports service workers', () => {
    const register = vi.fn()
    Object.defineProperty(navigator, 'serviceWorker', { value: { register }, configurable: true })

    registerServiceWorker(false)

    expect(register).not.toHaveBeenCalled()
  })

  it('does nothing when the browser has no serviceWorker support', () => {
    Object.defineProperty(navigator, 'serviceWorker', { value: undefined, configurable: true })
    expect(() => registerServiceWorker(true)).not.toThrow()
  })
})
