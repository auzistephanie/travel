export interface FacilityResult {
  name: string
  lat: number
  lng: number
}

const NEARBY_RADIUS_METERS = 500

interface OverpassResponse {
  elements?: { lat: number; lon: number; tags?: { name?: string } }[]
}

export async function findNearbyRestroom(lat: number, lng: number): Promise<FacilityResult | null> {
  const query = `[out:json];node["amenity"="toilets"](around:${NEARBY_RADIUS_METERS},${lat},${lng});out 1;`

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
    })
    if (!response.ok) return null

    const body = (await response.json()) as OverpassResponse
    const first = body.elements?.[0]
    if (!first) return null

    return { name: first.tags?.name ?? '洗手間', lat: first.lat, lng: first.lon }
  } catch {
    return null
  }
}

interface PlacesSearchNearbyResponse {
  places?: { displayName?: { text?: string }; location?: { latitude?: number; longitude?: number } }[]
}

export async function findNearbyConvenienceStore(lat: number, lng: number): Promise<FacilityResult | null> {
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY
  if (!key) return null

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'places.displayName,places.location',
      },
      body: JSON.stringify({
        includedTypes: ['convenience_store'],
        maxResultCount: 1,
        locationRestriction: {
          circle: { center: { latitude: lat, longitude: lng }, radius: NEARBY_RADIUS_METERS },
        },
      }),
    })
    if (!response.ok) return null

    const body = (await response.json()) as PlacesSearchNearbyResponse
    const first = body.places?.[0]
    if (!first) return null

    return {
      name: first.displayName?.text ?? '便利店',
      lat: first.location?.latitude ?? lat,
      lng: first.location?.longitude ?? lng,
    }
  } catch {
    return null
  }
}
