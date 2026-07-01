import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Trip, TripMember } from '../types/models'

vi.mock('../components/PackingSmartCard', () => ({
  PackingSmartCard: () => <div>PackingSmartCard</div>,
}))
vi.mock('../components/PackingChecklist', () => ({
  PackingChecklist: () => <div>PackingChecklist</div>,
}))

const useWishlist = vi.fn()
vi.mock('../hooks/useWishlist', () => ({ useWishlist: () => useWishlist() }))

const useItinerary = vi.fn()
vi.mock('../hooks/useItinerary', () => ({ useItinerary: () => useItinerary() }))

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
  beforeEach(() => {
    useWishlist.mockReset()
    useWishlist.mockReturnValue({ items: [], loading: false, error: null, addItem: vi.fn(), deleteItem: vi.fn() })
    useItinerary.mockReset()
    useItinerary.mockReturnValue({ days: [] })
  })

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

  it('lists wishlist items with recipient and linked day', async () => {
    const user = userEvent.setup()
    useWishlist.mockReturnValue({
      items: [
        {
          id: 'w1',
          trip_id: 't1',
          name: '曲奇',
          photo_url: null,
          buy_at: null,
          price_lo: null,
          price_hi: null,
          tip: null,
          linked_day_id: 'd1',
          to_member: '阿珍',
          bought: false,
          actual_store: null,
          actual_amt: null,
          synced_to_gift: false,
        },
      ],
      loading: false,
      error: null,
      addItem: vi.fn(),
      deleteItem: vi.fn(),
    })
    useItinerary.mockReturnValue({ days: [{ id: 'd1', trip_id: 't1', date: '2026-08-01', order_index: 0 }] })

    render(<Prep trip={trip} members={members} />)
    await user.click(screen.getByRole('tab', { name: '心願' }))

    expect(screen.getByText('曲奇')).toBeInTheDocument()
    expect(screen.getByText('買俾：阿珍')).toBeInTheDocument()
    expect(screen.getByText('2026-08-01')).toBeInTheDocument()
  })

  it('adds a new wishlist item via the form', async () => {
    const user = userEvent.setup()
    const addItem = vi.fn()
    useWishlist.mockReturnValue({ items: [], loading: false, error: null, addItem, deleteItem: vi.fn() })

    render(<Prep trip={trip} members={members} />)
    await user.click(screen.getByRole('tab', { name: '心願' }))
    await user.click(screen.getByRole('button', { name: '＋加心願' }))
    await user.type(screen.getByLabelText('想買嘅嘢'), '曲奇')
    await user.click(screen.getByRole('button', { name: '加入心願' }))

    expect(addItem).toHaveBeenCalledWith(expect.objectContaining({ name: '曲奇' }))
  })
})
