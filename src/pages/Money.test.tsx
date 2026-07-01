import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Trip, TripMember } from '../types/models'

const useExpenses = vi.fn()
vi.mock('../hooks/useExpenses', () => ({ useExpenses: () => useExpenses() }))

const useExchangeRates = vi.fn()
vi.mock('../hooks/useExchangeRates', () => ({ useExchangeRates: (...a: unknown[]) => useExchangeRates(...a) }))

const useGifts = vi.fn()
vi.mock('../hooks/useGifts', () => ({ useGifts: () => useGifts() }))

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
    useGifts.mockReset()
    useGifts.mockReturnValue({ gifts: [], loading: false, error: null, addGift: vi.fn() })
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

  it('groups gifts by recipient with a subtotal, including 自己', async () => {
    const user = userEvent.setup()
    useGifts.mockReturnValue({
      gifts: [
        { id: 'g1', trip_id: 't1', item: '曲奇', store: null, amount: 100, to_member: '自己', source: 'manual' },
        { id: 'g2', trip_id: 't1', item: '手信糖', store: null, amount: 50, to_member: '阿珍', source: 'manual' },
      ],
      loading: false,
      error: null,
      addGift: vi.fn(),
    })

    render(<Money trip={trip} members={members} />)
    await user.click(screen.getByRole('tab', { name: '手信' }))

    expect(screen.getByRole('heading', { name: '自己（小計 100）' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '阿珍（小計 50）' })).toBeInTheDocument()
  })

  it('adds a new gift via the form', async () => {
    const user = userEvent.setup()
    const addGift = vi.fn()
    useGifts.mockReturnValue({ gifts: [], loading: false, error: null, addGift })

    render(<Money trip={trip} members={members} />)
    await user.click(screen.getByRole('tab', { name: '手信' }))
    await user.click(screen.getByRole('button', { name: '＋加手信' }))
    await user.type(screen.getByLabelText('品項'), '曲奇')
    await user.click(screen.getByRole('button', { name: '加入手信' }))

    expect(addGift).toHaveBeenCalledWith(
      expect.objectContaining({ item: '曲奇', toMember: '自己', source: 'manual' }),
    )
  })
})
