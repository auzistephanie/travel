import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { lookupFlight, lookupFlightDetailed } from './flightApi'

describe('lookupFlight', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns null when the proxy says the key is not configured', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ error: 'not_configured' }), { status: 503 }))
    const result = await lookupFlight('CX123', '2026-08-01')
    expect(result).toBeNull()
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(calledUrl).toContain('/api/flights?')
    expect(calledUrl).not.toContain('access_key')
  })

  it('reports unconfigured on 503 and failed on other errors', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 503 }))
    await expect(lookupFlightDetailed('CX123', '2026-08-01')).resolves.toEqual({ status: 'unconfigured' })

    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 500 }))
    await expect(lookupFlightDetailed('CX123', '2026-08-01')).resolves.toEqual({ status: 'failed' })
  })

  it('returns null when the API responds with a non-ok status', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 500 }))
    const result = await lookupFlight('CX123', '2026-08-01')
    expect(result).toBeNull()
  })

  it('returns null when no matching flight is found', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }))
    const result = await lookupFlight('CX123', '2026-08-01')
    expect(result).toBeNull()
  })

  it('returns null when the fetch call throws', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))
    const result = await lookupFlight('CX123', '2026-08-01')
    expect(result).toBeNull()
  })

  it('maps the first matching flight to a lookup result', async () => {
    const apiBody = {
      data: [
        {
          departure: { iata: 'HKG', scheduled: '2026-08-01T10:00:00+00:00', gate: 'A1', terminal: '1' },
          arrival: { iata: 'NRT', scheduled: '2026-08-01T15:00:00+00:00' },
        },
      ],
    }
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(apiBody), { status: 200 }))

    const result = await lookupFlight('CX123', '2026-08-01')

    expect(result).toEqual({
      fromAirport: 'HKG',
      toAirport: 'NRT',
      fromTime: '2026-08-01T10:00:00+00:00',
      toTime: '2026-08-01T15:00:00+00:00',
      gate: 'A1',
      terminal: '1',
    })

    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(calledUrl).toContain('/api/flights?')
    expect(calledUrl).toContain('flight_iata=CX123')
    expect(calledUrl).toContain('flight_date=2026-08-01')
    expect(calledUrl).not.toContain('access_key')
  })
})
