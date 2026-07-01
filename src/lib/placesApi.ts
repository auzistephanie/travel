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

export async function searchPlaces(query: string): Promise<PlaceResult[]> {
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
      body: JSON.stringify({ textQuery: query }),
    })
    if (!response.ok) return []

    const body = (await response.json()) as PlacesSearchTextResponse

    return (body.places ?? []).map((place) => ({
      name: place.displayName?.text ?? '',
      address: place.formattedAddress ?? '',
      lat: place.location?.latitude ?? 0,
      lng: place.location?.longitude ?? 0,
    }))
  } catch {
    return []
  }
}
