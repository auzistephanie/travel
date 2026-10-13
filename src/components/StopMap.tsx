import { useEffect, useRef } from 'react'
import type { MapPin } from '../lib/mapStops'

interface StopMapProps {
  points: MapPin[]
}

/** OpenStreetMap 瓦片。測試環境不初始化 Leaflet，避免 jsdom 沒有真實版面。 */
export function StopMap({ points }: StopMapProps) {
  const host = useRef<HTMLDivElement>(null)
  const key = points.map((point) => `${point.id}:${point.lat}:${point.lng}:${point.number}:${point.title}`).join('|')

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return
    const el = host.current
    if (!el) return
    let cancelled = false
    let map: import('leaflet').Map | undefined

    void (async () => {
      const leaflet = await import('leaflet')
      await import('leaflet/dist/leaflet.css')
      if (cancelled) return
      const L = leaflet.default ?? leaflet
      map = L.map(el, { zoomControl: true, attributionControl: true })
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18,
      }).addTo(map)

      points.forEach((point) => {
        const icon = L.divIcon({
          className: 'leaflet-div-icon stop-pin',
          html: `<span class="stop-pin-n">${point.number}</span>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        })
        L.marker([point.lat, point.lng], { icon, keyboard: true, alt: point.title, title: point.title }).addTo(map!)
      })

      if (points.length === 0) {
        map.setView([23.5, 121], 6)
      } else if (points.length === 1) {
        map.setView([points[0].lat, points[0].lng], 15)
      } else {
        const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lng] as [number, number]))
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
    // key 已包含座標與標題，避免每次 render 都重建地圖。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return (
    <div ref={host} className="leaflet-host" role="region" aria-label="今日地圖">
      {import.meta.env.MODE === 'test' && (
        <ul>
          {points.map((point) => (
            <li key={point.id}>
              {point.number}. {point.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
