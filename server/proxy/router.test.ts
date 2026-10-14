// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dispatchApi } from './router.ts'

const env = {
  AVIATIONSTACK_KEY: 'aviation-secret',
  TOMTOM_KEY: 'tomtom-secret',
  TAGGUN_API_KEY: 'taggun-secret',
}

describe('dispatchApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns 503 and does not call upstream when the flight key is missing', async () => {
    const response = await dispatchApi(new Request('http://localhost/api/flights?flight_iata=CX123&flight_date=2026-08-01'), {})
    expect(response.status).toBe(503)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('calls AviationStack with the server key and does not echo the key', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }))

    const response = await dispatchApi(
      new Request('http://localhost/api/flights?flight_iata=cx123&flight_date=2026-08-01'),
      env,
    )

    expect(response.status).toBe(200)
    const upstream = vi.mocked(fetch).mock.calls[0][0] as URL
    expect(String(upstream)).toContain('https://api.aviationstack.com/v1/flights')
    expect(String(upstream)).toContain('access_key=aviation-secret')
    expect(String(upstream)).toContain('flight_iata=CX123')
    expect(await response.text()).not.toContain('aviation-secret')
  })

  it('rejects a flight code that is not an allowlisted shape', async () => {
    const response = await dispatchApi(
      new Request('http://localhost/api/flights?flight_iata=https://evil.test&flight_date=2026-08-01'),
      env,
    )
    expect(response.status).toBe(400)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('calls TomTom search with the server key', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ results: [] }), { status: 200 }))

    const response = await dispatchApi(
      new Request('http://localhost/api/tomtom-search?type=poi&query=%E6%B7%BA%E8%8D%89%E5%AF%BA&limit=8&countrySet=jp'),
      env,
    )

    expect(response.status).toBe(200)
    const upstream = String(vi.mocked(fetch).mock.calls[0][0])
    expect(upstream).toContain('https://api.tomtom.com/search/2/poiSearch/')
    expect(upstream).toContain('key=tomtom-secret')
    expect(upstream).toContain('countrySet=JP')
    expect(await response.text()).not.toContain('tomtom-secret')
  })

  it('calls TomTom routing only for pedestrian or car', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ routes: [{ summary: { travelTimeInSeconds: 60 } }] }), { status: 200 }),
    )

    const ok = await dispatchApi(
      new Request(
        'http://localhost/api/tomtom-route?fromLat=35.71&fromLng=139.79&toLat=35.72&toLng=139.8&travelMode=pedestrian',
      ),
      env,
    )
    expect(ok.status).toBe(200)
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('travelMode=pedestrian')

    const blocked = await dispatchApi(
      new Request(
        'http://localhost/api/tomtom-route?fromLat=35.71&fromLng=139.79&toLat=35.72&toLng=139.8&travelMode=truck',
      ),
      env,
    )
    expect(blocked.status).toBe(400)
  })

  it('forwards a receipt to Taggun with the server key header', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ merchantName: { data: '店' } }), { status: 200 }))
    const form = new FormData()
    form.append('file', new File(['bytes'], 'receipt.jpg', { type: 'image/jpeg' }))

    const response = await dispatchApi(new Request('http://localhost/api/taggun', { method: 'POST', body: form }), env)

    expect(response.status).toBe(200)
    const [, init] = vi.mocked(fetch).mock.calls[0]
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toBe('https://api.taggun.io/api/receipt/v1/simple/file')
    expect(new Headers(init?.headers).get('apikey')).toBe('taggun-secret')
    expect(await response.text()).not.toContain('taggun-secret')
  })

  it('rejects a non-image upload before calling Taggun', async () => {
    const form = new FormData()
    form.append('file', new File(['bytes'], 'notes.txt', { type: 'text/plain' }))
    const response = await dispatchApi(new Request('http://localhost/api/taggun', { method: 'POST', body: form }), env)
    expect(response.status).toBe(415)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns 404 for an unknown proxy path', async () => {
    const response = await dispatchApi(new Request('http://localhost/api/somewhere-else'), env)
    expect(response.status).toBe(404)
    expect(fetch).not.toHaveBeenCalled()
  })
})
