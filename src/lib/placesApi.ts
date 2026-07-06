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

interface LocationBias {
  lat: number
  lng: number
  radiusMeters: number
}

const SEARCH_LIMIT = 8

async function searchTomTom(query: string, bias?: LocationBias): Promise<PlaceResult[]> {
  const key = import.meta.env.VITE_TOMTOM_KEY
  if (!key) return []

  try {
    const params = new URLSearchParams({ key, limit: String(SEARCH_LIMIT) })
    if (bias) {
      params.set('lat', String(bias.lat))
      params.set('lon', String(bias.lng))
      params.set('radius', String(bias.radiusMeters))
    }

    const response = await fetch(
      `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?${params.toString()}`,
    )
    if (!response.ok) return []

    const body = (await response.json()) as TomTomSearchResponse

    return (body.results ?? []).map((result) => ({
      name: result.poi?.name ?? '',
      address: result.address?.freeformAddress ?? '',
      lat: result.position?.lat ?? 0,
      lng: result.position?.lon ?? 0,
    }))
  } catch {
    return []
  }
}

export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  return searchTomTom(query)
}

const INDOOR_SEARCH_RADIUS_METERS = 5000

export async function searchIndoorPlaces(lat: number, lng: number): Promise<PlaceResult[]> {
  return searchTomTom('商場 博物館 水族館', { lat, lng, radiusMeters: INDOOR_SEARCH_RADIUS_METERS })
}
