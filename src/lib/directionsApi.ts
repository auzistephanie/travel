export type TransportMode = 'WALK' | 'TRANSIT' | 'DRIVE'

export interface TransportEstimate {
  mode: TransportMode
  durationMinutes: number
}

interface LatLng {
  lat: number
  lng: number
}

interface ComputeRoutesResponse {
  routes?: { duration?: string }[]
}

export async function fetchTransportEstimate(
  from: LatLng,
  to: LatLng,
  mode: TransportMode,
): Promise<TransportEstimate | null> {
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY
  if (!key) return null

  try {
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'routes.duration',
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: from.lat, longitude: from.lng } } },
        destination: { location: { latLng: { latitude: to.lat, longitude: to.lng } } },
        travelMode: mode,
      }),
    })
    if (!response.ok) return null

    const body = (await response.json()) as ComputeRoutesResponse
    const duration = body.routes?.[0]?.duration
    if (!duration) return null

    const seconds = Number.parseInt(duration.replace('s', ''), 10)
    if (Number.isNaN(seconds)) return null

    return { mode, durationMinutes: Math.round(seconds / 60) }
  } catch {
    return null
  }
}
