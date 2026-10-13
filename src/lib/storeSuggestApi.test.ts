import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { searchStoresForItem } from './storeSuggestApi'

describe('searchStoresForItem', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses Nominatim near the given coordinates before TomTom', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([
          { name: '銀座曲奇本店', display_name: '東京都中央区', lat: '35.67', lon: '139.76' },
          { name: '分店A', display_name: '東京都新宿区', lat: '35.69', lon: '139.70' },
          { name: '分店B', display_name: '東京都澀谷区', lat: '35.66', lon: '139.70' },
          { name: '分店C', display_name: '東京都台東区', lat: '35.71', lon: '139.78' },
        ]),
        { status: 200 },
      ),
    )

    const result = await searchStoresForItem('曲奇', 35.68, 139.69)

    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({
      name: '銀座曲奇本店',
      address: '東京都中央区',
      priceLevel: null,
      lat: 35.67,
      lng: 139.76,
    })
    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url as string).toContain('nominatim.openstreetmap.org')
    expect(url as string).toContain(encodeURIComponent('曲奇'))
    expect(url as string).toContain('viewbox=')
    expect(url as string).not.toContain('/api/tomtom-search')
  })

  it('falls back to the TomTom proxy when Nominatim has no results', async () => {
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

    const result = await searchStoresForItem('cookie', 35.68, 139.69)

    expect(result).toEqual([
      { name: 'Cookie Shop', address: 'Tokyo', priceLevel: null, lat: 35.6, lng: 139.7 },
    ])
    const fallback = vi.mocked(fetch).mock.calls[1][0] as string
    expect(fallback).toContain('/api/tomtom-search?')
    expect(fallback).not.toContain('key=')
  })

  it('returns [] when both sources are unavailable', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response('', { status: 500 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'not_configured' }), { status: 503 }))
    expect(await searchStoresForItem('曲奇', 35.68, 139.69)).toEqual([])
  })

  it('returns [] when the fetch call throws', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))
    expect(await searchStoresForItem('曲奇', 35.68, 139.69)).toEqual([])
  })
})
