import { nearestNeighborOrder, totalRouteDistanceKm } from '../lib/routeOptimize'
import type { ItineraryStop } from '../types/models'

const MIN_SAVINGS_KM = 0.05

interface RouteOptimizationCardProps {
  stops: ItineraryStop[]
  onApply: (newOrder: ItineraryStop[]) => void
}

export function RouteOptimizationCard({ stops, onApply }: RouteOptimizationCardProps) {
  const allLocated = stops.length >= 3 && stops.every((s) => s.lat != null && s.lng != null)
  if (!allLocated) return null

  const points = stops.map((s) => ({ lat: s.lat as number, lng: s.lng as number }))
  const currentDistance = totalRouteDistanceKm(points)
  const order = nearestNeighborOrder(points)
  const optimizedDistance = totalRouteDistanceKm(order.map((i) => points[i]))
  const savings = currentDistance - optimizedDistance

  if (savings <= MIN_SAVINGS_KM) return null

  return (
    <section aria-label="順路分析">
      <p>可以更順路，省 {savings.toFixed(1)}km</p>
      <button type="button" onClick={() => onApply(order.map((i) => stops[i]))}>
        一鍵套用
      </button>
    </section>
  )
}
