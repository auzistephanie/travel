import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Trip, TripMember } from '../types/models'

vi.mock('../components/PackingSmartCard', () => ({
  PackingSmartCard: () => <div>PackingSmartCard</div>,
}))
vi.mock('../components/PackingChecklist', () => ({
  PackingChecklist: () => <div>PackingChecklist</div>,
}))

const { Prep } = await import('./Prep')

const trip: Trip = {
  id: 't1',
  name: '東京五日',
  start_date: '2026-08-01',
  end_date: '2026-08-05',
  share_code: 'ABC234',
  created_at: '2026-01-01T00:00:00Z',
}
const members: TripMember[] = []

describe('Prep', () => {
  it('shows packing content by default', () => {
    render(<Prep trip={trip} members={members} />)
    expect(screen.getByText('PackingSmartCard')).toBeInTheDocument()
    expect(screen.getByText('PackingChecklist')).toBeInTheDocument()
  })

  it('switches to the wishlist sub-tab when clicked', async () => {
    const user = userEvent.setup()
    render(<Prep trip={trip} members={members} />)
    await user.click(screen.getByRole('tab', { name: '心願' }))
    expect(screen.queryByText('PackingSmartCard')).not.toBeInTheDocument()
  })
})
