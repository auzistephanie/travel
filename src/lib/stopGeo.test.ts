import { describe, expect, it } from 'vitest'
import { averageCoordinates } from './stopGeo'

describe('averageCoordinates', () => {
  it('averages the lat/lng of stops that have coordinates', () => {
    const result = averageCoordinates([
      { lat: 35.0, lng: 139.0 },
      { lat: 37.0, lng: 141.0 },
    ])
    expect(result).toEqual({ lat: 36, lng: 140 })
  })

  it('ignores stops without coordinates', () => {
    const result = averageCoordinates([
      { lat: 35.0, lng: 139.0 },
      { lat: null, lng: null },
    ])
    expect(result).toEqual({ lat: 35, lng: 139 })
  })

  it('returns null when no stop has coordinates', () => {
    expect(averageCoordinates([{ lat: null, lng: null }])).toBeNull()
    expect(averageCoordinates([])).toBeNull()
  })
})
