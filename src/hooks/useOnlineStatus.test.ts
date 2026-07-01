import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useOnlineStatus } from './useOnlineStatus'

describe('useOnlineStatus', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true })
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true })
  })

  it('reflects navigator.onLine at mount time', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true, writable: true })
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(false)
  })

  it('updates to false when the browser goes offline', () => {
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(true)

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    expect(result.current).toBe(false)
  })

  it('updates back to true when the browser comes back online', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true, writable: true })
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(false)

    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true })
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(result.current).toBe(true)
  })
})
