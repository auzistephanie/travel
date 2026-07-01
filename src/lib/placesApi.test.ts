import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { searchPlaces } from './placesApi'

describe('searchPlaces', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('returns an empty list without calling the API when no key is configured', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_KEY', '')
    const result = await searchPlaces('淺草寺')
    expect(result).toEqual([])
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns an empty list when the API responds with a non-ok status', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_KEY', 'test-key')
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 500 }))
    const result = await searchPlaces('淺草寺')
    expect(result).toEqual([])
  })

  it('returns an empty list when the fetch call throws', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_KEY', 'test-key')
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))
    const result = await searchPlaces('淺草寺')
    expect(result).toEqual([])
  })

  it('maps places from the API response', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_KEY', 'test-key')
    const body = {
      places: [
        {
          displayName: { text: '淺草寺' },
          formattedAddress: '2 Chome-3-1 Asakusa, Taito City, Tokyo',
          location: { latitude: 35.7148, longitude: 139.7967 },
        },
      ],
    }
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }))

    const result = await searchPlaces('淺草寺')

    expect(result).toEqual([
      { name: '淺草寺', address: '2 Chome-3-1 Asakusa, Taito City, Tokyo', lat: 35.7148, lng: 139.7967 },
    ])

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('https://places.googleapis.com/v1/places:searchText')
    expect(init?.method).toBe('POST')
    expect((init?.headers as Record<string, string>)['X-Goog-Api-Key']).toBe('test-key')
    expect(JSON.parse(init?.body as string)).toEqual({ textQuery: '淺草寺' })
  })
})
