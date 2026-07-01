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
    vi.stubEnv('VITE_GOOGLE_MAPS_KEY', '')
    const result = await searchStoresForItem('曲奇', 35.68, 139.69)
    expect(result).toEqual([])
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns up to 3 stores with name, address, and price level', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_KEY', 'test-key')
    const body = {
      places: [
        { displayName: { text: '銀座曲奇本店' }, formattedAddress: '東京都中央区', priceLevel: 'PRICE_LEVEL_MODERATE' },
        { displayName: { text: '分店A' }, formattedAddress: '東京都新宿区' },
        { displayName: { text: '分店B' }, formattedAddress: '東京都澀谷区' },
        { displayName: { text: '分店C' }, formattedAddress: '東京都台東区' },
      ],
    }
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }))

    const result = await searchStoresForItem('曲奇', 35.68, 139.69)

    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ name: '銀座曲奇本店', address: '東京都中央区', priceLevel: 'PRICE_LEVEL_MODERATE' })
    expect(result[1].priceLevel).toBeNull()

    const [, init] = vi.mocked(fetch).mock.calls[0]
    const requestBody = JSON.parse(init?.body as string)
    expect(requestBody.textQuery).toBe('曲奇')
    expect(requestBody.locationBias.circle.center).toEqual({ latitude: 35.68, longitude: 139.69 })
  })

  it('returns [] when the API responds with a non-ok status', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_KEY', 'test-key')
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 500 }))
    expect(await searchStoresForItem('曲奇', 35.68, 139.69)).toEqual([])
  })

  it('returns [] when the fetch call throws', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_KEY', 'test-key')
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))
    expect(await searchStoresForItem('曲奇', 35.68, 139.69)).toEqual([])
  })
})
