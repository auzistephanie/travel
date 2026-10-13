import { warnApiFailure } from './apiWarn'
import { searchPlacesNearby } from './placesApi'

export interface StoreSuggestion {
  name: string
  address: string
  priceLevel: string | null
  lat?: number
  lng?: number
}

// 主來源係 Nominatim（限住座標附近），TomTom 只係 fallback。
// 2026-07-29 已證實 TomTom 亞洲中文 POI 幾乎零覆蓋，手信「邊度買」一直用佢做主搜尋，中文貨名實質搵唔到。
export async function searchStoresForItem(itemName: string, lat: number, lng: number): Promise<StoreSuggestion[]> {
  try {
    const places = await searchPlacesNearby(itemName, lat, lng)
    return places.slice(0, 3).map((place) => ({
      name: place.name,
      address: place.address,
      priceLevel: null,
      lat: place.lat,
      lng: place.lng,
    }))
  } catch (error) {
    warnApiFailure('storeSuggestApi', error)
    return []
  }
}
