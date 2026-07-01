import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DayWeather } from '../lib/weatherApi'
import type { Trip } from '../types/models'

const useFlights = vi.fn()
vi.mock('./useFlights', () => ({ useFlights: () => useFlights() }))

const fetchWeather = vi.fn()
vi.mock('../lib/weatherApi', () => ({ fetchWeather: (...args: unknown[]) => fetchWeather(...args) }))

const { useDestinationWeather } = await import('./useDestinationWeather')

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    name: '東京五日',
    start_date: '2026-08-01',
    end_date: '2026-08-02',
    share_code: 'ABC234',
    destination_country: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const sampleDay: DayWeather = { date: '2026-08-01', am: { tempC: 28, rainProbability: 10 }, pm: { tempC: 30, rainProbability: 20 } }

describe('useDestinationWeather', () => {
  beforeEach(() => {
    useFlights.mockReset()
    fetchWeather.mockReset()
  })

  it('fetches weather from the first flight arrival airport when no destination_country is set', async () => {
    useFlights.mockReturnValue({
      flights: [
        {
          id: 'f1',
          trip_id: 't1',
          code: 'CX500',
          from_airport: 'HKG',
          to_airport: 'NRT',
          from_time: '2026-08-01T09:00:00Z',
          to_time: '2026-08-01T14:00:00Z',
          date: '2026-08-01',
          gate: null,
          terminal: null,
          seat: null,
          pnr: null,
          baggage_kg: null,
          member_id: null,
        },
      ],
    })
    fetchWeather.mockResolvedValue([sampleDay])

    const { result } = renderHook(() => useDestinationWeather(makeTrip()))

    await waitFor(() => expect(result.current['2026-08-01']).toEqual(sampleDay))
    expect(fetchWeather).toHaveBeenCalledWith(35.7647, 140.3864, '2026-08-01', '2026-08-02')
  })

  it('fetches weather from the explicit destination_country even when there are no flights yet', async () => {
    useFlights.mockReturnValue({ flights: [] })
    fetchWeather.mockResolvedValue([sampleDay])

    const { result } = renderHook(() => useDestinationWeather(makeTrip({ destination_country: 'TH' })))

    await waitFor(() => expect(result.current['2026-08-01']).toEqual(sampleDay))
    expect(fetchWeather).toHaveBeenCalledWith(13.69, 100.7501, '2026-08-01', '2026-08-02')
  })

  it('returns empty when there is neither a destination_country nor any flights', () => {
    useFlights.mockReturnValue({ flights: [] })
    const { result } = renderHook(() => useDestinationWeather(makeTrip()))
    expect(result.current).toEqual({})
    expect(fetchWeather).not.toHaveBeenCalled()
  })
})
