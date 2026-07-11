import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { findNearbyConvenienceStore, findNearbyRestroom } from './facilitiesApi'

describe('findNearbyRestroom', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the nearest restroom from Overpass', async () => {
    const body = { elements: [{ lat: 35.712, lon: 139.795, tags: { name: '公共洗手間' } }] }
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }))

    const result = await findNearbyRestroom(35.71, 139.79)

    expect(result).toEqual({ name: '公共洗手間', lat: 35.712, lng: 139.795 })
    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('https://overpass-api.de/api/interpreter')
    expect(init?.body as string).toContain('35.71')
    expect(init?.body as string).toContain('139.79')
  })

  it('falls back to a generic name when the node has no name tag', async () => {
    const body = { elements: [{ lat: 35.712, lon: 139.795, tags: {} }] }
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }))
    const result = await findNearbyRestroom(35.71, 139.79)
    expect(result?.name).toBe('洗手間')
  })

  it('returns null when nothing is found', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ elements: [] }), { status: 200 }))
    expect(await findNearbyRestroom(35.71, 139.79)).toBeNull()
  })

  it('returns null when the request fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))
    expect(await findNearbyRestroom(35.71, 139.79)).toBeNull()
  })
})

describe('findNearbyConvenienceStore', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the nearest convenience store from Overpass', async () => {
    const body = { elements: [{ lat: 35.713, lon: 139.796, tags: { name: '7-Eleven' } }] }
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }))

    const result = await findNearbyConvenienceStore(35.71, 139.79)

    expect(result).toEqual({ name: '7-Eleven', lat: 35.713, lng: 139.796 })
    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('https://overpass-api.de/api/interpreter')
    expect(init?.body as string).toContain('shop')
    expect(init?.body as string).toContain('convenience')
  })

  it('falls back to a generic name when the node has no name tag', async () => {
    const body = { elements: [{ lat: 35.713, lon: 139.796, tags: {} }] }
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }))
    const result = await findNearbyConvenienceStore(35.71, 139.79)
    expect(result?.name).toBe('便利店')
  })

  it('returns null when nothing is found', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ elements: [] }), { status: 200 }))
    expect(await findNearbyConvenienceStore(35.71, 139.79)).toBeNull()
  })

  it('returns null when the request fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))
    expect(await findNearbyConvenienceStore(35.71, 139.79)).toBeNull()
  })
})
