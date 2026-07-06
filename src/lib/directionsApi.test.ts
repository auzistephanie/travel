import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchTransportEstimate } from './directionsApi'

const from = { lat: 35.71, lng: 139.79 }
const to = { lat: 35.72, lng: 139.8 }

describe('fetchTransportEstimate — WALK/DRIVE (TomTom)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('returns null without calling the API when no TomTom key is configured', async () => {
    vi.stubEnv('VITE_TOMTOM_KEY', '')
    const result = await fetchTransportEstimate(from, to, 'WALK')
    expect(result).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns the duration in minutes, rounded', async () => {
    vi.stubEnv('VITE_TOMTOM_KEY', 'test-key')
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ routes: [{ summary: { travelTimeInSeconds: 754 } }] }), { status: 200 }),
    )

    const result = await fetchTransportEstimate(from, to, 'DRIVE')

    expect(result).toEqual({ mode: 'DRIVE', durationMinutes: 13 })
    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url as string).toContain('https://api.tomtom.com/routing/1/calculateRoute/35.71,139.79:35.72,139.8/json')
    expect(url as string).toContain('travelMode=car')
  })

  it('uses pedestrian travel mode for WALK', async () => {
    vi.stubEnv('VITE_TOMTOM_KEY', 'test-key')
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ routes: [{ summary: { travelTimeInSeconds: 600 } }] }), { status: 200 }),
    )

    await fetchTransportEstimate(from, to, 'WALK')

    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url as string).toContain('travelMode=pedestrian')
  })

  it('returns null when the API responds with a non-ok status', async () => {
    vi.stubEnv('VITE_TOMTOM_KEY', 'test-key')
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 500 }))
    expect(await fetchTransportEstimate(from, to, 'WALK')).toBeNull()
  })

  it('returns null when no route is found', async () => {
    vi.stubEnv('VITE_TOMTOM_KEY', 'test-key')
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ routes: [] }), { status: 200 }))
    expect(await fetchTransportEstimate(from, to, 'WALK')).toBeNull()
  })

  it('returns null when the fetch call throws', async () => {
    vi.stubEnv('VITE_TOMTOM_KEY', 'test-key')
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))
    expect(await fetchTransportEstimate(from, to, 'WALK')).toBeNull()
  })
})

describe('fetchTransportEstimate — TRANSIT (HERE)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('returns null without calling the API when no HERE key is configured', async () => {
    vi.stubEnv('VITE_HERE_API_KEY', '')
    const result = await fetchTransportEstimate(from, to, 'TRANSIT')
    expect(result).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('sums duration across all sections and rounds to minutes', async () => {
    vi.stubEnv('VITE_HERE_API_KEY', 'test-key')
    const body = {
      routes: [
        {
          sections: [{ travelSummary: { duration: 300 } }, { travelSummary: { duration: 454 } }],
        },
      ],
    }
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }))

    const result = await fetchTransportEstimate(from, to, 'TRANSIT')

    expect(result).toEqual({ mode: 'TRANSIT', durationMinutes: 13 })
    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url as string).toBe(
      'https://transit.hereapi.com/v8/routes?apiKey=test-key&origin=35.71%2C139.79&destination=35.72%2C139.8&return=travelSummary',
    )
  })

  it('returns null when the API responds with a non-ok status', async () => {
    vi.stubEnv('VITE_HERE_API_KEY', 'test-key')
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 500 }))
    expect(await fetchTransportEstimate(from, to, 'TRANSIT')).toBeNull()
  })

  it('returns null when no route is found', async () => {
    vi.stubEnv('VITE_HERE_API_KEY', 'test-key')
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ routes: [] }), { status: 200 }))
    expect(await fetchTransportEstimate(from, to, 'TRANSIT')).toBeNull()
  })

  it('returns null when the fetch call throws', async () => {
    vi.stubEnv('VITE_HERE_API_KEY', 'test-key')
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))
    expect(await fetchTransportEstimate(from, to, 'TRANSIT')).toBeNull()
  })
})
