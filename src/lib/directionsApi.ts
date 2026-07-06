export type TransportMode = 'WALK' | 'TRANSIT' | 'DRIVE'

export interface TransportEstimate {
  mode: TransportMode
  durationMinutes: number
}

interface LatLng {
  lat: number
  lng: number
}

type RoadTravelMode = 'WALK' | 'DRIVE'

const TOMTOM_TRAVEL_MODE: Record<RoadTravelMode, string> = { WALK: 'pedestrian', DRIVE: 'car' }

interface TomTomRouteResponse {
  routes?: { summary?: { travelTimeInSeconds?: number } }[]
}

async function fetchTomTomEstimate(from: LatLng, to: LatLng, mode: RoadTravelMode): Promise<TransportEstimate | null> {
  const key = import.meta.env.VITE_TOMTOM_KEY
  if (!key) return null

  try {
    const travelMode = TOMTOM_TRAVEL_MODE[mode]
    const response = await fetch(
      `https://api.tomtom.com/routing/1/calculateRoute/${from.lat},${from.lng}:${to.lat},${to.lng}/json` +
        `?key=${key}&travelMode=${travelMode}`,
    )
    if (!response.ok) return null

    const body = (await response.json()) as TomTomRouteResponse
    const seconds = body.routes?.[0]?.summary?.travelTimeInSeconds
    if (seconds == null) return null

    return { mode, durationMinutes: Math.round(seconds / 60) }
  } catch {
    return null
  }
}

interface HereTransitResponse {
  routes?: { sections?: { travelSummary?: { duration?: number } }[] }[]
}

// TomTom 冇公共交通 routing，「電車」mode 改用 HERE Public Transit API v8。
// 一程可能分幾段（步行接駁+搭車+步行），呢度攞晒成程每段 travelSummary.duration 加埋做總時間。
async function fetchHereTransitEstimate(from: LatLng, to: LatLng): Promise<TransportEstimate | null> {
  const key = import.meta.env.VITE_HERE_API_KEY
  if (!key) return null

  try {
    const params = new URLSearchParams({
      apiKey: key,
      origin: `${from.lat},${from.lng}`,
      destination: `${to.lat},${to.lng}`,
      return: 'travelSummary',
    })

    const response = await fetch(`https://transit.hereapi.com/v8/routes?${params.toString()}`)
    if (!response.ok) return null

    const body = (await response.json()) as HereTransitResponse
    const sections = body.routes?.[0]?.sections ?? []
    if (sections.length === 0) return null

    const totalSeconds = sections.reduce((sum, section) => sum + (section.travelSummary?.duration ?? 0), 0)
    if (totalSeconds <= 0) return null

    return { mode: 'TRANSIT', durationMinutes: Math.round(totalSeconds / 60) }
  } catch {
    return null
  }
}

export async function fetchTransportEstimate(
  from: LatLng,
  to: LatLng,
  mode: TransportMode,
): Promise<TransportEstimate | null> {
  if (mode === 'TRANSIT') return fetchHereTransitEstimate(from, to)
  return fetchTomTomEstimate(from, to, mode)
}
