import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Trip, TripMember } from '../types/models'

const useExpenses = vi.fn()
vi.mock('../hooks/useExpenses', () => ({ useExpenses: () => useExpenses() }))

const useExchangeRates = vi.fn()
vi.mock('../hooks/useExchangeRates', () => ({ useExchangeRates: (...a: unknown[]) => useExchangeRates(...a) }))

const { Money } = await import('./Money')

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

describe('Money', () => {
  beforeEach(() => {
    useExpenses.mockReset()
    useExpenses.mockReturnValue({ expenses: [], loading: false, error: null, addExpense: vi.fn() })
    useExchangeRates.mockReset()
    useExchangeRates.mockReturnValue({})
  })

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

  it('lists existing expenses', () => {
    useExpenses.mockReturnValue({
      expenses: [
        {
          id: 'e1',
          trip_id: 't1',
          title: '午餐',
          amount: 500,
          currency: 'JPY',
          payer_id: 'm1',
          split_member_ids: ['m1', 'm2'],
          day_id: null,
          category: '餐飲',
          is_trip_base: false,
        },
      ],
      loading: false,
      error: null,
      addExpense: vi.fn(),
    })

    render(<Money trip={trip} members={members} />)
    expect(screen.getByText(/午餐/)).toBeInTheDocument()
  })

  it('adds a new expense via the form', async () => {
    const user = userEvent.setup()
    const addExpense = vi.fn()
    useExpenses.mockReturnValue({ expenses: [], loading: false, error: null, addExpense })

    render(<Money trip={trip} members={members} />)
    await user.click(screen.getByRole('button', { name: '＋加開支' }))
    await user.type(screen.getByLabelText('項目'), '午餐')
    await user.type(screen.getByLabelText('金額'), '500')
    await user.click(screen.getByLabelText('阿明'))
    await user.click(screen.getByRole('button', { name: '加入開支' }))

    expect(addExpense).toHaveBeenCalledWith(expect.objectContaining({ title: '午餐', amount: 500 }))
  })

  it('shows the settlement summary', () => {
    render(<Money trip={trip} members={members} />)
    expect(screen.getByText('結算：大家清晒數')).toBeInTheDocument()
  })
})
