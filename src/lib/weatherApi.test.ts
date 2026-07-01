import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { anyHalfDayRainAtLeast, fetchWeather, shouldSuggestIndoor, tripTemperatureRange } from './weatherApi'

describe('fetchWeather', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('groups hourly data into AM/PM temp average and max rain probability per day', async () => {
    const hourly = {
      time: [] as string[],
      temperature_2m: [] as number[],
      precipitation_probability: [] as number[],
    }
    for (let h = 0; h < 24; h++) {
      hourly.time.push(`2026-08-01T${String(h).padStart(2, '0')}:00`)
      hourly.temperature_2m.push(h < 12 ? 20 : 30)
      hourly.precipitation_probability.push(h < 12 ? 10 : 70)
    }
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ hourly }), { status: 200 }))

    const result = await fetchWeather(35.68, 139.69, '2026-08-01', '2026-08-01')

    expect(result).toEqual([
      { date: '2026-08-01', am: { tempC: 20, rainProbability: 10 }, pm: { tempC: 30, rainProbability: 70 } },
    ])
  })

  it('returns an empty array when the API responds with a non-ok status', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 500 }))
    const result = await fetchWeather(35.68, 139.69, '2026-08-01', '2026-08-01')
    expect(result).toEqual([])
  })

  it('returns an empty array when the fetch call throws', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))
    const result = await fetchWeather(35.68, 139.69, '2026-08-01', '2026-08-01')
    expect(result).toEqual([])
  })
})

describe('shouldSuggestIndoor', () => {
  it('is true when the AM rain probability is at or above 60%', () => {
    expect(
      shouldSuggestIndoor({ date: '2026-08-01', am: { tempC: 25, rainProbability: 60 }, pm: { tempC: 25, rainProbability: 10 } }),
    ).toBe(true)
  })

  it('is true when the PM rain probability is at or above 60%', () => {
    expect(
      shouldSuggestIndoor({ date: '2026-08-01', am: { tempC: 25, rainProbability: 10 }, pm: { tempC: 25, rainProbability: 60 } }),
    ).toBe(true)
  })

  it('is false when both halves are under 60%', () => {
    expect(
      shouldSuggestIndoor({ date: '2026-08-01', am: { tempC: 25, rainProbability: 59 }, pm: { tempC: 25, rainProbability: 59 } }),
    ).toBe(false)
  })
})

describe('tripTemperatureRange', () => {
  it('returns the min and max temperature across all days', () => {
    const days = [
      { date: '2026-08-01', am: { tempC: 20, rainProbability: 0 }, pm: { tempC: 32, rainProbability: 0 } },
      { date: '2026-08-02', am: { tempC: 15, rainProbability: 0 }, pm: { tempC: 28, rainProbability: 0 } },
    ]
    expect(tripTemperatureRange(days)).toEqual({ min: 15, max: 32 })
  })

  it('returns null for an empty list', () => {
    expect(tripTemperatureRange([])).toBeNull()
  })
})

describe('anyHalfDayRainAtLeast', () => {
  it('is true when any half-day meets the threshold', () => {
    const days = [{ date: '2026-08-01', am: { tempC: 25, rainProbability: 50 }, pm: { tempC: 25, rainProbability: 0 } }]
    expect(anyHalfDayRainAtLeast(days)).toBe(true)
  })

  it('is false when no half-day meets the threshold', () => {
    const days = [{ date: '2026-08-01', am: { tempC: 25, rainProbability: 49 }, pm: { tempC: 25, rainProbability: 10 } }]
    expect(anyHalfDayRainAtLeast(days)).toBe(false)
  })
})
