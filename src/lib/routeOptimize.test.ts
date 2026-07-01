import { describe, expect, it } from 'vitest'
import { nearestNeighborOrder, totalRouteDistanceKm } from './routeOptimize'

describe('totalRouteDistanceKm', () => {
  it('sums the distance between consecutive points', () => {
    const points = [
      { lat: 0, lng: 0 },
      { lat: 1, lng: 0 },
      { lat: 2, lng: 0 },
    ]
    const total = totalRouteDistanceKm(points)
    expect(total).toBeCloseTo(222.4, 0)
  })

  it('is 0 for a single point or empty list', () => {
    expect(totalRouteDistanceKm([{ lat: 0, lng: 0 }])).toBe(0)
    expect(totalRouteDistanceKm([])).toBe(0)
  })
})

describe('nearestNeighborOrder', () => {
  it('keeps the first point fixed and visits the nearest unvisited point each step', () => {
    // Fixed start at index 0 (lat 0). Index 2 (lat 0.1) is much closer than index 1 (lat 5).
    const points = [
      { lat: 0, lng: 0 },
      { lat: 5, lng: 0 },
      { lat: 0.1, lng: 0 },
    ]
    expect(nearestNeighborOrder(points)).toEqual([0, 2, 1])
  })

  it('returns the trivial order for 2 or fewer points', () => {
    expect(nearestNeighborOrder([{ lat: 0, lng: 0 }])).toEqual([0])
    expect(
      nearestNeighborOrder([
        { lat: 0, lng: 0 },
        { lat: 1, lng: 1 },
      ]),
    ).toEqual([0, 1])
  })
})
