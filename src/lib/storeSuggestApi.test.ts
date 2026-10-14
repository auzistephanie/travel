import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { searchStoresForItem } from './storeSuggestApi'

describe('searchStoresForItem', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses Nominatim near the coordinates before any TomTom proxy call', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([{ name: '銀座曲奇本店', display_name: '東京都中央區', lat: '35.67', lon: '139.76' }]),
        { status: 200 },
      ),
    )

    const result = await searchStoresForItem('曲奇-s1', 35.68, 139.69)

    expect(result).toEqual([
      { name: '銀座曲奇本店', address: '東京都中央區', priceLevel: null, lat: 35.67, lng: 139.76 },
    ])
    expect(fetch).toHaveBeenCalledTimes(1)
    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url as string).toContain('nominatim.openstreetmap.org')
    expect(url as string).toContain('bounded=1')
  })

  it('falls back to the TomTom proxy when Nominatim finds nothing', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            results: [
              {
                poi: { name: 'Cookie Shop' },
                address: { freeformAddress: 'Tokyo' },
                position: { lat: 35.6, lon: 139.7 },
              },
            ],
          }),
          { status: 200 },
        ),
      )

    const result = await searchStoresForItem('cookie-s2', 35.68, 139.69)

    expect(result[0]).toEqual({ name: 'Cookie Shop', address: 'Tokyo', priceLevel: null, lat: 35.6, lng: 139.7 })
    const fallback = vi.mocked(fetch).mock.calls[1][0] as string
    expect(fallback).toContain('/api/tomtom-search?')
    expect(fallback).toContain('type=search')
    expect(fallback).not.toContain('key=')
  })

  it('returns [] when Nominatim is empty and the proxy says the key is not configured', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'not_configured' }), { status: 503 }))

    expect(await searchStoresForItem('曲奇-s3', 35.68, 139.69)).toEqual([])
    expect(vi.mocked(fetch).mock.calls[1][0] as string).toContain('/api/tomtom-search?')
  })

  it('returns [] when both sources fail', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 500 }))
    expect(await searchStoresForItem('曲奇-s4', 35.68, 139.69)).toEqual([])
  })
})
