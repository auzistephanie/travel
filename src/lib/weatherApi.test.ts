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

    const result = await fetchWeather(35.01, 139.69, '2026-08-01', '2026-08-01')

    expect(result).toEqual([
      {
        date: '2026-08-01',
        source: 'forecast',
        am: { tempC: 20, rainProbability: 10 },
        pm: { tempC: 30, rainProbability: 70 },
      },
    ])
    expect(vi.mocked(fetch).mock.calls[0][0] as string).toContain('api.open-meteo.com/v1/forecast')
    // 預報成功就唔應該再打 archive
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  // 註：mockResolvedValue 一次過蓋住 forecast 同 archive，所以兩邊都跛先會回 []。
  it('returns an empty array when both the forecast and the archive fallback fail', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 500 }))
    const result = await fetchWeather(35.02, 139.69, '2026-08-01', '2026-08-01')
    expect(result).toEqual([])
  })

  it('returns an empty array when every fetch call throws', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))
    const result = await fetchWeather(35.03, 139.69, '2026-08-01', '2026-08-01')
    expect(result).toEqual([])
  })
})

describe('fetchWeather —— 超出預報範圍時嘅歷年同期平均 fallback', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // Open-Meteo 預報只覆蓋未來 16 日，再遠就 400。呢個 fallback 就係為咗提早 plan 嗰批行程。
  function archiveDay(date: string, amTemp: number, pmTemp: number, amWetHours: number, pmWetHours: number) {
    const hourly = { time: [] as string[], temperature_2m: [] as number[], precipitation: [] as number[] }
    for (let h = 0; h < 24; h++) {
      hourly.time.push(`${date}T${String(h).padStart(2, '0')}:00`)
      hourly.temperature_2m.push(h < 12 ? amTemp : pmTemp)
      const wetQuota = h < 12 ? amWetHours : pmWetHours
      const indexInHalf = h < 12 ? h : h - 12
      hourly.precipitation.push(indexInHalf < wetQuota ? 1 : 0)
    }
    return new Response(JSON.stringify({ hourly }), { status: 200 })
  }

  it('預報 400 → 改打 archive，取 3 年同期平均，並標記 source=climate', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response('', { status: 400 })) // forecast 超出範圍
      .mockResolvedValueOnce(archiveDay('2025-09-01', 20, 30, 3, 6))
      .mockResolvedValueOnce(archiveDay('2024-09-01', 22, 32, 6, 6))
      .mockResolvedValueOnce(archiveDay('2023-09-01', 24, 34, 3, 0))

    const result = await fetchWeather(35.04, 139.69, '2026-09-01', '2026-09-01')

    // 溫度 = 三年平均；雨機率 = 三年「有雨時數比例」平均
    expect(result).toEqual([
      {
        date: '2026-09-01',
        source: 'climate',
        am: { tempC: 22, rainProbability: 33 },
        pm: { tempC: 32, rainProbability: 33 },
      },
    ])
    expect(fetch).toHaveBeenCalledTimes(4)
    expect(vi.mocked(fetch).mock.calls[1][0] as string).toContain('archive-api.open-meteo.com')
  })

  it('日期對齊靠「行程第幾日」，唔係靠日曆日期（跨年行程唔會錯位）', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response('', { status: 400 }))
      .mockResolvedValueOnce(archiveDay('2025-12-31', 10, 12, 0, 0))
      .mockResolvedValueOnce(archiveDay('2024-12-31', 10, 12, 0, 0))
      .mockResolvedValueOnce(archiveDay('2023-12-31', 10, 12, 0, 0))

    const result = await fetchWeather(35.05, 139.69, '2026-12-31', '2026-12-31')

    expect(result).toHaveLength(1)
    expect(result[0].date).toBe('2026-12-31')
    const [, firstArchiveUrl] = [null, vi.mocked(fetch).mock.calls[1][0] as string]
    expect(firstArchiveUrl).toContain('start_date=2025-12-31')
  })

  it('archive 只有部分年份成功都照計', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response('', { status: 400 }))
      .mockResolvedValueOnce(archiveDay('2025-09-01', 20, 30, 0, 0))
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockRejectedValueOnce(new Error('archive down'))

    const result = await fetchWeather(35.06, 139.69, '2026-09-01', '2026-09-01')

    expect(result).toEqual([
      { date: '2026-09-01', source: 'climate', am: { tempC: 20, rainProbability: 0 }, pm: { tempC: 30, rainProbability: 0 } },
    ])
  })
})

describe('fetchWeather —— cache', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('同一段行程重複叫只會打一次 API（hook 會觸發 4 次，唔可以扑爆免費 API）', async () => {
    const hourly = { time: [] as string[], temperature_2m: [] as number[], precipitation_probability: [] as number[] }
    for (let h = 0; h < 24; h++) {
      hourly.time.push(`2026-08-01T${String(h).padStart(2, '0')}:00`)
      hourly.temperature_2m.push(25)
      hourly.precipitation_probability.push(10)
    }
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ hourly }), { status: 200 }))

    const args = [35.9, 139.9, '2026-08-01', '2026-08-01'] as const
    const [a, b, c, d] = await Promise.all([
      fetchWeather(...args),
      fetchWeather(...args),
      fetchWeather(...args),
      fetchWeather(...args),
    ])

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(a).toEqual(b)
    expect(c).toEqual(d)
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
