import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchTransportEstimate, googleMapsTransitUrl } from './directionsApi'

const from = { lat: 35.71, lng: 139.79 }
const to = { lat: 35.72, lng: 139.8 }

describe('fetchTransportEstimate — WALK/DRIVE (TomTom)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns null when the proxy says the key is not configured', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ error: 'not_configured' }), { status: 503 }))
    const result = await fetchTransportEstimate(from, to, 'WALK')
    expect(result).toBeNull()
    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url as string).toContain('/api/tomtom-route?')
    expect(url as string).not.toContain('key=')
  })

  it('returns the duration in minutes, rounded', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ routes: [{ summary: { travelTimeInSeconds: 754 } }] }), { status: 200 }),
    )

    const result = await fetchTransportEstimate(from, to, 'DRIVE')

    expect(result).toEqual({ mode: 'DRIVE', durationMinutes: 13 })
    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url as string).toContain('/api/tomtom-route?')
    expect(url as string).toContain('fromLat=35.71')
    expect(url as string).toContain('fromLng=139.79')
    expect(url as string).toContain('toLat=35.72')
    expect(url as string).toContain('toLng=139.8')
    expect(url as string).toContain('travelMode=car')
    expect(url as string).not.toContain('key=')
  })

  it('uses pedestrian travel mode for WALK', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ routes: [{ summary: { travelTimeInSeconds: 600 } }] }), { status: 200 }),
    )

    await fetchTransportEstimate(from, to, 'WALK')

    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url as string).toContain('travelMode=pedestrian')
  })

  it('returns null when the API responds with a non-ok status', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 500 }))
    expect(await fetchTransportEstimate(from, to, 'WALK')).toBeNull()
  })

  it('returns null when no route is found', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ routes: [] }), { status: 200 }))
    expect(await fetchTransportEstimate(from, to, 'WALK')).toBeNull()
  })

  it('returns null when the fetch call throws', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))
    expect(await fetchTransportEstimate(from, to, 'WALK')).toBeNull()
  })
})

describe('fetchTransportEstimate — TRANSIT', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns null without calling any API — 電車冇 in-app 估算，改用連結', async () => {
    const result = await fetchTransportEstimate(from, to, 'TRANSIT')
    expect(result).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('googleMapsTransitUrl', () => {
  it('builds a Google Maps directions URL in transit mode', () => {
    const url = googleMapsTransitUrl(from, to)
    expect(url).toBe(
      'https://www.google.com/maps/dir/?api=1&origin=35.71%2C139.79&destination=35.72%2C139.8&travelmode=transit',
    )
  })
})
