import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AddWishlistForm } from './AddWishlistForm'
import type { ItineraryDay, Trip, TripMember } from '../types/models'

const uploadWishlistPhoto = vi.fn()
vi.mock('../lib/photoRepo', () => ({ uploadWishlistPhoto: (...a: unknown[]) => uploadWishlistPhoto(...a) }))

const searchStoresForItem = vi.fn()
vi.mock('../lib/storeSuggestApi', () => ({
  searchStoresForItem: (...a: unknown[]) => searchStoresForItem(...a),
}))

const useFlights = vi.fn()
vi.mock('../hooks/useFlights', () => ({ useFlights: () => useFlights() }))

const trip: Trip = {
  id: 't1',
  name: '東京五日',
  start_date: '2026-08-01',
  end_date: '2026-08-05',
  share_code: 'ABC234',
  destination_country: null,
  created_at: '2026-01-01T00:00:00Z',
}
const members: TripMember[] = [{ id: 'm1', trip_id: 't1', name: '阿珍', color: null, is_owner: false }]
const days: ItineraryDay[] = [{ id: 'd1', trip_id: 't1', date: '2026-08-01', order_index: 0 }]

const flightToNRT = {
  id: 'f1',
  trip_id: 't1',
  code: 'CX500',
  from_airport: 'HKG',
  to_airport: 'NRT',
  from_time: '2026-08-01T09:00:00Z',
  to_time: '2026-08-01T14:00:00Z',
  date: '2026-08-01',
  gate: null,
  terminal: null,
  seat: null,
  pnr: null,
  baggage_kg: null,
  member_id: null,
}

function fakeFile() {
  return new File(['bytes'], 'photo.jpg', { type: 'image/jpeg' })
}

describe('AddWishlistForm', () => {
  beforeEach(() => {
    uploadWishlistPhoto.mockReset()
    searchStoresForItem.mockReset()
    useFlights.mockReset()
    useFlights.mockReturnValue({ flights: [flightToNRT] })
  })

  it('submits with the item name and defaults when nothing else is filled in', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()

    render(<AddWishlistForm trip={trip} members={members} days={days} onAdd={onAdd} />)
    await user.type(screen.getByLabelText('想買的東西'), '曲奇')
    await user.click(screen.getByRole('button', { name: '加入心願' }))

    expect(onAdd).toHaveBeenCalledWith({
      name: '曲奇',
      photoUrl: null,
      toMember: '自己',
      linkedDayId: null,
      buyAt: null,
      priceLo: null,
      priceHi: null,
      tip: null,
    })
  })

  it('uploads a photo and includes its URL on submit', async () => {
    const user = userEvent.setup()
    uploadWishlistPhoto.mockResolvedValue('https://cdn/t1/photo.jpg')
    const onAdd = vi.fn()

    render(<AddWishlistForm trip={trip} members={members} days={days} onAdd={onAdd} />)
    await user.type(screen.getByLabelText('想買的東西'), '曲奇')
    await user.upload(screen.getByLabelText('相片'), fakeFile())
    await screen.findByAltText('心願相片')
    await user.click(screen.getByRole('button', { name: '加入心願' }))

    expect(uploadWishlistPhoto).toHaveBeenCalledWith('t1', expect.any(File))
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ photoUrl: 'https://cdn/t1/photo.jpg' }))
  })

  it('links a chosen day when selected', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()

    render(<AddWishlistForm trip={trip} members={members} days={days} onAdd={onAdd} />)
    await user.type(screen.getByLabelText('想買的東西'), '曲奇')
    await user.selectOptions(screen.getByLabelText('連結到哪一天行程'), 'd1')
    await user.click(screen.getByRole('button', { name: '加入心願' }))

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ linkedDayId: 'd1' }))
  })

  it('searches nearby stores using the destination resolved from the first flight', async () => {
    const user = userEvent.setup()
    searchStoresForItem.mockResolvedValue([
      { name: '銀座曲奇本店', address: '東京都中央区', priceLevel: 'PRICE_LEVEL_MODERATE' },
    ])

    render(<AddWishlistForm trip={trip} members={members} days={days} onAdd={vi.fn()} />)
    await user.type(screen.getByLabelText('想買的東西'), '曲奇')
    await user.click(screen.getByRole('button', { name: 'AI 建議商店' }))

    expect(searchStoresForItem).toHaveBeenCalledWith('曲奇', 35.7647, 140.3864)
    expect(await screen.findByText(/銀座曲奇本店/)).toBeInTheDocument()
  })

  it('fills in 在哪裡買 and a price-level tip when a suggestion is picked', async () => {
    const user = userEvent.setup()
    searchStoresForItem.mockResolvedValue([
      { name: '銀座曲奇本店', address: '東京都中央区', priceLevel: 'PRICE_LEVEL_MODERATE' },
    ])
    const onAdd = vi.fn()

    render(<AddWishlistForm trip={trip} members={members} days={days} onAdd={onAdd} />)
    await user.type(screen.getByLabelText('想買的東西'), '曲奇')
    await user.click(screen.getByRole('button', { name: 'AI 建議商店' }))
    await user.click(await screen.findByRole('button', { name: /銀座曲奇本店/ }))

    expect(screen.getByLabelText('在哪裡買')).toHaveValue('銀座曲奇本店')
    await user.click(screen.getByRole('button', { name: '加入心願' }))

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ buyAt: '銀座曲奇本店', tip: '參考價位：中等' }),
    )
  })

  it('searches nearby stores using the explicit destination_country even with no flights yet', async () => {
    const user = userEvent.setup()
    useFlights.mockReturnValue({ flights: [] })
    searchStoresForItem.mockResolvedValue([
      { name: '曼谷夜市', address: 'Bangkok', priceLevel: 'PRICE_LEVEL_INEXPENSIVE' },
    ])

    render(
      <AddWishlistForm trip={{ ...trip, destination_country: 'TH' }} members={members} days={days} onAdd={vi.fn()} />,
    )
    await user.type(screen.getByLabelText('想買的東西'), '手信')
    await user.click(screen.getByRole('button', { name: 'AI 建議商店' }))

    expect(searchStoresForItem).toHaveBeenCalledWith('手信', 13.69, 100.7501)
    expect(await screen.findByText(/曼谷夜市/)).toBeInTheDocument()
  })

  it('shows a hint instead of an error when no store is found', async () => {
    const user = userEvent.setup()
    searchStoresForItem.mockResolvedValue([])

    render(<AddWishlistForm trip={trip} members={members} days={days} onAdd={vi.fn()} />)
    await user.type(screen.getByLabelText('想買的東西'), 'ㄈㄈㄈ')
    await user.click(screen.getByRole('button', { name: 'AI 建議商店' }))

    expect(await screen.findByText('找不到相關商店')).toBeInTheDocument()
  })
})
