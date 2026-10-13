import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { searchStoresForItem } from './storeSuggestApi'

describe('searchStoresForItem', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('uses Nominatim near the coordinates even when TomTom has no key', async () => {
    vi.stubEnv('VITE_TOMTOM_KEY', '')
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([
          { name: '銀座曲奇本店', display_name: '東京都中央區', lat: '35.67', lon: '139.76' },
        ]),
        { status: 200 },
      ),
    )

    const result = await searchStoresForItem('曲奇-s1', 35.68, 139.69)

    expect(result).toEqual([
      { name: '銀座曲奇本店', address: '東京都中央區', priceLevel: null, lat: 35.67, lng: 139.76 },
    ])
    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url as string).toContain('nominatim.openstreetmap.org')
    expect(url as string).toContain('bounded=1')
  })

  it('falls back to TomTom when Nominatim finds nothing and a key is set', async () => {
    vi.stubEnv('VITE_TOMTOM_KEY', 'test-key')
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            results: [{ poi: { name: 'Cookie Shop' }, address: { freeformAddress: 'Tokyo' }, position: { lat: 35.6, lon: 139.7 } }],
          }),
          { status: 200 },
        ),
      )

    const result = await searchStoresForItem('cookie-s2', 35.68, 139.69)

    expect(result[0]).toEqual({ name: 'Cookie Shop', address: 'Tokyo', priceLevel: null, lat: 35.6, lng: 139.7 })
    const fallback = vi.mocked(fetch).mock.calls[1][0] as string
    expect(fallback).toContain('api.tomtom.com')
    expect(fallback).toContain('key=test-key')
  })

  it('returns [] when both sources are unavailable', async () => {
    vi.stubEnv('VITE_TOMTOM_KEY', '')
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 500 }))
    expect(await searchStoresForItem('曲奇-s3', 35.68, 139.69)).toEqual([])
  })
})
