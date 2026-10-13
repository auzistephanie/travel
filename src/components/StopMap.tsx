import { useEffect, useRef } from 'react'
import type { ItineraryStop } from '../types/models'

interface StopMapProps {
  stops: ItineraryStop[]
}

function pointsOf(stops: ItineraryStop[]) {
  return stops.filter((stop): stop is ItineraryStop & { lat: number; lng: number } => {
    return stop.lat != null && stop.lng != null
  })
}

/** OSM 地圖。測試環境唔初始化 Leaflet，避免 jsdom 冇真實版面。 */
export function StopMap({ stops }: StopMapProps) {
  const host = useRef<HTMLDivElement>(null)
  const key = pointsOf(stops)
    .map((stop) => `${stop.id}:${stop.lat}:${stop.lng}:${stop.title}`)
    .join('|')

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return
    const el = host.current
    if (!el) return
    let cancelled = false
    let map: import('leaflet').Map | undefined

    ;(async () => {
      const leaflet = await import('leaflet')
      await import('leaflet/dist/leaflet.css')
      if (cancelled) return
      const L = leaflet.default ?? leaflet
      map = L.map(el, { zoomControl: true, attributionControl: true })
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18,
      }).addTo(map)

      const points = pointsOf(stops)
      points.forEach((stop, index) => {
        const icon = L.divIcon({
          className: 'leaflet-div-icon stop-pin',
          html: `<span class="stop-pin-n">${index + 1}</span>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        })
        L.marker([stop.lat, stop.lng], { icon, keyboard: true, alt: stop.title, title: stop.title }).addTo(map!)
      })
      if (points.length === 0) {
        map.setView([23, 114], 3)
      } else if (points.length === 1) {
        map.setView([points[0].lat, points[0].lng], 14)
      } else {
        const bounds = L.latLngBounds(points.map((stop) => [stop.lat, stop.lng] as [number, number]))
        map.fitBounds(bounds.pad(0.35), { maxZoom: 15 })
      }
      const refresh = () => map?.invalidateSize()
      window.setTimeout(refresh, 80)
      window.setTimeout(refresh, 400)
    })()

    return () => {
      cancelled = true
      map?.remove()
    }
    // key 已經包住座標同標題，避免每次 render 都重建地圖。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return <div ref={host} className="leaflet-host" />
}
