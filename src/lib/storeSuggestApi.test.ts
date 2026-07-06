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

  it('returns [] without calling the API when no key is configured', async () => {
    vi.stubEnv('VITE_TOMTOM_KEY', '')
    const result = await searchStoresForItem('曲奇', 35.68, 139.69)
    expect(result).toEqual([])
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns up to 3 stores with name, address, and null price level', async () => {
    vi.stubEnv('VITE_TOMTOM_KEY', 'test-key')
    const body = {
      results: [
        { poi: { name: '銀座曲奇本店' }, address: { freeformAddress: '東京都中央区' } },
        { poi: { name: '分店A' }, address: { freeformAddress: '東京都新宿区' } },
        { poi: { name: '分店B' }, address: { freeformAddress: '東京都澀谷区' } },
        { poi: { name: '分店C' }, address: { freeformAddress: '東京都台東区' } },
      ],
    }
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }))

    const result = await searchStoresForItem('曲奇', 35.68, 139.69)

    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ name: '銀座曲奇本店', address: '東京都中央区', priceLevel: null })

    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url as string).toContain(encodeURIComponent('曲奇'))
    expect(url as string).toContain('lat=35.68')
    expect(url as string).toContain('lon=139.69')
  })

  it('returns [] when the API responds with a non-ok status', async () => {
    vi.stubEnv('VITE_TOMTOM_KEY', 'test-key')
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 500 }))
    expect(await searchStoresForItem('曲奇', 35.68, 139.69)).toEqual([])
  })

  it('returns [] when the fetch call throws', async () => {
    vi.stubEnv('VITE_TOMTOM_KEY', 'test-key')
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))
    expect(await searchStoresForItem('曲奇', 35.68, 139.69)).toEqual([])
  })
})
