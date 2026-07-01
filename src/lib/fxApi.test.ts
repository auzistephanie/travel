import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchExchangeRateToHKD } from './fxApi'

describe('fetchExchangeRateToHKD', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns 1 for HKD without calling the API', async () => {
    const result = await fetchExchangeRateToHKD('HKD')
    expect(result).toBe(1)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns the HKD rate from the response', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ result: 'success', base_code: 'JPY', rates: { HKD: 0.052 } }), { status: 200 }),
    )
    const result = await fetchExchangeRateToHKD('JPY')
    expect(result).toBe(0.052)
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe('https://open.er-api.com/v6/latest/JPY')
  })

  it('returns null when the API responds with a non-ok status', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 500 }))
    expect(await fetchExchangeRateToHKD('JPY')).toBeNull()
  })

  it('returns null when the fetch call throws', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))
    expect(await fetchExchangeRateToHKD('JPY')).toBeNull()
  })
})
