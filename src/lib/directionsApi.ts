import { warnApiFailure } from './apiWarn'

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
    if (!response.ok) {
      warnApiFailure('directionsApi', `HTTP ${response.status}`)
      return null
    }

    const body = (await response.json()) as TomTomRouteResponse
    const seconds = body.routes?.[0]?.summary?.travelTimeInSeconds
    if (seconds == null) return null

    return { mode, durationMinutes: Math.round(seconds / 60) }
  } catch (error) {
    warnApiFailure('directionsApi', error)
    return null
  }
}

// 電車：市面冇一個「免信用卡又齊亞洲覆蓋」嘅公共交通 routing API（TomTom 冇呢類產品；
// HERE 而家個 free tier 都要留卡；Rome2Rio/OpenTripPlanner 要不就要申請要不就要自己 host）。
// 所以「電車」mode 唔叫任何 API，改用 googleMapsTransitUrl() 出返個官方連結，
// 用戶撳落去自己去 Google Maps 查（用返 Google 最強嘅日/韓/台鐵路資料），純 URL scheme 唔使 key。
export async function fetchTransportEstimate(
  from: LatLng,
  to: LatLng,
  mode: TransportMode,
): Promise<TransportEstimate | null> {
  if (mode === 'TRANSIT') return null
  return fetchTomTomEstimate(from, to, mode)
}

export function googleMapsTransitUrl(from: LatLng, to: LatLng): string {
  const params = new URLSearchParams({
    api: '1',
    origin: `${from.lat},${from.lng}`,
    destination: `${to.lat},${to.lng}`,
    travelmode: 'transit',
  })
  return `https://www.google.com/maps/dir/?${params.toString()}`
}
