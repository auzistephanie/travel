import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { searchIndoorPlaces, searchPlaces } from './placesApi'

// ⚠️ placesApi 有 module-level cache：同一條 query 第二次唔會再打 fetch。
// 所以每個 test 都用唔同 query 字串（後綴 -a1/-a2…），唔好貪方便共用。
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })

describe('searchPlaces（主來源 Nominatim / OSM）', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('打 Nominatim、帶 accept-language=zh-Hant，並 map 返 PlaceResult', async () => {
    vi.mocked(fetch).mockResolvedValue(
      ok([{ name: '淺草寺', display_name: '淺草寺, 台東區, 東京都, 日本', lat: '35.7148', lon: '139.7967' }]),
    )

    const result = await searchPlaces('淺草寺-a1')

    expect(result).toEqual([
      { name: '淺草寺', address: '淺草寺, 台東區, 東京都, 日本', lat: 35.7148, lng: 139.7967 },
    ])
    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url as string).toContain('nominatim.openstreetmap.org/search')
    expect(url as string).toContain('accept-language=zh-Hant')
  })

  it('冇 name 嗰行，用 display_name 第一段做名', async () => {
    vi.mocked(fetch).mockResolvedValue(
      ok([{ display_name: '東京鐵塔, 港區, 東京都, 日本', lat: '35.6586', lon: '139.7454' }]),
    )

    const result = await searchPlaces('東京鐵塔-a2')

    expect(result[0].name).toBe('東京鐵塔')
  })

  it('lat/lon 唔係數字嘅行會被剔走', async () => {
    vi.mocked(fetch).mockResolvedValue(
      ok([
        { name: '壞資料', display_name: '壞資料', lat: 'x', lon: 'y' },
        { name: '好資料', display_name: '好資料', lat: '1', lon: '2' },
      ]),
    )

    const result = await searchPlaces('混合-a3')

    expect(result).toEqual([{ name: '好資料', address: '好資料', lat: 1, lng: 2 }])
  })

  it('有目的地國家 → 帶 countrycodes（細寫）', async () => {
    vi.mocked(fetch).mockResolvedValue(ok([{ name: 'A', display_name: 'A', lat: '1', lon: '2' }]))

    await searchPlaces('東京鐵塔-a4', 'JP')

    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url as string).toContain('countrycodes=jp')
  })

  it('冇目的地國家 → 唔帶 countrycodes', async () => {
    vi.mocked(fetch).mockResolvedValue(ok([{ name: 'A', display_name: 'A', lat: '1', lon: '2' }]))

    await searchPlaces('東京鐵塔-a5')

    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url as string).not.toContain('countrycodes')
  })

  it('限國搵唔到 → 退一步唔限國再搵（目的地國家存錯都唔會鎖死）', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(ok([]))
      .mockResolvedValueOnce(ok([{ name: 'Taipei 101', display_name: 'Taipei 101, 信義區', lat: '25.0339', lon: '121.5645' }]))

    // 目的地誤存做 KR，但實際搵台灣地點。
    const result = await searchPlaces('Taipei 101-a6', 'KR')

    expect(result).toEqual([{ name: 'Taipei 101', address: 'Taipei 101, 信義區', lat: 25.0339, lng: 121.5645 }])
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(vi.mocked(fetch).mock.calls[0][0] as string).toContain('countrycodes=kr')
    expect(vi.mocked(fetch).mock.calls[1][0] as string).not.toContain('countrycodes')
  })

  it('限國已經有結果 → 唔會再打第二次', async () => {
    vi.mocked(fetch).mockResolvedValue(ok([{ name: 'A', display_name: 'A', lat: '1', lon: '2' }]))

    await searchPlaces('淺草寺-a7', 'JP')

    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('Nominatim 兩步都空 + 有 TomTom key → fallback 打 TomTom', async () => {
    vi.stubEnv('VITE_TOMTOM_KEY', 'test-key')
    vi.mocked(fetch)
      .mockResolvedValueOnce(ok([]))
      .mockResolvedValueOnce(ok([]))
      .mockResolvedValueOnce(
        ok({
          results: [
            {
              poi: { name: '淺草寺' },
              address: { freeformAddress: 'Asakusa, Tokyo' },
              position: { lat: 35.7148, lon: 139.7967 },
            },
          ],
        }),
      )

    const result = await searchPlaces('淺草寺-a8', 'JP')

    expect(result).toEqual([{ name: '淺草寺', address: 'Asakusa, Tokyo', lat: 35.7148, lng: 139.7967 }])
    expect(fetch).toHaveBeenCalledTimes(3)
    expect(vi.mocked(fetch).mock.calls[2][0] as string).toContain('api.tomtom.com')
  })

  it('Nominatim 空 + 冇 TomTom key → 回 []，唔會多打一次 fetch', async () => {
    vi.stubEnv('VITE_TOMTOM_KEY', '')
    vi.mocked(fetch).mockResolvedValue(ok([]))

    const result = await searchPlaces('冇結果-a9')

    expect(result).toEqual([])
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('HTTP 非 2xx → 回 []', async () => {
    vi.stubEnv('VITE_TOMTOM_KEY', '')
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 500 }))

    await expect(searchPlaces('淺草寺-a10')).resolves.toEqual([])
  })

  it('fetch 拋錯 → 回 []（唔會炸上去）', async () => {
    vi.stubEnv('VITE_TOMTOM_KEY', '')
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))

    await expect(searchPlaces('淺草寺-a11')).resolves.toEqual([])
  })
})

describe('searchIndoorPlaces（雨天室內推介 / Overpass OSM）', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('POST 去 Overpass，query 帶 around + 座標（免 key，冇 key 都要照打）', async () => {
    vi.stubEnv('VITE_TOMTOM_KEY', '')
    vi.mocked(fetch).mockResolvedValue(ok({ elements: [] }))

    await searchIndoorPlaces(35.68, 139.69)

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url as string).toContain('overpass-api.de/api/interpreter')
    expect((init as RequestInit).method).toBe('POST')
    const body = decodeURIComponent(String((init as RequestInit).body))
    expect(body).toContain('around:5000,35.68,139.69')
    expect(body).toContain('shop"="mall')
  })

  it('map 返 PlaceResult，address 用中文分類標籤', async () => {
    vi.mocked(fetch).mockResolvedValue(
      ok({
        elements: [
          { lat: 35.7, lon: 139.7, tags: { name: 'Sunshine City', shop: 'mall' } },
          { lat: 35.71, lon: 139.71, tags: { name: 'Tokyo National Museum', tourism: 'museum' } },
        ],
      }),
    )

    const result = await searchIndoorPlaces(35.7, 139.7)

    expect(result).toEqual([
      { name: 'Sunshine City', address: '商場', lat: 35.7, lng: 139.7 },
      { name: 'Tokyo National Museum', address: '博物館', lat: 35.71, lng: 139.71 },
    ])
  })

  it('有 name:zh-Hant 就優先出繁體名', async () => {
    vi.mocked(fetch).mockResolvedValue(
      ok({
        elements: [
          { lat: 1, lon: 2, tags: { name: 'Sumida Aquarium', 'name:zh-Hant': '墨田水族館', tourism: 'aquarium' } },
        ],
      }),
    )

    const result = await searchIndoorPlaces(1, 2)

    expect(result).toEqual([{ name: '墨田水族館', address: '水族館', lat: 1, lng: 2 }])
  })

  it('冇名或冇座標嘅 node 會被剔走', async () => {
    vi.mocked(fetch).mockResolvedValue(
      ok({
        elements: [
          { lat: 1, lon: 2, tags: { shop: 'mall' } },
          { tags: { name: '冇座標', shop: 'mall' } },
          { lat: 3, lon: 4, tags: { name: '正常', shop: 'mall' } },
        ],
      }),
    )

    const result = await searchIndoorPlaces(1, 2)

    expect(result).toEqual([{ name: '正常', address: '商場', lat: 3, lng: 4 }])
  })

  it('HTTP 非 2xx → 回 []', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 504 }))

    await expect(searchIndoorPlaces(1, 2)).resolves.toEqual([])
  })

  it('fetch 拋錯 → 回 []', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('overpass down'))

    await expect(searchIndoorPlaces(1, 2)).resolves.toEqual([])
  })
})
