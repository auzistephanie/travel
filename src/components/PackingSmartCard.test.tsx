import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PackingSmartCard } from './PackingSmartCard'
import type { Trip, TripMember } from '../types/models'

const useFlights = vi.fn()
vi.mock('../hooks/useFlights', () => ({ useFlights: () => useFlights() }))

const useDestinationWeather = vi.fn()
vi.mock('../hooks/useDestinationWeather', () => ({ useDestinationWeather: () => useDestinationWeather() }))

const fetchExchangeRateToHKD = vi.fn()
vi.mock('../lib/fxApi', () => ({ fetchExchangeRateToHKD: (...a: unknown[]) => fetchExchangeRateToHKD(...a) }))

const trip: Trip = {
  id: 't1',
  name: '東京五日',
  start_date: '2026-08-01',
  end_date: '2026-08-05',
  share_code: 'ABC234',
  destination_country: null,
  created_at: '2026-01-01T00:00:00Z',
}
const members: TripMember[] = [
  { id: 'm1', trip_id: 't1', name: '阿明', color: null, is_owner: true },
  { id: 'm2', trip_id: 't1', name: '阿珍', color: null, is_owner: false },
]

const flightToNRT = {
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
  baggage_kg: 30,
  member_id: 'm1',
}

describe('PackingSmartCard', () => {
  beforeEach(() => {
    useFlights.mockReset()
    useDestinationWeather.mockReset()
    fetchExchangeRateToHKD.mockReset()
    fetchExchangeRateToHKD.mockResolvedValue(0.052)
  })

  it('renders nothing when there are no flights yet (destination unknown)', () => {
    useFlights.mockReturnValue({ flights: [] })
    useDestinationWeather.mockReturnValue({})

    const { container } = render(<PackingSmartCard trip={trip} members={members} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows plug/voltage, visa note, and cash advice for the detected destination', async () => {
    useFlights.mockReturnValue({ flights: [flightToNRT] })
    useDestinationWeather.mockReturnValue({})

    render(<PackingSmartCard trip={trip} members={members} />)

    expect(screen.getByText(/A 型/)).toBeInTheDocument()
    expect(screen.getByText(/100V/)).toBeInTheDocument()
    expect(screen.getByText(/免簽證/)).toBeInTheDocument()
    expect(await screen.findByText(/HK\$/)).toBeInTheDocument()
  })

  it('shows temperature-driven tips based on the trip weather range', () => {
    useFlights.mockReturnValue({ flights: [flightToNRT] })
    useDestinationWeather.mockReturnValue({
      '2026-08-01': { date: '2026-08-01', am: { tempC: 30, rainProbability: 0 }, pm: { tempC: 33, rainProbability: 0 } },
    })

    render(<PackingSmartCard trip={trip} members={members} />)
    expect(screen.getByText(/手提風扇/)).toBeInTheDocument()
  })

  it('shows per-member baggage allowance from their assigned flight', () => {
    useFlights.mockReturnValue({ flights: [flightToNRT] })
    useDestinationWeather.mockReturnValue({})

    render(<PackingSmartCard trip={trip} members={members} />)
    expect(screen.getByText(/阿明/)).toBeInTheDocument()
    expect(screen.getByText(/30kg/)).toBeInTheDocument()
    expect(screen.queryByText(/阿珍/)).not.toBeInTheDocument()
  })
})
