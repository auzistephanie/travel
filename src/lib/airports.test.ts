import { describe, expect, it } from 'vitest'
import { getAirport, getAirportForCountry, getFirstFlightAirport } from './airports'
import type { Flight } from '../types/models'

describe('getAirport', () => {
  it('returns coordinates and country for a known airport', () => {
    expect(getAirport('NRT')).toEqual({ lat: 35.7647, lng: 140.3864, country: 'JP' })
  })

  it('returns undefined for an unknown airport', () => {
    expect(getAirport('ZZZ')).toBeUndefined()
  })
})

describe('getAirportForCountry', () => {
  it('returns a representative airport for a supported country code', () => {
    expect(getAirportForCountry('JP')).toEqual({ lat: 35.7647, lng: 140.3864, country: 'JP' })
  })

  it('returns undefined for an unsupported country code', () => {
    expect(getAirportForCountry('FR')).toBeUndefined()
  })
})

describe('getFirstFlightAirport', () => {
  const base = {
    id: 'f',
    trip_id: 't1',
    from_airport: 'HKG',
    date: '2026-08-01',
    gate: null,
    terminal: null,
    seat: null,
    pnr: null,
    baggage_kg: null,
    member_id: null,
  }

  it('returns the arrival airport of the earliest-departing flight', () => {
    const flights: Flight[] = [
      { ...base, id: 'f2', code: 'CX2', to_airport: 'ICN', from_time: '2026-08-03T10:00:00Z', to_time: '2026-08-03T15:00:00Z' },
      { ...base, id: 'f1', code: 'CX1', to_airport: 'NRT', from_time: '2026-08-01T10:00:00Z', to_time: '2026-08-01T15:00:00Z' },
    ]
    expect(getFirstFlightAirport(flights)).toBe('NRT')
  })

  it('returns undefined when there are no flights', () => {
    expect(getFirstFlightAirport([])).toBeUndefined()
  })
})
