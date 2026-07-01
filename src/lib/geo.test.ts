import { describe, expect, it } from 'vitest'
import { haversineDistanceKm } from './geo'

describe('haversineDistanceKm', () => {
  it('returns 0 for the same point', () => {
    expect(haversineDistanceKm({ lat: 35.7, lng: 139.7 }, { lat: 35.7, lng: 139.7 })).toBe(0)
  })

  it('matches the ~111km-per-degree-latitude rule of thumb near the equator', () => {
    const distance = haversineDistanceKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })
    expect(distance).toBeGreaterThan(110)
    expect(distance).toBeLessThan(112)
  })
})
