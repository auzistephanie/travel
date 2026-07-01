import { describe, expect, it } from 'vitest'
import { googleMapsUrl } from './mapsLink'

describe('googleMapsUrl', () => {
  it('uses lat/lng when available', () => {
    const url = googleMapsUrl({ lat: 35.6762, lng: 139.6503, place_name: '淺草寺', title: '淺草寺' })
    expect(url).toBe('https://www.google.com/maps/search/?api=1&query=35.6762,139.6503')
  })

  it('falls back to place_name when coordinates are missing', () => {
    const url = googleMapsUrl({ lat: null, lng: null, place_name: '淺草寺', title: '參觀寺廟' })
    expect(url).toBe('https://www.google.com/maps/search/?api=1&query=%E6%B7%BA%E8%8D%89%E5%AF%BA')
  })

  it('falls back to title when place_name and coordinates are missing', () => {
    const url = googleMapsUrl({ lat: null, lng: null, place_name: null, title: '參觀寺廟' })
    expect(url).toBe('https://www.google.com/maps/search/?api=1&query=%E5%8F%83%E8%A7%80%E5%AF%BA%E5%BB%9F')
  })
})
