import { warnApiFailure } from './apiWarn'

export interface StoreSuggestion {
  name: string
  address: string
  priceLevel: string | null
  lat?: number
  lng?: number
}

interface TomTomSearchResponse {
  results?: {
    poi?: { name?: string }
    address?: { freeformAddress?: string }
    position?: { lat?: number; lon?: number }
  }[]
}

const SEARCH_RADIUS_METERS = 10000
const MAX_SUGGESTIONS = 3

// TomTom Search API 冇價格等級資料（Google Places 先有 priceLevel），
// 呢度恆定 null——UI（AddWishlistForm）本身已經識處理 null，唔會顯示參考價位，唔使改 UI。
export async function searchStoresForItem(itemName: string, lat: number, lng: number): Promise<StoreSuggestion[]> {
  const key = import.meta.env.VITE_TOMTOM_KEY
  if (!key) return []

  try {
    const params = new URLSearchParams({
      key,
      lat: String(lat),
      lon: String(lng),
      radius: String(SEARCH_RADIUS_METERS),
      limit: String(MAX_SUGGESTIONS),
    })

    const response = await fetch(
      `https://api.tomtom.com/search/2/search/${encodeURIComponent(itemName)}.json?${params.toString()}`,
    )
    if (!response.ok) {
      warnApiFailure('storeSuggestApi', `HTTP ${response.status}`)
      return []
    }

    const body = (await response.json()) as TomTomSearchResponse

    return (body.results ?? []).slice(0, MAX_SUGGESTIONS).map((result) => {
      const suggestion: StoreSuggestion = {
        name: result.poi?.name ?? '',
        address: result.address?.freeformAddress ?? '',
        priceLevel: null,
      }
      if (result.position?.lat != null && result.position?.lon != null) {
        suggestion.lat = result.position.lat
        suggestion.lng = result.position.lon
      }
      return suggestion
    })
  } catch (error) {
    warnApiFailure('storeSuggestApi', error)
    return []
  }
}
