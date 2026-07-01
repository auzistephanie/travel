import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Trip, TripMember } from '../types/models'

const useFlights = vi.fn()
vi.mock('../hooks/useFlights', () => ({ useFlights: () => useFlights() }))

const { HeroCard } = await import('./HeroCard')
const { ThemeProvider } = await import('../theme/ThemeContext')

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

function renderHeroCard() {
  return render(
    <ThemeProvider themeId="cartography">
      <HeroCard trip={trip} members={members} />
    </ThemeProvider>,
  )
}

describe('HeroCard', () => {
  beforeEach(() => {
    useFlights.mockReset()
    useFlights.mockReturnValue({ flights: [] })
  })

  it('shows the trip name and date range', () => {
    renderHeroCard()
    expect(screen.getByText('東京五日')).toBeInTheDocument()
    expect(screen.getByText('2026-08-01 – 2026-08-05')).toBeInTheDocument()
  })

  it('shows an inclusive day count', () => {
    renderHeroCard()
    expect(screen.getByText('5 日')).toBeInTheDocument()
  })

  it('shows one avatar initial per member', () => {
    renderHeroCard()
    expect(screen.getAllByText('阿')).toHaveLength(2)
  })

  it('shows the member count', () => {
    renderHeroCard()
    expect(screen.getByText('2 人')).toBeInTheDocument()
  })

  it('shows the generic illustration before a destination is known', () => {
    const { container } = renderHeroCard()
    expect(container.querySelector('title')?.textContent).toContain('未知目的地')
  })

  it('shows the destination illustration once the first flight resolves a country', () => {
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
    const { container } = renderHeroCard()
    expect(container.querySelector('title')?.textContent).toContain('日本')
  })
})
