import { warnApiFailure } from './apiWarn'

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
    if (!response.ok) {
      warnApiFailure('facilitiesApi', `HTTP ${response.status}`)
      return null
    }

    const body = (await response.json()) as OverpassResponse
    const first = body.elements?.[0]
    if (!first) return null

    return { name: first.tags?.name ?? '洗手間', lat: first.lat, lng: first.lon }
  } catch (error) {
    warnApiFailure('facilitiesApi', error)
    return null
  }
}

// 便利店都改用 Overpass（同洗手間一致）—— TomTom 嘅 POI 資料喺呢類日常小店覆蓋好弱
// （實測搵到錯嘅充電站），OSM 對日本 7-Eleven/FamilyMart/Lawson 呢類 shop=convenience 標註反而齊全準確，
// 而且完全免 key。
export async function findNearbyConvenienceStore(lat: number, lng: number): Promise<FacilityResult | null> {
  const query = `[out:json];node["shop"="convenience"](around:${NEARBY_RADIUS_METERS},${lat},${lng});out 1;`

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
    })
    if (!response.ok) {
      warnApiFailure('facilitiesApi', `HTTP ${response.status}`)
      return null
    }

    const body = (await response.json()) as OverpassResponse
    const first = body.elements?.[0]
    if (!first) return null

    return { name: first.tags?.name ?? '便利店', lat: first.lat, lng: first.lon }
  } catch (error) {
    warnApiFailure('facilitiesApi', error)
    return null
  }
}
