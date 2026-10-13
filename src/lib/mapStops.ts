import type { ItineraryStop } from '../types/models'

export interface MapPin {
  id: string
  title: string
  lat: number
  lng: number
  number: number
}

export async function resolveMapPins(
  stops: ItineraryStop[],
  country: string | null,
  geocode: (query: string, country: string | null) => Promise<{ lat: number; lng: number } | null>,
): Promise<{ pins: MapPin[]; unplaced: string[] }> {
  const pins: MapPin[] = []
  const unplaced: string[] = []

  for (const [index, stop] of stops.entries()) {
    if (stop.lat != null && stop.lng != null) {
      pins.push({ id: stop.id, title: stop.title, lat: stop.lat, lng: stop.lng, number: index + 1 })
      continue
    }

    const query = (stop.place_name || stop.title).trim()
    const found = query ? await geocode(query, country) : null
    if (!found) {
      unplaced.push(stop.title)
      continue
    }
    pins.push({ id: stop.id, title: stop.title, lat: found.lat, lng: found.lng, number: index + 1 })
  }

  return { pins, unplaced }
}
