import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Money } from './Money'
import type { Trip, TripMember } from '../types/models'

const trip: Trip = {
  id: 't1',
  name: '東京五日',
  start_date: '2026-08-01',
  end_date: '2026-08-05',
  share_code: 'ABC234',
  created_at: '2026-01-01T00:00:00Z',
}
const members: TripMember[] = []

describe('Money', () => {
  it('shows the 夾錢 sub-tab by default', () => {
    render(<Money trip={trip} members={members} />)
    expect(screen.getByRole('tab', { name: '夾錢' })).toHaveAttribute('aria-selected', 'true')
  })

  it('switches to the 手信 sub-tab when clicked', async () => {
    const user = userEvent.setup()
    render(<Money trip={trip} members={members} />)
    await user.click(screen.getByRole('tab', { name: '手信' }))
    expect(screen.getByRole('tab', { name: '手信' })).toHaveAttribute('aria-selected', 'true')
  })
})
