import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FlightCard } from './FlightCard'
import type { Flight } from '../types/models'

const flight: Flight = {
  id: 'f1',
  trip_id: 't1',
  code: 'CX123',
  from_airport: 'HKG',
  to_airport: 'NRT',
  from_time: '2026-08-01T10:00:00Z',
  to_time: '2026-08-01T15:00:00Z',
  date: '2026-08-01',
  gate: 'A1',
  terminal: '1',
  seat: '12A',
  pnr: 'ABCDEF',
  baggage_kg: 30,
  member_id: null,
}

describe('FlightCard', () => {
  it('shows the flight code and route', () => {
    render(<FlightCard flight={flight} />)
    expect(screen.getByText('CX123')).toBeInTheDocument()
    expect(screen.getByText('HKG → NRT')).toBeInTheDocument()
  })

  it('shows gate, terminal, seat and confirmation code when present', () => {
    render(<FlightCard flight={flight} />)
    expect(screen.getByText(/A1/)).toBeInTheDocument()
    expect(screen.getByText(/12A/)).toBeInTheDocument()
    expect(screen.getByText(/ABCDEF/)).toBeInTheDocument()
  })

  it('omits optional fields gracefully when missing', () => {
    render(
      <FlightCard
        flight={{ ...flight, gate: null, terminal: null, seat: null, pnr: null, baggage_kg: null }}
      />,
    )
    expect(screen.getByText('CX123')).toBeInTheDocument()
  })
})
