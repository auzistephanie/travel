import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchTransportEstimate } from './directionsApi'

const from = { lat: 35.71, lng: 139.79 }
const to = { lat: 35.72, lng: 139.8 }

describe('fetchTransportEstimate', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('returns null without calling the API when no key is configured', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_KEY', '')
    const result = await fetchTransportEstimate(from, to, 'WALK')
    expect(result).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns the duration in minutes, rounded', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_KEY', 'test-key')
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ routes: [{ duration: '754s' }] }), { status: 200 }),
    )

    const result = await fetchTransportEstimate(from, to, 'TRANSIT')

    expect(result).toEqual({ mode: 'TRANSIT', durationMinutes: 13 })
    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('https://routes.googleapis.com/directions/v2:computeRoutes')
    const body = JSON.parse(init?.body as string)
    expect(body.travelMode).toBe('TRANSIT')
    expect(body.origin.location.latLng).toEqual({ latitude: 35.71, longitude: 139.79 })
  })

  it('returns null when the API responds with a non-ok status', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_KEY', 'test-key')
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 500 }))
    expect(await fetchTransportEstimate(from, to, 'WALK')).toBeNull()
  })

  it('returns null when no route is found', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_KEY', 'test-key')
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ routes: [] }), { status: 200 }))
    expect(await fetchTransportEstimate(from, to, 'WALK')).toBeNull()
  })

  it('returns null when the fetch call throws', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_KEY', 'test-key')
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))
    expect(await fetchTransportEstimate(from, to, 'WALK')).toBeNull()
  })
})
