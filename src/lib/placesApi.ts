export interface PlaceResult {
  name: string
  address: string
  lat: number
  lng: number
}

interface PlacesSearchTextResponse {
  places?: {
    displayName?: { text?: string }
    formattedAddress?: string
    location?: { latitude?: number; longitude?: number }
  }[]
}

async function searchTextPlaces(body: Record<string, unknown>): Promise<PlaceResult[]> {
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY
  if (!key) return []

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location',
      },
      body: JSON.stringify(body),
    })
    if (!response.ok) return []

    const responseBody = (await response.json()) as PlacesSearchTextResponse

    return (responseBody.places ?? []).map((place) => ({
      name: place.displayName?.text ?? '',
      address: place.formattedAddress ?? '',
      lat: place.location?.latitude ?? 0,
      lng: place.location?.longitude ?? 0,
    }))
  } catch {
    return []
  }
}

export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  return searchTextPlaces({ textQuery: query })
}

const INDOOR_SEARCH_RADIUS_METERS = 5000

export async function searchIndoorPlaces(lat: number, lng: number): Promise<PlaceResult[]> {
  return searchTextPlaces({
    textQuery: '商場 博物館 水族館',
    locationBias: {
      circle: { center: { latitude: lat, longitude: lng }, radius: INDOOR_SEARCH_RADIUS_METERS },
    },
  })
}
