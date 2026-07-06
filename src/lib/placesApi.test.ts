import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { searchIndoorPlaces, searchPlaces } from './placesApi'

describe('searchPlaces', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('returns an empty list without calling the API when no key is configured', async () => {
    vi.stubEnv('VITE_TOMTOM_KEY', '')
    const result = await searchPlaces('淺草寺')
    expect(result).toEqual([])
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns an empty list when the API responds with a non-ok status', async () => {
    vi.stubEnv('VITE_TOMTOM_KEY', 'test-key')
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 500 }))
    const result = await searchPlaces('淺草寺')
    expect(result).toEqual([])
  })

  it('returns an empty list when the fetch call throws', async () => {
    vi.stubEnv('VITE_TOMTOM_KEY', 'test-key')
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))
    const result = await searchPlaces('淺草寺')
    expect(result).toEqual([])
  })

  it('maps places from the API response', async () => {
    vi.stubEnv('VITE_TOMTOM_KEY', 'test-key')
    const body = {
      results: [
        {
          poi: { name: '淺草寺' },
          address: { freeformAddress: '2 Chome-3-1 Asakusa, Taito City, Tokyo' },
          position: { lat: 35.7148, lon: 139.7967 },
        },
      ],
    }
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }))

    const result = await searchPlaces('淺草寺')

    expect(result).toEqual([
      { name: '淺草寺', address: '2 Chome-3-1 Asakusa, Taito City, Tokyo', lat: 35.7148, lng: 139.7967 },
    ])

    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url as string).toContain('https://api.tomtom.com/search/2/search/')
    expect(url as string).toContain(encodeURIComponent('淺草寺'))
    expect(url as string).toContain('key=test-key')
  })
})

describe('searchIndoorPlaces', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('returns [] without calling the API when no key is configured', async () => {
    vi.stubEnv('VITE_TOMTOM_KEY', '')
    const result = await searchIndoorPlaces(35.68, 139.69)
    expect(result).toEqual([])
    expect(fetch).not.toHaveBeenCalled()
  })

  it('biases the search near the given coordinates', async () => {
    vi.stubEnv('VITE_TOMTOM_KEY', 'test-key')
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ results: [] }), { status: 200 }))

    await searchIndoorPlaces(35.68, 139.69)

    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url as string).toContain('lat=35.68')
    expect(url as string).toContain('lon=139.69')
  })
})
