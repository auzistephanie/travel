import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Trip, TripMember } from '../types/models'

const useFlights = vi.fn()
vi.mock('../hooks/useFlights', () => ({ useFlights: () => useFlights() }))

const { Overview } = await import('./Overview')

const trip: Trip = {
  id: 't1',
  name: '東京五日',
  start_date: '2026-08-01',
  end_date: '2026-08-05',
  share_code: 'ABC234',
  created_at: '2026-01-01T00:00:00Z',
}
const members: TripMember[] = [{ id: 'm1', trip_id: 't1', name: '阿明', color: null, is_owner: true }]

describe('Overview', () => {
  beforeEach(() => {
    useFlights.mockReset()
  })

  it('shows existing flights', () => {
    useFlights.mockReturnValue({
      flights: [
        {
          id: 'f1',
          trip_id: 't1',
          code: 'CX123',
          from_airport: 'HKG',
          to_airport: 'NRT',
          from_time: '2026-08-01T10:00:00Z',
          to_time: '2026-08-01T15:00:00Z',
          date: '2026-08-01',
          gate: null,
          terminal: null,
          seat: null,
          pnr: null,
          baggage_kg: null,
          member_id: null,
        },
      ],
      loading: false,
      error: null,
      addFlight: vi.fn(),
    })

    render(<Overview trip={trip} members={members} />)
    expect(screen.getByText('CX123')).toBeInTheDocument()
  })

  it('opens the add-flight modal when the button is clicked', async () => {
    const user = userEvent.setup()
    useFlights.mockReturnValue({ flights: [], loading: false, error: null, addFlight: vi.fn() })

    render(<Overview trip={trip} members={members} />)
    await user.click(screen.getByRole('button', { name: '＋加入航班' }))
    expect(screen.getByRole('heading', { name: '加入航班' })).toBeInTheDocument()
  })
})
