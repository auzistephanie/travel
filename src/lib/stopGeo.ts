interface GeoPoint {
  lat: number | null
  lng: number | null
}

export function averageCoordinates(stops: GeoPoint[]): { lat: number; lng: number } | null {
  const withCoords = stops.filter((s): s is { lat: number; lng: number } => s.lat != null && s.lng != null)
  if (withCoords.length === 0) return null

  const lat = withCoords.reduce((sum, s) => sum + s.lat, 0) / withCoords.length
  const lng = withCoords.reduce((sum, s) => sum + s.lng, 0) / withCoords.length
  return { lat, lng }
}
