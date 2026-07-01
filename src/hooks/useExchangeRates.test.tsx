import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchExchangeRateToHKD = vi.fn()
vi.mock('../lib/fxApi', () => ({ fetchExchangeRateToHKD: (...a: unknown[]) => fetchExchangeRateToHKD(...a) }))

const { useExchangeRates } = await import('./useExchangeRates')

describe('useExchangeRates', () => {
  beforeEach(() => {
    fetchExchangeRateToHKD.mockReset()
  })

  it('fetches a rate for each distinct currency and returns a map', async () => {
    fetchExchangeRateToHKD.mockImplementation((currency: string) =>
      Promise.resolve(currency === 'JPY' ? 0.052 : 1),
    )

    const { result } = renderHook(() => useExchangeRates(['JPY', 'HKD']))

    await waitFor(() => expect(result.current).toEqual({ JPY: 0.052, HKD: 1 }))
  })

  it('omits currencies whose rate could not be fetched', async () => {
    fetchExchangeRateToHKD.mockResolvedValue(null)

    const { result } = renderHook(() => useExchangeRates(['XXX']))

    await waitFor(() => expect(fetchExchangeRateToHKD).toHaveBeenCalled())
    expect(result.current).toEqual({})
  })
})
