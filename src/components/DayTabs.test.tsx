import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DayTabs } from './DayTabs'
import type { ItineraryDay } from '../types/models'

const days: ItineraryDay[] = [
  { id: 'd1', trip_id: 't1', date: '2026-08-01', order_index: 0 },
  { id: 'd2', trip_id: 't1', date: '2026-08-02', order_index: 1 },
]

describe('DayTabs', () => {
  it('renders one tab per day with a formatted date label', () => {
    render(<DayTabs days={days} activeDayId="d1" onChange={() => {}} />)
    expect(screen.getByRole('tab', { name: '08/01' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '08/02' })).toBeInTheDocument()
  })

  it('marks the active day as selected', () => {
    render(<DayTabs days={days} activeDayId="d2" onChange={() => {}} />)
    expect(screen.getByRole('tab', { name: '08/02' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: '08/01' })).toHaveAttribute('aria-selected', 'false')
  })

  it('calls onChange with the day id when a tab is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<DayTabs days={days} activeDayId="d1" onChange={onChange} />)
    await user.click(screen.getByRole('tab', { name: '08/02' }))
    expect(onChange).toHaveBeenCalledWith('d2')
  })
})
