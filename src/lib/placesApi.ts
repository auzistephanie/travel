import { warnApiFailure } from './apiWarn'

export interface PlaceResult {
  name: string
  address: string
  lat: number
  lng: number
}

interface TomTomSearchResponse {
  results?: {
    poi?: { name?: string }
    address?: { freeformAddress?: string }
    position?: { lat?: number; lon?: number }
  }[]
}

interface SearchOptions {
  lat?: number
  lng?: number
  radiusMeters?: number
  countryCode?: string | null
}

const SEARCH_LIMIT = 8

async function searchTomTom(query: string, options?: SearchOptions): Promise<PlaceResult[]> {
  const key = import.meta.env.VITE_TOMTOM_KEY
  if (!key) return []

  try {
    const params = new URLSearchParams({ key, limit: String(SEARCH_LIMIT) })
    if (options?.lat != null && options?.lng != null) {
      params.set('lat', String(options.lat))
      params.set('lon', String(options.lng))
      if (options.radiusMeters != null) params.set('radius', String(options.radiusMeters))
    }
    // countrySet 篩選返同一個目的地國家嘅結果——冇呢個嘅話 TomTom 對通用景點名（例如「東京鐵塔」）
    // 會撈埋其他國家撞名嘅小店（實測搵咗高雄一間叫「東京鐵板燒」嘅餐廳），加咗準好多。
    if (options?.countryCode) {
      params.set('countrySet', options.countryCode)
    }

    const response = await fetch(
      `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?${params.toString()}`,
    )
    if (!response.ok) {
      warnApiFailure('placesApi', `HTTP ${response.status}`)
      return []
    }

    const body = (await response.json()) as TomTomSearchResponse

    return (body.results ?? []).map((result) => ({
      name: result.poi?.name ?? '',
      address: result.address?.freeformAddress ?? '',
      lat: result.position?.lat ?? 0,
      lng: result.position?.lon ?? 0,
    }))
  } catch (error) {
    warnApiFailure('placesApi', error)
    return []
  }
}

export async function searchPlaces(query: string, countryCode?: string | null): Promise<PlaceResult[]> {
  const results = await searchTomTom(query, { countryCode })
  // countrySet 篩得太緊會令結果變空——例如 trip 目的地國家揀錯（實例：一個名叫
  // 「Taiwan」嘅行程 destination_country 誤存做 KR，搜台灣地點全部被鎖死喺韓國），
  // 或者用戶想搜第二個國家嘅地方。有帶 countryCode 但搵唔到時，退一步再搜一次唔帶
  // countrySet，至少畀返結果而唔係得個「找不到相關地點」。
  if (results.length === 0 && countryCode) {
    return searchTomTom(query, {})
  }
  return results
}

const INDOOR_SEARCH_RADIUS_METERS = 5000

export async function searchIndoorPlaces(lat: number, lng: number): Promise<PlaceResult[]> {
  return searchTomTom('商場 博物館 水族館', { lat, lng, radiusMeters: INDOOR_SEARCH_RADIUS_METERS })
}
