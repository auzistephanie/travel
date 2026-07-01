import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { lookupFlight } from './flightApi'

describe('lookupFlight', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('returns null without calling the API when no key is configured', async () => {
    vi.stubEnv('VITE_AVIATIONSTACK_KEY', '')
    const result = await lookupFlight('CX123', '2026-08-01')
    expect(result).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns null when the API responds with a non-ok status', async () => {
    vi.stubEnv('VITE_AVIATIONSTACK_KEY', 'test-key')
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 500 }))
    const result = await lookupFlight('CX123', '2026-08-01')
    expect(result).toBeNull()
  })

  it('returns null when no matching flight is found', async () => {
    vi.stubEnv('VITE_AVIATIONSTACK_KEY', 'test-key')
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }))
    const result = await lookupFlight('CX123', '2026-08-01')
    expect(result).toBeNull()
  })

  it('returns null when the fetch call throws', async () => {
    vi.stubEnv('VITE_AVIATIONSTACK_KEY', 'test-key')
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))
    const result = await lookupFlight('CX123', '2026-08-01')
    expect(result).toBeNull()
  })

  it('maps the first matching flight to a lookup result', async () => {
    vi.stubEnv('VITE_AVIATIONSTACK_KEY', 'test-key')
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
    expect(calledUrl).toContain('flight_iata=CX123')
    expect(calledUrl).toContain('flight_date=2026-08-01')
    expect(calledUrl).toContain('access_key=test-key')
  })
})
