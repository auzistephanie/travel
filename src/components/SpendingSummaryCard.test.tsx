import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SpendingSummaryCard } from './SpendingSummaryCard'
import type { Trip, TripMember } from '../types/models'

const useExpenses = vi.fn()
vi.mock('../hooks/useExpenses', () => ({ useExpenses: () => useExpenses() }))

const useItinerary = vi.fn()
vi.mock('../hooks/useItinerary', () => ({ useItinerary: () => useItinerary() }))

const useExchangeRates = vi.fn()
vi.mock('../hooks/useExchangeRates', () => ({ useExchangeRates: (...a: unknown[]) => useExchangeRates(...a) }))

const trip: Trip = {
  id: 't1',
  name: '東京五日',
  start_date: '2026-08-01',
  end_date: '2026-08-02',
  share_code: 'ABC234',
  destination_country: null,
  created_at: '2026-01-01T00:00:00Z',
}
const members: TripMember[] = []
const days = [
  { id: 'd1', trip_id: 't1', date: '2026-08-01', order_index: 0 },
  { id: 'd2', trip_id: 't1', date: '2026-08-02', order_index: 1 },
]

function expenseFixture() {
  return [
    {
      id: 'e1',
      trip_id: 't1',
      title: '機票',
      amount: 3000,
      currency: 'HKD',
      payer_id: 'm1',
      split_member_ids: ['m1'],
      day_id: null,
      category: '交通',
      is_trip_base: true,
    },
    {
      id: 'e2',
      trip_id: 't1',
      title: '午餐',
      amount: 100,
      currency: 'HKD',
      payer_id: 'm1',
      split_member_ids: ['m1'],
      day_id: 'd1',
      category: '餐飲',
      is_trip_base: false,
    },
  ]
}

describe('SpendingSummaryCard', () => {
  beforeEach(() => {
    useExpenses.mockReset()
    useItinerary.mockReset()
    useItinerary.mockReturnValue({ days })
    useExchangeRates.mockReset()
    useExchangeRates.mockReturnValue({})
  })

  it('shows the trip-base card pinned above the toggle views', () => {
    useExpenses.mockReturnValue({ expenses: expenseFixture() })
    render(<SpendingSummaryCard trip={trip} members={members} />)
    expect(screen.getByLabelText('旅行基本費')).toHaveTextContent('HK$3000')
  })

  it('shows daily totals by default, excluding trip-base expenses', () => {
    useExpenses.mockReturnValue({ expenses: expenseFixture() })
    render(<SpendingSummaryCard trip={trip} members={members} />)
    expect(screen.getByText(/2026-08-01：HK\$100/)).toBeInTheDocument()
    expect(screen.getByText(/2026-08-02：HK\$0/)).toBeInTheDocument()
  })

  it('switches to category totals, including trip-base expenses, with a percentage share', async () => {
    const user = userEvent.setup()
    useExpenses.mockReturnValue({ expenses: expenseFixture() })
    render(<SpendingSummaryCard trip={trip} members={members} />)

    await user.click(screen.getByRole('button', { name: '分類總覽' }))

    expect(screen.getByText(/交通：HK\$3000（97%）/)).toBeInTheDocument()
    expect(screen.getByText(/餐飲：HK\$100（3%）/)).toBeInTheDocument()
  })
})
