interface MapsLinkStop {
  lat: number | null
  lng: number | null
  place_name: string | null
  title: string
}

export function googleMapsUrl(stop: MapsLinkStop): string {
  if (stop.lat != null && stop.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${stop.lat},${stop.lng}`
  }
  const query = encodeURIComponent(stop.place_name || stop.title)
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}
