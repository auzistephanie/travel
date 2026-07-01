import { haversineDistanceKm } from './geo'

interface LatLng {
  lat: number
  lng: number
}

export function totalRouteDistanceKm(points: LatLng[]): number {
  let total = 0
  for (let i = 0; i < points.length - 1; i++) {
    total += haversineDistanceKm(points[i], points[i + 1])
  }
  return total
}

// Nearest-neighbor heuristic: first stop stays fixed (spec §3 "第一站固定"),
// each subsequent stop is the closest unvisited point to the current one.
export function nearestNeighborOrder(points: LatLng[]): number[] {
  if (points.length <= 2) return points.map((_, i) => i)

  const visited = new Set<number>([0])
  const order = [0]

  while (visited.size < points.length) {
    const current = points[order[order.length - 1]]
    let nearestIndex = -1
    let nearestDistance = Infinity

    points.forEach((point, index) => {
      if (visited.has(index)) return
      const distance = haversineDistanceKm(current, point)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = index
      }
    })

    order.push(nearestIndex)
    visited.add(nearestIndex)
  }

  return order
}
