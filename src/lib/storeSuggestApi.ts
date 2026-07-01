export interface StoreSuggestion {
  name: string
  address: string
  priceLevel: string | null
}

interface PlacesSearchTextResponse {
  places?: { displayName?: { text?: string }; formattedAddress?: string; priceLevel?: string }[]
}

const SEARCH_RADIUS_METERS = 10000
const MAX_SUGGESTIONS = 3

// 冇專門嘅價格比較 API，用 Places API 就目的地附近搵返 2-3 間分店；
// priceLevel 只係粗略等級（平/中/貴），唔係實際價錢區間。
export async function searchStoresForItem(itemName: string, lat: number, lng: number): Promise<StoreSuggestion[]> {
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY
  if (!key) return []

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.priceLevel',
      },
      body: JSON.stringify({
        textQuery: itemName,
        locationBias: {
          circle: { center: { latitude: lat, longitude: lng }, radius: SEARCH_RADIUS_METERS },
        },
      }),
    })
    if (!response.ok) return []

    const body = (await response.json()) as PlacesSearchTextResponse

    return (body.places ?? []).slice(0, MAX_SUGGESTIONS).map((place) => ({
      name: place.displayName?.text ?? '',
      address: place.formattedAddress ?? '',
      priceLevel: place.priceLevel ?? null,
    }))
  } catch {
    return []
  }
}
