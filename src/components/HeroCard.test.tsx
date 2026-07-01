import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HeroCard } from './HeroCard'
import type { Trip, TripMember } from '../types/models'

const trip: Trip = {
  id: 't1',
  name: '東京五日',
  start_date: '2026-08-01',
  end_date: '2026-08-05',
  share_code: 'ABC234',
  created_at: '2026-01-01T00:00:00Z',
}

const members: TripMember[] = [
  { id: 'm1', trip_id: 't1', name: '阿明', color: null, is_owner: true },
  { id: 'm2', trip_id: 't1', name: '阿珍', color: null, is_owner: false },
]

describe('HeroCard', () => {
  it('shows the trip name and date range', () => {
    render(<HeroCard trip={trip} members={members} />)
    expect(screen.getByText('東京五日')).toBeInTheDocument()
    expect(screen.getByText('2026-08-01 – 2026-08-05')).toBeInTheDocument()
  })

  it('shows an inclusive day count', () => {
    render(<HeroCard trip={trip} members={members} />)
    expect(screen.getByText('5 日')).toBeInTheDocument()
  })

  it('shows one avatar initial per member', () => {
    render(<HeroCard trip={trip} members={members} />)
    expect(screen.getAllByText('阿')).toHaveLength(2)
  })

  it('shows the member count', () => {
    render(<HeroCard trip={trip} members={members} />)
    expect(screen.getByText('2 人')).toBeInTheDocument()
  })
})
